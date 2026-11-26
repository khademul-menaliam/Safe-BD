# SAFEBD — Women's Safety & Missing Person Assistance Platform

SAFEBD helps families in Bangladesh report missing persons, submit GD (General Diary) documents,
track verified cases, and coordinate **authorized** location assistance from police. It also gives
registered individuals consent-based tools to stay safer: live location sharing, trusted contacts,
and an SOS button. Authorized location-assistance requests and additional active cases are gated
behind a **paid subscription**, to discourage spam/misuse of a capability that creates real
downstream work for police/telecom coordination.

**Core design principle:** SAFEBD never uses a phone number alone to reveal someone's GPS location.
Location information is only ever available (a) when a registered user voluntarily shares it from
their own browser, or (b) when it is supplied through a verified, authorized process (e.g. police
coordination with a telecom operator under lawful process). See [Authorized Location Provider
Integration Point](#authorized-location-provider-integration-point) below. This did not change when
billing was added — billing only adds a usage/abuse control on top of the same authorized workflow.

---

## Tech stack

- Next.js 14 (App Router) + TypeScript + React
- Tailwind CSS
- PostgreSQL + Prisma ORM
- NextAuth.js (Credentials provider, JWT sessions, bcrypt password hashing)
- Leaflet + OpenStreetMap for maps
- Web Geolocation API for consent-based live location
- Zod for validation

---

## 1. Installation

```bash
npm install
```

> `npm install` triggers `prisma generate`, which downloads Prisma's query engine binaries — make
> sure you have normal internet access the first time you install.

## 2. Environment

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://safebd:safebd@localhost:5432/safebd?schema=public"
AUTH_SECRET="generate-with-openssl-rand--base64-32"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_MAP_PROVIDER="openstreetmap"
```

```bash
openssl rand -base64 32
```

No local PostgreSQL? Use Docker:

```bash
docker run --name safebd-postgres -e POSTGRES_USER=safebd -e POSTGRES_PASSWORD=safebd \
  -e POSTGRES_DB=safebd -p 5432:5432 -d postgres:16
```

## 3. Database

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

This creates all tables and seeds demo accounts, subscription plans, and a demo case.

## 4. Start

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## Demo login accounts

All seeded passwords are `password123`.

| Role | Phone | Plan | Notes |
|---|---|---|---|
| Family member | `01700000001` | **Family Monthly (paid, active)** | Reported the demo case `BD-MP-DEMO-001`; already has a paid plan so you can test an authorized location request end-to-end out of the box |
| Registered person | `01700000002` | Free | Can use `/safety` for live sharing / SOS |
| Authority | `01700000003` | Free | Can verify GD, request authorized location assistance (billed to the case's family account) |
| Admin | `01700000004` | Free | Can manage users and subscription plans |

## Creating the first admin / authority accounts

Only `FAMILY_USER` and `REGISTERED_PERSON` accounts can self-register via `/register`.
`AUTHORITY` and `ADMIN` accounts must be created by an existing admin from
**Dashboard → Manage Users** (or directly via `prisma/seed.ts`).

---

## Subscription & billing

**Why this exists:** an authorized location-assistance request is not a free action in the real
world — it means an authority asking a telecom operator to act on a verified case. Leaving that
trigger completely open invites spam and misuse. So SAFEBD gates it (and additional concurrent
cases) behind a subscription tied to the reporting family's account:

| Plan | Price | Active cases | Location-assistance requests |
|---|---|---|---|
| Free | ৳0 | 1 | 0 (blocked) |
| Family Monthly | ৳500/month | 3 | 5 per billing cycle |
| Family Yearly | ৳5,000/year | 3 | 60 per billing cycle |

Admins can add/edit plans at **Dashboard → Manage Plans** (`POST /api/billing/admin-plans`).

**What billing does NOT change:** it never relaxes the rule that location data must come from
consent or a genuine authorized process. A paid plan does not add any new way to obtain location —
it only unlocks *requesting* the same authorized workflow described below, and raises the active-case
limit. Someone on the free plan still gets full case reporting and GD verification at no cost.

**How a charge happens:** `/pricing` → user picks a paid plan → a mock checkout form (card number,
name, expiry, CVC) → `POST /api/billing/subscribe` → `src/lib/paymentProvider.ts`'s
`PaymentProvider.charge()` is called. In this build that's `MockPaymentProvider`, which **never
contacts a real card network** — it does a basic digit-count check only, and always marks the
resulting `Payment` row `isDemoPayment: true`. No real money moves. See [Payment Provider
Integration Point](#payment-provider-integration-point) to wire in a real processor.

**Usage tracking:** `Subscription.locationRequestsUsedThisPeriod` increments each time an
authorized location-assistance request actually succeeds for that family's cases
(`src/lib/subscription.ts`). It resets to 0 whenever a new billing period starts (i.e. on
subscribe/renew). A lapsed paid period (`currentPeriodEnd` in the past) automatically falls back to
the Free plan's limits the next time it's checked.

---

## How the core workflows work

### GD (General Diary) upload
A family member reports a case (free, subject only to the active-case limit on their plan), then
uploads a scan/photo of the GD they filed with police (`/cases/[caseId]`, PDF/JPG/JPEG/PNG, 10MB
max). Files are written to `uploads/gd-documents/` **outside** of `/public`, under a randomly
generated file name. The only way to read a document is the authenticated, authorization-checked
route `GET /api/documents/[documentId]`.

### GD verification
An `AUTHORITY` or `ADMIN` user reviews the case and GD and can **Verify GD**, **Reject GD**, or
**Request Information** — all free, no subscription involved.

### Authorized location assistance (paid feature)
Once a case's GD is `VERIFIED`, an authority user can submit an authorized location-assistance
request from the case page. `POST /api/cases/[caseId]/location-request`:

1. Checks `canRequestLocationAssistance(case.reporterId)` — the gate is on the **family's**
   subscription, not the authority's, since the authority is acting on the family's behalf. If it
   fails, the API returns `402` with `upgradeRequired: true` and the UI shows a message pointing to
   that family's Billing page.
2. Creates a `LocationRequest` row (status `PENDING → SUBMITTED/RECEIVED`).
3. Delegates to `AuthorizedLocationProvider` (`src/lib/locationProvider.ts`) — still the mock,
   clearly-labeled-demo provider; billing changes nothing about what this step actually does.
4. Stores the result as an `AuthorizedLocation` row and increments the family's
   `locationRequestsUsedThisPeriod`.

### Browser-based consented live location (registered users)
On `/safety`, any logged-in user can start sharing their live location via
`navigator.geolocation.getCurrentPosition` / `watchPosition` — requires explicit browser permission,
is free regardless of plan, can be time-boxed (15/30/60 min or "until stopped"), and stops
automatically on expiry or via **Stop Sharing**.

### SOS
Tapping SOS on `/safety` confirms, grabs browser location, starts a location share, creates an
`SOSAlert`, and creates a `Notification` per trusted contact — all free. No real SMS/telecom
provider is wired up; notifications are labeled `DEMO NOTIFICATION SENT`.

---

## Authorized Location Provider Integration Point

`src/lib/locationProvider.ts` defines:

```ts
export interface AuthorizedLocationProvider {
  requestLocation(input: LocationRequestInput): Promise<LocationRequestResult>;
}
```

This build ships `MockAuthorizedLocationProvider`, which **always returns clearly-labeled demo
data** (`isDemoData: true`) anchored near Dhaka. It does not query cellular towers, perform SS7
lookups, scrape telecom systems, or bypass any device permission.

To integrate a real, legally authorized provider:

1. Implement `AuthorizedLocationProvider` with a class that calls your real, authorized backend
   (e.g. a police/telecom liaison system operating under lawful process).
2. Update `getAuthorizedLocationProvider()` to return your implementation, gated by an env var
   (e.g. `LOCATION_PROVIDER=official`).
3. Keep populating `isDemoData` / `verificationStatus` accurately so the UI's "AUTHORIZED LOCATION
   INFORMATION" labeling stays truthful.

No other part of the codebase needs to change. The subscription gate in
`src/lib/subscription.ts` sits in front of this call and does not need to change either.

## Payment Provider Integration Point

`src/lib/paymentProvider.ts` defines:

```ts
export interface PaymentProvider {
  charge(input: ChargeInput): Promise<ChargeResult>;
}
```

This build ships `MockPaymentProvider`, which never contacts a real card network and always returns
`isDemoPayment: true`. To integrate a real processor (Stripe, SSLCommerz, bKash, etc.):

1. Implement `PaymentProvider` with a class that calls that processor's real API (tokenized card
   collection client-side — **never** pass raw PAN/CVC through your own backend for a real
   integration; this mock does so only because it never leaves localhost and never charges
   anything).
2. Update `getPaymentProvider()` to return it, gated by `PAYMENT_PROVIDER=stripe` (or similar).
3. `POST /api/billing/subscribe` and `src/lib/subscription.ts` do not need to change.

---

## Security features implemented

- Passwords hashed with bcrypt (cost factor 12); never stored in plaintext.
- Sessions via NextAuth JWT, `AUTH_SECRET`-signed.
- Role-based authorization checked in every sensitive API route.
- Zod input validation on every form/API boundary.
- GD upload restricted by MIME type allowlist and 10MB size cap; documents stored outside
  `/public` and served only through an authenticated, authorized route.
- Simple in-memory rate limiting on registration, case creation, and subscription purchases.
- `AuditLog` table records user, action, case, metadata, timestamp and IP for sensitive actions
  (registration, case creation, GD upload/verify/reject, location requests, document views, SOS,
  subscription activation, payment failures).
- Payment card fields are validated for shape only and never persisted — only the last 4 digits
  are stored on the `Payment` record.
- SQL injection is mitigated by using Prisma's parameterized query builder everywhere.
- Case IDs shown to users are a sequential display number (`BD-MP-2026-000001`); internal database
  IDs are never exposed.

---

## Project structure

```
src/
  app/
    page.tsx                         Homepage
    login/, register/                Auth pages
    pricing/                         Public plans page + mock checkout
    missing-person/report/           Missing person report form (subscription-gated)
    cases/[caseId]/                  Case details (GD upload/verify, timeline, location request)
    safety/                          Live location sharing + SOS (consented, free)
    privacy/                         Privacy explanation
    dashboard/                       Role-aware dashboard, cases list, location requests,
                                      trusted contacts, billing, notifications,
                                      admin user + plan management
    api/                             All REST route handlers
  components/                        Navbar, Footer, Sidebar, StatusBadge, MapView, etc.
  lib/                               db, auth, rbac, phone validation, zod schemas,
                                      locationProvider + paymentProvider abstractions,
                                      subscription gating helpers, audit logging, uploads,
                                      case-number generation, rate limiting
prisma/
  schema.prisma                      All models/enums, incl. SubscriptionPlan/Subscription/Payment
  seed.ts                            Demo accounts, plans, and a demo case
uploads/gd-documents/                Protected GD file storage (NOT web-accessible)
```

---

## Test instructions

1. Log in as the family demo account (already on a paid plan) and open `/cases/BD-MP-DEMO-001`.
2. Log in as the authority demo account, verify the seeded GD, then submit an authorized
   location-assistance request — succeeds immediately since the family has an active paid plan; a
   demo pin appears on the map, clearly labeled as demo data.
3. Log in as admin, go to **Manage Plans**, and set `FREE`'s `locationRequestsIncluded` — confirm
   that a request from a case reported by a free-plan family now returns a 402 with an upgrade
   prompt.
4. Visit `/pricing` while logged out — picking a paid plan redirects to `/register`. Log in as the
   registered-person demo account (free plan) and subscribe to Family Monthly via the mock checkout
   — confirm **Dashboard → Billing** shows the new plan, period end date, and a `SUCCEEDED` demo
   payment.
5. From the same account, add a trusted contact, then trigger SOS on `/safety` and confirm a demo
   notification appears under **Dashboard → Notifications**.
6. Try `/missing-person/report` while already at your plan's active-case limit — confirm the 402
   error and the "View plans & pricing" link.
