import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 12);

  // ------------------------------------------------------------------
  // Subscription plans
  // ------------------------------------------------------------------
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { code: "FREE" },
    update: {},
    create: {
      code: "FREE", name: "Free", description: "Report missing-person cases and track GD verification at no cost.",
      priceBDT: 0, billingCycle: null, maxActiveCases: 1, locationRequestsIncluded: 0, isDefault: true,
    },
  });

  const familyMonthly = await prisma.subscriptionPlan.upsert({
    where: { code: "FAMILY_MONTHLY" },
    update: {},
    create: {
      code: "FAMILY_MONTHLY", name: "Family Monthly", description: "For families actively working a case: more active cases and authorized location-assistance requests.",
      priceBDT: 500, billingCycle: "MONTHLY", maxActiveCases: 3, locationRequestsIncluded: 5, isDefault: false,
    },
  });

  const familyYearly = await prisma.subscriptionPlan.upsert({
    where: { code: "FAMILY_YEARLY" },
    update: {},
    create: {
      code: "FAMILY_YEARLY", name: "Family Yearly", description: "Same as Family Monthly, billed yearly at a discount.",
      priceBDT: 5000, billingCycle: "YEARLY", maxActiveCases: 3, locationRequestsIncluded: 60, isDefault: false,
    },
  });

  // ------------------------------------------------------------------
  // Demo users
  // ------------------------------------------------------------------
  const family = await prisma.user.upsert({
    where: { phone: "+8801700000001" }, update: {},
    create: { fullName: "Rahima Begum", phone: "+8801700000001", email: "family.demo@safebd.test", passwordHash: password, role: "FAMILY_USER" },
  });

  const registered = await prisma.user.upsert({
    where: { phone: "+8801700000002" }, update: {},
    create: { fullName: "Nusrat Jahan", phone: "+8801700000002", email: "registered.demo@safebd.test", passwordHash: password, role: "REGISTERED_PERSON", registeredProfile: { create: {} } },
  });

  const authority = await prisma.user.upsert({
    where: { phone: "+8801700000003" }, update: {},
    create: { fullName: "SI Karim Ahmed", phone: "+8801700000003", email: "authority.demo@safebd.test", passwordHash: password, role: "AUTHORITY" },
  });

  const admin = await prisma.user.upsert({
    where: { phone: "+8801700000004" }, update: {},
    create: { fullName: "SAFEBD Admin", phone: "+8801700000004", email: "admin.demo@safebd.test", passwordHash: password, role: "ADMIN" },
  });

  // Every demo user gets a subscription row; family starts on an ACTIVE
  // paid plan so the seeded demo case can go all the way through an
  // authorized location-assistance request out of the box.
  for (const u of [registered, authority, admin]) {
    await prisma.subscription.upsert({ where: { userId: u.id }, update: {}, create: { userId: u.id, planId: freePlan.id, status: "ACTIVE" } });
  }
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  await prisma.subscription.upsert({
    where: { userId: family.id },
    update: { planId: familyMonthly.id, status: "ACTIVE", currentPeriodStart: now, currentPeriodEnd: periodEnd },
    create: { userId: family.id, planId: familyMonthly.id, status: "ACTIVE", currentPeriodStart: now, currentPeriodEnd: periodEnd },
  });
  await prisma.payment.create({
    data: { userId: family.id, planId: familyMonthly.id, amountBDT: familyMonthly.priceBDT, status: "SUCCEEDED", providerReference: "DEMO-SEED-0001", isDemoPayment: true },
  });

  // ------------------------------------------------------------------
  // Demo case
  // ------------------------------------------------------------------
  const existingCase = await prisma.missingPersonCase.findUnique({ where: { caseNumber: "BD-MP-DEMO-001" } });
  if (!existingCase) {
    const demoCase = await prisma.missingPersonCase.create({
      data: {
        caseNumber: "BD-MP-DEMO-001", fullName: "Demo Person", nickname: "Demo", age: 24, gender: "Female",
        phone: "+8801700000000", lastSeenLocation: "Mirpur, Dhaka", lastSeenDate: new Date(), lastSeenTime: "18:30",
        clothingDescription: "DEMO DATA — not a real person.", physicalDescription: "DEMO DATA — not a real person.",
        reporterId: family.id, reporterRelationship: "Sister", reporterPhone: family.phone, reporterEmail: family.email,
        status: "UNDER_REVIEW", isDemo: true,
        timeline: { create: [
          { label: "Case Created", description: "Demo case seeded for local development.", actorId: family.id },
          { label: "GD Uploaded", description: "Demo GD document attached.", actorId: family.id },
        ] },
        gdDocuments: { create: {
          gdNumber: "GD-DEMO-001", policeStation: "Demo Police Station", gdFilingDate: new Date(), reporterName: "Rahima Begum",
          fileName: "demo-gd.txt", storedFileName: "demo-gd-placeholder.txt", mimeType: "text/plain", fileSizeBytes: 42, status: "PENDING",
        } },
      },
    });
    console.log(`Seeded demo case ${demoCase.caseNumber}`);
  }

  console.log("Seed complete.");
  console.log({ family: family.phone, registered: registered.phone, authority: authority.phone, admin: admin.phone });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
