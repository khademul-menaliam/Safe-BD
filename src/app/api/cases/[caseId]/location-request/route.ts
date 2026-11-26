import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { locationRequestSchema } from "@/lib/validators";
import { getAuthorizedLocationProvider } from "@/lib/locationProvider";
import { canRequestLocationAssistance, recordLocationRequestUsage } from "@/lib/subscription";
import { writeAuditLog, getClientIp } from "@/lib/audit";

/**
 * POST /api/cases/[caseId]/location-request
 *
 * Creates an authorized location request for a VERIFIED case. This never
 * performs real telecom tracking — see src/lib/locationProvider.ts. Only
 * AUTHORITY/ADMIN users may initiate this, and only for cases whose GD has
 * been verified AND whose reporting family account has an active
 * subscription that includes this feature (see src/lib/subscription.ts) —
 * gating it this way discourages spam/misuse of a feature that creates real
 * downstream work for police/telecom coordination.
 */
export async function POST(req: Request, { params }: { params: { caseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (role !== "AUTHORITY" && role !== "ADMIN") {
    return NextResponse.json({ error: "Only authorized personnel can request location assistance." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = locationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const c = await prisma.missingPersonCase.findUnique({
    where: { caseNumber: params.caseId },
    include: { gdDocuments: { where: { status: "VERIFIED" }, orderBy: { createdAt: "desc" } } },
  });
  if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const verifiedGD = c.gdDocuments[0];
  if (!verifiedGD) {
    return NextResponse.json(
      { error: "This case does not yet have a verified GD document. Verify the GD before requesting location assistance." },
      { status: 400 }
    );
  }

  // Subscription gate, checked against the case's REPORTER (the family
  // account), not the requesting authority — the authority acts on the
  // family's behalf, and it's the family's plan that unlocks this feature.
  const gate = await canRequestLocationAssistance(c.reporterId);
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.reason, upgradeRequired: true }, { status: 402 });
  }

  const locationRequest = await prisma.locationRequest.create({
    data: {
      caseId: c.id,
      gdNumber: verifiedGD.gdNumber,
      policeStation: verifiedGD.policeStation,
      missingPersonPhone: c.phone,
      lastKnownLocation: c.lastSeenLocation,
      reason: parsed.data.reason,
      requestingAuthorityId: userId,
      status: "PENDING",
    },
  });

  await prisma.missingPersonCase.update({
    where: { id: c.id },
    data: { status: "LOCATION_ASSISTANCE_REQUESTED", timeline: { create: { label: "Location Assistance Requested", description: parsed.data.reason, actorId: userId } } },
  });

  const provider = getAuthorizedLocationProvider();
  const result = await provider.requestLocation({
    caseId: c.id,
    gdNumber: verifiedGD.gdNumber,
    policeStation: verifiedGD.policeStation,
    missingPersonPhone: c.phone,
    lastKnownLocation: c.lastSeenLocation,
    reason: parsed.data.reason,
  });

  await prisma.locationRequest.update({ where: { id: locationRequest.id }, data: { status: result.status, providerReference: result.providerReference } });

  if (result.location) {
    await prisma.authorizedLocation.create({
      data: {
        caseId: c.id, locationRequestId: locationRequest.id,
        latitude: result.location.latitude, longitude: result.location.longitude,
        address: result.location.address, accuracyMeters: result.location.accuracyMeters,
        isCurrent: result.location.isCurrent, source: "DEMO_MOCK_PROVIDER",
        isDemoData: result.isDemoData, verificationStatus: result.verificationStatus,
        capturedAt: new Date(result.location.capturedAt),
      },
    });

    await prisma.missingPersonCase.update({
      where: { id: c.id },
      data: { status: "LOCATION_INFORMATION_RECEIVED", timeline: { create: { label: "Location Information Received", description: result.message, actorId: userId } } },
    });
  }

  // Count this request against the FAMILY account's plan quota, now that it
  // actually succeeded.
  await recordLocationRequestUsage(c.reporterId);

  await writeAuditLog({
    userId, action: "LOCATION_REQUEST_CREATED", caseId: c.id,
    metadata: { locationRequestId: locationRequest.id, providerReference: result.providerReference, billedTo: c.reporterId },
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ success: true, result });
}
