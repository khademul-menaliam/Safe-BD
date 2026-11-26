"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", roles: ["FAMILY_USER", "REGISTERED_PERSON", "AUTHORITY", "ADMIN"] },
  { href: "/dashboard/cases", label: "Missing Person Cases", roles: ["FAMILY_USER", "AUTHORITY", "ADMIN"] },
  { href: "/missing-person/report", label: "Report Missing Person", roles: ["FAMILY_USER", "AUTHORITY", "ADMIN"] },
  { href: "/dashboard/location-requests", label: "Location Requests", roles: ["AUTHORITY", "ADMIN"] },
  { href: "/safety", label: "Live Safety", roles: ["REGISTERED_PERSON", "FAMILY_USER"] },
  { href: "/dashboard/trusted-contacts", label: "Trusted Contacts", roles: ["REGISTERED_PERSON", "FAMILY_USER"] },
  { href: "/dashboard/billing", label: "Subscription & Billing", roles: ["FAMILY_USER", "REGISTERED_PERSON"] },
  { href: "/dashboard/notifications", label: "Notifications", roles: ["FAMILY_USER", "REGISTERED_PERSON", "AUTHORITY", "ADMIN"] },
  { href: "/dashboard/users", label: "Manage Users", roles: ["ADMIN"] },
  { href: "/dashboard/plans", label: "Manage Plans", roles: ["ADMIN"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  return (
    <aside className="w-full shrink-0 border-b border-navy-900/10 bg-white md:w-64 md:border-b-0 md:border-r">
      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col md:gap-1 md:overflow-visible">
        {LINKS.filter((l) => !role || l.roles.includes(role)).map((l) => (
          <Link key={l.href} href={l.href} className={`whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${pathname === l.href ? "bg-navy-900 text-white" : "text-navy-900/70 hover:bg-navy-900/5"}`}>
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
