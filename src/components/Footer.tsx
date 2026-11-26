import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-navy-900/10 bg-navy-950 text-white/70">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="mb-2 text-lg font-extrabold text-white">SAFE<span className="text-brand-red">BD</span></div>
            <p className="text-sm">Helping families report missing persons and coordinate authorized emergency assistance across Bangladesh.</p>
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold text-white">Quick links</div>
            <ul className="space-y-1 text-sm">
              <li><Link href="/missing-person/report" className="hover:text-white">Report a Missing Person</Link></li>
              <li><Link href="/safety" className="hover:text-white">Emergency Safety</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold text-white">Important</div>
            <p className="text-sm">SAFEBD never reveals a person&apos;s GPS location from a phone number alone. Location is only available through voluntary consent or an authorized process.</p>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-6 text-xs">© {new Date().getFullYear()} SAFEBD — Demo / local-development build.</div>
      </div>
    </footer>
  );
}
