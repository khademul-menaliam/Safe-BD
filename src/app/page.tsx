import Link from "next/link";

const STEPS = [
  { n: "1", title: "Report", desc: "A family member submits a missing-person report with photos and details." },
  { n: "2", title: "Submit GD", desc: "Upload the General Diary (GD) filed with Bangladesh Police to verify the case." },
  { n: "3", title: "Verification", desc: "Authorized personnel review and verify the case and GD document." },
  { n: "4", title: "Authorized Assistance", desc: "Verified cases on a paid plan can request authorized location assistance from police." },
  { n: "5", title: "Case Updates", desc: "Families track status and receive updates until the case is resolved." },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 to-navy-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-3xl">
            <span className="badge bg-white/10 text-white">Women&apos;s Safety &amp; Missing Person Assistance</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl">
              When Someone Goes Missing, Every Minute Matters.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/80">
              SAFEBD helps families report missing persons, securely submit information, and coordinate
              authorized emergency assistance.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/missing-person/report" className="btn-danger !px-6 !py-3.5 text-base">
                Report a Missing Person
              </Link>
              <Link href="/safety" className="btn bg-white text-navy-950 hover:bg-white/90 !px-6 !py-3.5 text-base">
                Emergency Safety
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-navy-950">How It Works</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s) => (
            <div key={s.n} className="card">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">{s.n}</div>
              <div className="mt-3 font-semibold text-navy-950">{s.title}</div>
              <div className="mt-1 text-sm text-gray-600">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy-950/[0.02] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-navy-950">Women&apos;s Safety</h2>
          <p className="mt-2 max-w-2xl text-gray-600">Tools for registered users to stay safer every day — always on your terms.</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "SOS", desc: "One tap to alert trusted contacts and share your live location in an emergency." },
              { title: "Live Location Sharing", desc: "Voluntarily share your real-time GPS location for a set duration." },
              { title: "Trusted Contacts", desc: "Choose who can see your shared location and emergency alerts." },
              { title: "Temporary Sharing", desc: "Share for 15 minutes, 30 minutes, 1 hour, or until you stop it." },
            ].map((f) => (
              <div key={f.title} className="card">
                <div className="font-semibold text-navy-950">{f.title}</div>
                <div className="mt-1 text-sm text-gray-600">{f.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link href="/register" className="btn-primary">Create a Safety Profile</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="card border-l-4 border-l-navy-700">
          <h2 className="text-xl font-bold text-navy-950">Privacy, by design</h2>
          <p className="mt-2 max-w-3xl text-gray-600">
            A phone number alone is never enough to reveal someone&apos;s location on SAFEBD. Location
            information is only available when a registered user voluntarily shares it, or when it is supplied
            through a verified, authorized process such as police coordination with a telecom operator.
          </p>
          <Link href="/privacy" className="mt-4 inline-block font-semibold text-navy-800 underline">
            Read our full privacy explanation →
          </Link>
        </div>

        <div className="card mt-6 border-l-4 border-l-brand-amber">
          <h2 className="text-xl font-bold text-navy-950">Why some features require a subscription</h2>
          <p className="mt-2 max-w-3xl text-gray-600">
            Reporting a case and tracking GD verification is always free. Submitting an authorized
            location-assistance request creates real work for police/telecom coordination, so that step
            requires an active paid plan — this keeps the system usable and discourages spam or misuse.
          </p>
          <Link href="/pricing" className="mt-4 inline-block font-semibold text-navy-800 underline">
            See plans &amp; pricing →
          </Link>
        </div>
      </section>
    </div>
  );
}
