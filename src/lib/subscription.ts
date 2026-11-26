import { prisma } from "./db";

/**
 * Subscription gating helpers.
 *
 * Rationale: authorized location-assistance requests create real downstream
 * work (an authority acting on a case) and bulk case creation is a vector
 * for spam/abuse if left completely free. Gating both behind a paid,
 * identity-linked subscription (see paymentProvider.ts) discourages misuse
 * without blocking the core safety mission — every FAMILY_USER still gets
 * one free active case and the full GD-verification workflow at no cost.
 */

export async function getOrCreateFreeSubscription(userId: string) {
  const existing = await prisma.subscription.findUnique({ where: { userId }, include: { plan: true } });
  if (existing) return existing;

  const freePlan = await prisma.subscriptionPlan.findFirst({ where: { isDefault: true } });
  if (!freePlan) throw new Error("No default subscription plan configured. Run the seed script.");

  return prisma.subscription.create({
    data: { userId, planId: freePlan.id, status: "ACTIVE" },
    include: { plan: true },
  });
}

export async function getActiveSubscription(userId: string) {
  const sub = await getOrCreateFreeSubscription(userId);

  // A paid period that has lapsed falls back to free-plan limits rather
  // than silently staying "active" forever.
  if (sub.status === "ACTIVE" && sub.currentPeriodEnd && sub.currentPeriodEnd < new Date()) {
    const freePlan = await prisma.subscriptionPlan.findFirst({ where: { isDefault: true } });
    if (freePlan) {
      return prisma.subscription.update({
        where: { userId },
        data: { planId: freePlan.id, status: "EXPIRED", currentPeriodStart: null, currentPeriodEnd: null },
        include: { plan: true },
      });
    }
  }
  return sub;
}

export async function canCreateNewCase(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const sub = await getActiveSubscription(userId);
  if (sub.plan.maxActiveCases < 0) return { allowed: true };

  const activeCaseCount = await prisma.missingPersonCase.count({
    where: { reporterId: userId, status: { notIn: ["RESOLVED", "CLOSED", "REJECTED"] } },
  });

  if (activeCaseCount >= sub.plan.maxActiveCases) {
    return {
      allowed: false,
      reason: `Your current plan (${sub.plan.name}) allows ${sub.plan.maxActiveCases} active case(s). Upgrade your subscription to report additional missing-person cases.`,
    };
  }
  return { allowed: true };
}

export async function canRequestLocationAssistance(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const sub = await getActiveSubscription(userId);

  if (sub.plan.locationRequestsIncluded === 0) {
    return {
      allowed: false,
      reason: `Authorized location-assistance requests require an active paid subscription. Your current plan (${sub.plan.name}) does not include this feature.`,
    };
  }
  if (sub.plan.locationRequestsIncluded < 0) return { allowed: true };

  if (sub.locationRequestsUsedThisPeriod >= sub.plan.locationRequestsIncluded) {
    return {
      allowed: false,
      reason: `You've used all ${sub.plan.locationRequestsIncluded} authorized location-assistance request(s) included in your current billing period. Upgrade your plan or wait for renewal.`,
    };
  }
  return { allowed: true };
}

export async function recordLocationRequestUsage(userId: string) {
  await prisma.subscription.update({
    where: { userId },
    data: { locationRequestsUsedThisPeriod: { increment: 1 } },
  });
}
