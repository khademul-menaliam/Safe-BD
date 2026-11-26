/**
 * AuthorizedLocationProvider
 * ---------------------------------------------------------------------------
 * Clean service-abstraction boundary for requesting location information
 * about a missing person through a LEGALLY AUTHORIZED channel (e.g. police
 * liaison with a telecom operator acting under lawful process).
 *
 * SAFEBD DOES NOT: query cellular towers, perform SS7/location hacking,
 * scrape telecom systems, bypass device permissions, or use a phone number
 * alone to silently obtain someone's GPS location.
 *
 * This build ships MockAuthorizedLocationProvider, which always returns
 * clearly-labeled DEMO data. A production deployment swaps in a real,
 * authorized implementation — see README "Authorized Location Provider
 * Integration Point".
 * ---------------------------------------------------------------------------
 */

export interface LocationRequestInput {
  caseId: string;
  gdNumber: string;
  policeStation: string;
  missingPersonPhone?: string | null;
  lastKnownLocation?: string | null;
  reason: string;
}

export interface LocationRequestResult {
  status: "SUBMITTED" | "PROCESSING" | "RECEIVED" | "REJECTED";
  providerReference: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracyMeters?: number;
    isCurrent: boolean;
    capturedAt: string;
  };
  isDemoData: boolean;
  verificationStatus: string;
  message: string;
}

export interface AuthorizedLocationProvider {
  requestLocation(input: LocationRequestInput): Promise<LocationRequestResult>;
}

export class MockAuthorizedLocationProvider implements AuthorizedLocationProvider {
  async requestLocation(input: LocationRequestInput): Promise<LocationRequestResult> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const seed = hashString(input.caseId);
    const latOffset = ((seed % 1000) / 1000 - 0.5) * 0.2;
    const lngOffset = (((seed >> 8) % 1000) / 1000 - 0.5) * 0.2;

    return {
      status: "RECEIVED",
      providerReference: `MOCK-${seed.toString(16).toUpperCase()}`,
      location: {
        latitude: 23.8103 + latOffset,
        longitude: 90.4125 + lngOffset,
        address: "DEMO LOCATION — Dhaka area (not a real address)",
        accuracyMeters: 500,
        isCurrent: false,
        capturedAt: new Date().toISOString(),
      },
      isDemoData: true,
      verificationStatus: "DEMO LOCATION — Not a real person's location",
      message:
        "This is demo data from MockAuthorizedLocationProvider for local development. " +
        "No real telecom or law-enforcement system was contacted.",
    };
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAuthorizedLocationProvider(): AuthorizedLocationProvider {
  return new MockAuthorizedLocationProvider();
}
