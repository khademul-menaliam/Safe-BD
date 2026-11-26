import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { subscribeSchema } from "@/lib/validators";
import { getPaymentProvider } from "@/lib/paymentProvider";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { rateLimit } from "@/lib/ratelimit";

/**
 * POST /api/billing/subscribe
 *
 * Charges the signed-in user (via PaymentProvider — mocked in this build,
 * see src/lib/paymentProvider.ts) and activates/upgrades their subscription
 * for one billing cycle. No real card data is ever sent anywhere real:
 * the "card" fields here are only validated for shape and never stored —
 * only the last 4 digits are kept on the Payment record, for display.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const ip = getClientIp(req) ?? "unknown";
  if (!rateLimit(`subscribe:${userId}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  const parsed = subscribeSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  const plan = await prisma.subscriptionPlan.findUnique({ where: { code: parsed.data.planCode } });
  if (!plan || !plan.isActive) return NextResponse.json({ error: "Plan not found." }, { status: 404 });

  if (plan.priceBDT === 0) {
    return NextResponse.json({ error: "This is the free plan and needs no payment — it's already active by default." }, { status: 400 });
  }

  // Basic shape checks only — this is a demo payment flow, not a real card validator.
  const digitsOnly = parsed.data.cardNumber.replace(/\s/g, "");
  if (!/^\d{12,19}$/.test(digitsOnly)) {
    return NextResponse.json({ error: "Enter a valid card number." }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({ where: { userId } });

  const payment = await prisma.payment.create({
    data: { userId, planId: plan.id, subscriptionId: sub?.id, amountBDT: plan.priceBDT, status: "PENDING" },
  });

  const provider = getPaymentProvider();
  const result = await provider.charge({
    userId, amountBDT: plan.priceBDT, cardNumberLast4: digitsOnly.slice(-4),
    description: `SAFEBD subscription — ${plan.name}`,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: result.status, providerReference: result.providerReference, isDemoPayment: result.isDemoPayment, failureReason: result.failureReason },
  });

  if (result.status !== "SUCCEEDED") {
    await writeAuditLog({ userId, action: "PAYMENT_FAILED", metadata: { planCode: plan.code, paymentId: payment.id }, ipAddress: ip });
    return NextResponse.json({ error: result.failureReason ?? "Payment failed. Please try again.", payment }, { status: 402 });
  }

  const now = new Date();
  const periodEnd = new Date(now);
  if (plan.billingCycle === "YEARLY") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  else periodEnd.setMonth(periodEnd.getMonth() + 1);

  const updatedSub = await prisma.subscription.upsert({
    where: { userId },
    update: { planId: plan.id, status: "ACTIVE", currentPeriodStart: now, currentPeriodEnd: periodEnd, locationRequestsUsedThisPeriod: 0, cancelAtPeriodEnd: false },
    create: { userId, planId: plan.id, status: "ACTIVE", currentPeriodStart: now, currentPeriodEnd: periodEnd },
    include: { plan: true },
  });

  await prisma.payment.update({ where: { id: payment.id }, data: { subscriptionId: updatedSub.id } });

  await prisma.notification.create({
    data: { userId, type: "BILLING", title: "Subscription activated", body: `Your ${plan.name} plan is now active until ${periodEnd.toLocaleDateString()}. (Demo payment — no real charge was made.)` },
  });

  await writeAuditLog({ userId, action: "SUBSCRIPTION_ACTIVATED", metadata: { planCode: plan.code, paymentId: payment.id }, ipAddress: ip });

  return NextResponse.json({ success: true, subscription: updatedSub, payment: { ...payment, status: result.status } });
}
