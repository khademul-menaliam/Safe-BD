"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-navy-900/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-navy-950">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-white text-sm">S</span>
          <span className="text-lg tracking-tight">SAFE<span className="text-brand-red">BD</span></span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-navy-900/80 md:flex">
          <Link href="/missing-person/report" className="hover:text-navy-950">Report Missing Person</Link>
          <Link href="/safety" className="hover:text-navy-950">Emergency Safety</Link>
          <Link href="/pricing" className="hover:text-navy-950">Pricing</Link>
          <Link href="/privacy" className="hover:text-navy-950">Privacy</Link>
          {session?.user && <Link href="/dashboard" className="hover:text-navy-950">Dashboard</Link>}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {session?.user ? (
            <>
              <span className="text-sm text-navy-900/70">{session.user.name}</span>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-secondary !py-2">Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary !py-2">Log in</Link>
              <Link href="/register" className="btn-primary !py-2">Get Started</Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          <div className="space-y-1.5">
            <span className="block h-0.5 w-6 bg-navy-950" />
            <span className="block h-0.5 w-6 bg-navy-950" />
            <span className="block h-0.5 w-6 bg-navy-950" />
          </div>
        </button>
      </div>

      {open && (
        <div className="border-t border-navy-900/10 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium">
            <Link href="/missing-person/report" onClick={() => setOpen(false)}>Report Missing Person</Link>
            <Link href="/safety" onClick={() => setOpen(false)}>Emergency Safety</Link>
            <Link href="/pricing" onClick={() => setOpen(false)}>Pricing</Link>
            <Link href="/privacy" onClick={() => setOpen(false)}>Privacy</Link>
            {session?.user ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
                <button className="text-left text-brand-red" onClick={() => signOut({ callbackUrl: "/" })}>Log out</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>Log in</Link>
                <Link href="/register" onClick={() => setOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
