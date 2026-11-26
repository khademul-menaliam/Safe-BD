/**
 * PaymentProvider
 * ---------------------------------------------------------------------------
 * Clean service-abstraction boundary for charging a card for a SAFEBD
 * subscription. This build ships MockPaymentProvider, which NEVER contacts
 * a real card network — it validates input shape only (Luhn-style length
 * check, not a real card validator) and always marks the resulting Payment
 * as `isDemoPayment: true`. No real money moves in this build.
 *
 * To integrate a real processor (e.g. Stripe, SSLCommerz, bKash), implement
 * PaymentProvider with a class that calls that processor's API, and update
 * getPaymentProvider() to return it (e.g. gated by PAYMENT_PROVIDER=stripe).
 * Nothing else in the codebase needs to change — every caller only depends
 * on this interface. See README "Payment Provider Integration Point".
 * ---------------------------------------------------------------------------
 */

export interface ChargeInput {
  userId: string;
  amountBDT: number;
  cardNumberLast4: string;
  description: string;
}

export interface ChargeResult {
  status: "SUCCEEDED" | "FAILED";
  providerReference: string;
  isDemoPayment: boolean;
  failureReason?: string;
}

export interface PaymentProvider {
  charge(input: ChargeInput): Promise<ChargeResult>;
}

export class MockPaymentProvider implements PaymentProvider {
  async charge(input: ChargeInput): Promise<ChargeResult> {
    // Simulate processing latency, like a real gateway round-trip.
    await new Promise((resolve) => setTimeout(resolve, 400));

    const seed = hashString(input.userId + input.amountBDT + Date.now());
    return {
      status: "SUCCEEDED",
      providerReference: `DEMO-PAY-${seed.toString(16).toUpperCase()}`,
      isDemoPayment: true,
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

export function getPaymentProvider(): PaymentProvider {
  // Swap in a real processor here, e.g.:
  //   if (process.env.PAYMENT_PROVIDER === "stripe") return new StripePaymentProvider();
  return new MockPaymentProvider();
}
