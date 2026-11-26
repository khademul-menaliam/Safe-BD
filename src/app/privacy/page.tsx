const POINTS = [
  "A phone number alone cannot reveal a GPS location through SAFEBD. There is no feature that converts a phone number into a live map pin.",
  "Live location sharing on SAFEBD is only available to a registered user who has voluntarily granted browser location permission. It can be revoked at any time.",
  "For a missing-person case, location information is only shown after it is supplied through an authorized process — for example, police coordination with a telecom operator under lawful process — never by SAFEBD querying telecom or cellular systems directly.",
  "Authorized location-assistance requests additionally require an active paid subscription on the reporting family's account. This is a deliberate usage control, not a technical capability change — it exists to deter spam and misuse of a feature that creates real work for police/telecom coordination.",
  "GD (General Diary) documents uploaded for a case are private. They are stored outside any public directory and can only be viewed by the case reporter and authorized personnel.",
  "Location information tied to a case is restricted to the case reporter, and to authorized personnel (police / admin) working the case.",
  "Trusted contacts only see a registered user's shared location if that user has explicitly given them access, and only while a share is active.",
  "Users can revoke voluntary location sharing at any time by pressing Stop Sharing, or by removing a trusted contact's access.",
  "Payment card details entered for a subscription are validated only for shape in this demo build and are never stored — only the last 4 digits are kept, for display on receipts.",
  "Data retention follows applicable law and SAFEBD's organizational data-retention policy; SAFEBD does not make specific unsupported claims about Bangladeshi law in this demo build.",
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950">Privacy at SAFEBD</h1>
      <p className="mt-2 text-gray-600">
        SAFEBD is built around one core rule: location information is only ever available through
        voluntary consent or a verified, authorized process — never guessed from a phone number.
      </p>

      <div className="card mt-8 space-y-4">
        {POINTS.map((p, i) => (
          <div key={i} className="flex gap-3">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-navy-700" />
            <p className="text-sm text-gray-700">{p}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 border-l-4 border-l-brand-amber">
        <h2 className="font-semibold text-navy-950">About the demo location provider</h2>
        <p className="mt-2 text-sm text-gray-600">
          In this local/development build, authorized location requests are served by a clearly-labeled
          mock provider that returns demo data anchored near Dhaka. It never represents a real person&apos;s
          actual location. A production deployment would replace it with an officially authorized
          integration under a documented legal process.
        </p>
      </div>

      <div className="card mt-6 border-l-4 border-l-navy-700">
        <h2 className="font-semibold text-navy-950">About the demo payment provider</h2>
        <p className="mt-2 text-sm text-gray-600">
          Subscription payments in this build go through a mock payment provider. No real card network
          is contacted and no real money moves. A production deployment would replace it with a real,
          PCI-compliant payment processor.
        </p>
      </div>
    </div>
  );
}
