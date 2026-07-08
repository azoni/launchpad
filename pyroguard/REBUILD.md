# PyroGuard v2 — Ground-Up Rebuild: Discovery & Use-Case Map

> Mission: rebuild PyroGuard from scratch as a real all-in-one platform for fire/life-safety
> inspection contractors — a SedonaOffice replacement that helps inspectors run everything in
> one place and interfaces with the systems around it. The v1 demo app is deleted; only the
> visual identity (the "tactical mission console" design shell) survives.
>
> Produced 2026-07-07 from a multi-agent discovery sweep (SedonaOffice deep-dive, competitor
> landscape, contractor workflow research, integration-surface research, design-shell inventory,
> adversarial completeness critique). Verify load-bearing facts before contracts/marketing.

---

## 1. What we're replacing and why it's beatable

**SedonaOffice** (Bold Group / EverCommerce) is a ~25-year-old Windows client + SQL Server ERP
for alarm and fire contractors (~650 companies across Bold's core products; typical customer
50–500 employees, $5M–$50M revenue). It ships full double-entry accounting (AR/AP/GL), a
Customer→Site→System hierarchy, RMR recurring-line cycle billing with deferred revenue, bulk
inspection-ticket generation, SedonaSchedule dispatch, job management, and inventory — but has
**no modern field inspection capability** (relies on the fireNspec bolt-on) and **notoriously
weak reporting** (the #1 documented complaint). Users also cite: antiquated 32-bit UI, on-prem
architecture that fails over VPN, per-workstation upgrades, slow post-acquisition support, and
hard data extraction. Crucially, all of a Sedona shop's data sits in an accessible on-prem
Microsoft SQL Server database — a clean migration surface.

**The market whitespace:** inspection checklists, deficiency-to-proposal pipelines, mobile apps,
and customer portals are now table stakes (Inspect Point, ServiceTrade, Uptick, BuildingReports,
simPRO, Joblogic all have them). But **no one combines fire-native inspections + full accounting
+ RMR billing + native AHJ compliance submission in one platform.** Every major field platform
punts accounting to QuickBooks/Sage sync; the only built-in-accounting player (FieldServio) is a
generalist ERP; Sedona itself is weak in the field. Secondary whitespace: transparent
month-to-month pricing (incumbents are quote-only + implementation fees), iOS+Android parity
(Inspect Point is iOS-only), and fee-free AHJ filing (contractors pay Brycer $10–30/report).
Consolidation is accelerating (Inspect Point bought FormLink + FireCAD; ServiceTrade bought
Asurio + NorthBoundary), so the independent all-in-one window is real but narrowing.

**The economics that matter:** repair "pull-through" benchmark is $1 of repair revenue per $1 of
inspection revenue; invoicing within 10 days collects in ~52 days vs 85+; paper costs field techs
4.8–14+ hrs/week; inspection ARR and monitoring RMR drive enterprise value (2–3.5× ARR; 40–55× RMR).

## 2. Personas

| Persona | Defining job |
|---|---|
| **Owner / GM** | Compliance book completeness, pull-through ratio, utilization, AR aging, enterprise value. Buys the platform. |
| **Controller / Office accounting** | **The veto persona** — cycle billing of RMR + annual-prepaid ITM, escalators, collections, autopay, month-end close. The reason shops stay on Sedona. |
| **Scheduler / Dispatcher** | Lives in the board: bulk-generates the month, levels lumpy due-months, assigns by skill AND certification, sends occupant notices, dispatches demand calls, coordinates central-station on-test, chases AHJ deadlines. |
| **Field inspector** | NFPA 25/72/10/80/17A/96 walk-throughs, offline, photo-backed severity-classified findings, customer signature, license number stamped on the report. |
| **Service / repair tech** | Demand tickets + repair WOs from deficiencies: parts used, clocked hours, completion photos, closing signature. Often the same human as the inspector. |
| **Sales / Estimator** | Same-day photo-backed repair quotes from deficiencies; multi-year ITM agreements (60-mo auto-renew, escalators). |
| **Customer (building owner/FM)** | Legally owns the ITM obligation; receives notices, hosted quote approvals, reports, invoices. Not a seat in v1 — a recipient. |
| **AHJ / Fire marshal** | Compliance endpoint — receives reports via Brycer TCE (1,420+ jurisdictions), IROL, Tegris, or mail; enforces red-tag deadlines (1–5 business days) and state forms (CA Title 19). A delivery target, not a login. |
| **Subcontractor** (v1.x) | Free limited seat for subbed scopes (pump flow tests, backflow, hoods); uploads completed reports into the job record. |

## 3. Use-case map

### core-v1 — "one contractor's real month, contract to cash, QBO holding the GL"

| # | Use case | Persona | Replaces |
|---|---|---|---|
| 1 | **Stand up the data backbone + pricebook** — Customer→Site→System→Asset tree; parts, labor rates, markup, tax; CSV import | Owner | Sedona Client Mgmt + item setup |
| 2 | **Migrate off SedonaOffice in one cutover** — ingest on-prem SQL .bak: customers, sites, systems, recurring lines, inspection records, ticket history, docs, **AR open items → QBO opening balances, EFT mandates → Stripe ACH** | Owner | The entire Sedona DB |
| 3 | **Onboard + bill the existing agreement book** — agreements w/ NFPA frequency matrices; **both annual-prepaid AND monthly cycle billing**, batch runs posting to QBO; escalator prompts | Controller | RMR Mgmt + Cycle Invoicing |
| 4 | **Generate, level, and schedule a month of inspections** — bulk generation from frequency records with due *windows*, backlog queue, capacity leveling, cert-constrained route-aware assignment | Dispatcher | SedonaSchedule + bulk ticket gen |
| 5 | **Notify customers + coordinate every visit** — confirmations, 48–72hr occupant notices, reminders, en-route SMS; **manual central-station on-test checklist step** (logged: account #, who called, window, restore) | Dispatcher | SedonaSync |
| 6 | **Take a service call, dispatch same hour** — demand tickets (panel beeping, leaks, emergencies) with full site history at intake; same board as inspections | Dispatcher | Service module intake/dispatch |
| 7 | **Perform + sign an NFPA inspection in the field** — offline iOS+Android, question sets per standard at asset level, severity classes (impairment/critical/noncritical + state tags w/ deadline clocks), photos, signature, **license number auto-stamped**, PDF emailed before the truck leaves | Inspector | fireNspec bolt-on / Inspect Point |
| 8 | **File with the AHJ before the legal deadline** — deadline-aware routing: timed direct-portal tasks for red-tag/impairment; Compliance Sync email ($5/report) for routine; fees passed to invoice; status tracked | Dispatcher | new — displaces TCE re-keying |
| 9 | **Failed device → approved priced repair, same day** — quote builder pre-filled from finding + pricebook; **hosted tokenized approval page with e-signature** (no portal login, no DocuSign); approval spawns the WO | Estimator | ServiceTrade's signature pipeline |
| 10 | **Execute a repair/service WO end-to-end** — same app, WO mode: original finding + photos, truck-stock parts used, labor hours, completion photos, closing signature, warranty/callback non-billable flag | Repair tech | Service ticket + Sedona-X mobile |
| 11 | **Capture tech time → billable hours** — clock in/out per ticket (travel vs on-site), office approval, approved hours → T&M invoice lines | Repair tech | Time & Attendance (billing-grade) |
| 12 | **Invoice everything same-day and get paid** — three streams (cycle, per-inspection, T&M w/ parts+hours+AHJ fees) posting to QBO; Stripe payment links + ACH autopay mandates | Controller | AR (QBO as interim GL) |
| 13 | **License & certification registry** — NICET/state licenses/FDAI/manufacturer certs, expirations, jurisdiction-aware validation, report stamping, scheduling eligibility | Owner | new — whitespace |
| 14 | **Live compliance + cash dashboard** — due/past-due book, deficiency aging + pull-through, filing-deadline exceptions, utilization, AR aging via QBO; CSV export everywhere | Owner | Report Manager (Sedona's #1 complaint) |

**Deliberately OUT of core-v1:** native GL/AP + deferred-revenue accounting (QBO is the ledger),
customer portal (hosted links substitute), proposal-based agreement sales, subcontractors,
warranty auto-detection, payroll export, barcode/NFC tagging, Tap to Pay, all AHJ/central-station/
CMMS APIs, install projects, counted inventory.

### v1.x — fast follows
Sell new ITM agreements (native hosted countersign) · customer self-service portal · deferred
revenue + bulk RMR rate increases · warranty/callback auto-detection + tech quality metric ·
subcontractor free seats · payroll export (CSV → Gusto/ADP) · **Brycer partner API** + IROL/Tegris
guided prefill (NOT headless credential automation — brittle + ToS risk) · Stripe Terminal Tap to
Pay · QR/NFC asset tagging + Bluetooth scanners · QuickBooks Desktop (Web Connector) · Sage Intacct.

### later
Install/construction projects w/ job costing · central-station on-test APIs (stages first; DICE
next; Manitou is Bold-owned, presumptively hostile) · ServiceChannel/Corrigo national-account
inbox · **native GL/AP — the final Sedona organ** · warehouse/truck inventory · Samsara fleet ·
DocuSign (only for customers who contractually require it).

## 4. Integrations (ranked)

| System | Tier | Mechanism |
|---|---|---|
| **QuickBooks Online** | core-v1 | REST + per-tenant OAuth2, webhooks/CDC sync worker, item/customer mapping w/ auto-create. Non-negotiable. |
| **Stripe** | core-v1 | Connect (contractor = connected account), PaymentIntents, hosted links, ACH mandates; Terminal at v1.x. |
| **SendGrid + Twilio** | core-v1 | Internal notification service: occupant notices, reminders, en-route SMS, quote links, report/invoice delivery. |
| **Brycer TCE** | core-v1 routing; v1.x API | v1: Compliance Sync branch email ($5/report, 2–3 day SLA — routine only) + timed direct-portal tasks for red-tags. v1.x: negotiated partner OAuth API (Inspect Point precedent). BD motion, not just engineering. |
| QuickBooks Desktop/Enterprise | v1.x | Web Connector qbXML (or Conductor). Sedona-era shops skew Desktop. |
| Sage Intacct | v1.x | REST OAuth2, dimension mapping. The upmarket/PE-roll-up segment. |
| IROL / Tegris | v1.x | Guided prefill + in-portal final submit (Uptick pattern). |
| Payroll (Gusto/ADP/CSV) | v1.x | File export first; Gusto embedded API later. |
| Central stations (stages, DICE) | later | Partner-negotiated APIs; stages most API-forward. |
| ServiceChannel / JLL Corrigo | later | Provider/REST APIs — national-account WO inbox. |
| Samsara / Geotab | later | Phone-GPS breadcrumbs deliver ~80% of the value free, first. |
| DocuSign | later | JWT grant + embedded signing; native hosted sign covers most cases. |

## 5. Design shell — what survives the wipe

The identity: dark-only "tactical mission console." Near-black blue-tinted bg `#080c10`, entire
UI in **JetBrains Mono** (ligatures on), fire-orange `#ff4500` as the single accent, 2–4px radii,
flat 1px-bordered panels (`#0d1420` / border `#1a2535`) that light up orange on hover, tiny
all-caps `//`-prefixed labels (`.tactical-label`), 32px blueprint grid texture (`.grid-bg`),
geometric glyphs (◉ ◈ ✓ ⎘ ⬛ ⚡) in the chrome, pulsing `● LIVE`, orange underline tabs, 4px
orange-thumb scrollbar. Motion: slide-in entrances, fade-up, soft-pulse, active:scale presses,
`navigator.vibrate` haptics.

**Keep (copy into the rebuild):**
- `tailwind.config.ts` — token source of truth: palette (`bg surface border ink muted faint
  fainter fire pass warn alarm info`), radii, letterspacing, the three keyframes. Verbatim.
- `src/app/globals.css` — palette application, `.tactical-label`, `.grid-bg`, safe-area utils,
  scrollbar. (Mapbox popup block only if v2 uses Mapbox.)
- `src/app/layout.tsx` — JetBrains Mono `next/font` pattern + mobile viewport config only.
- `src/components/SiteLogo.tsx` — the warning-triangle mark + `PYROGUARD` `AI` wordmark. The
  truest brand expression.
- `src/components/Shell.tsx` + `src/app/(marketing)/layout.tsx` — app/marketing chrome patterns
  (strip the app logic).
- `src/app/not-found.tsx` — error-page tone reference ("// CHANNEL OFFLINE").
- `src/lib/haptics.ts` (verbatim), `cn()` from `src/lib/utils.ts`, `postcss.config.mjs`
  (Tailwind 3.4 + TS config — match or consciously translate).

**Do NOT keep:** `src/components/ui/*` — stock shadcn referencing CSS-var tokens deleted in the
rebrand; most classes silently don't generate. Only its pass/warn/alarm status-variant *naming*
is worth carrying.

**Known shell defects to fix in v2:**
1. `font-display` maps to `var(--font-display)` which is **never defined** — all display
   headings actually render in generic `sans-serif`; loaded Inter is referenced by nothing.
   Pick a real display font (Oswald/Rajdhani class) or knowingly keep system sans.
2. Brand assets are pre-rebrand slate/red and clash with the theme: `icon.svg` (+ `public/`
   copy), `opengraph-image.tsx`, `manifest.ts` (light `#FAFAF9` background!), layout
   `themeColor`. Keep the slots, redraw in `#080c10`/`#ff4500`.
3. `manifest.ts`/layout reference `/icon-192.png`, `/icon-512.png`, `/apple-icon.png` — none
   exist in `public/`. Generate them.
4. Globals CSS names IBM Plex Mono in the Mapbox block; the app loads JetBrains Mono.
5. Field-app note: AHJ-facing PDF reports need a conventional print-friendly light layout
   regardless of the app theme.

## 6. Decisions made (owner, 2026-07-07)

1. **Product shape: multi-tenant SaaS from day one.** Org-scoped data model from the start;
   launch with one design partner, never rearchitect.
2. **Accounting posture: QuickBooks Online as interim GL.** PyroGuard owns agreements, cycle
   billing, quotes, T&M invoicing; invoices/payments post to QBO. Native GL is the last milestone.
3. **First wedge: sprinkler/extinguisher ITM-pure shops.** No monitoring-RMR or central-station
   dependencies in the critical path; alarm shops served via the manual on-test checklist.
4. **Build sequencing: field-ops slice first.** Data backbone + pricebook + scheduling + field
   inspections + deficiency-to-quote + AHJ filing ships as the first usable release, running
   alongside the contractor's existing accounting; the billing/QBO/Stripe layer lands immediately
   after, completing core-v1.

## 6b. Architecture decision — field app + data layer (2026-07-07)

Researched (PWA offline reality on iOS 2026, Expo maturity, sync engines, competitor field-app
tech) and red-teamed. **Decision:**

- **Field app: Expo React Native** (SDK 56, New Architecture, Expo Router, NativeWind v4
  carrying the Tailwind tokens; EAS cloud builds — solves the no-Mac problem on Windows).
  iOS + Android from one codebase (Inspect Point is still iOS-only as of May 2026).
- **Database: Supabase Postgres** — Auth with `org_id` JWT claims + RLS on every table for
  multi-tenancy, TUS-resumable Storage for photos. Relational fits the QBO/Stripe/billing/
  reporting workloads; Firestore rejected (no persistent offline upload queue across app
  restarts — firebase-ios-sdk #6451 — and weak relational reporting).
- **Sync layer: PowerSync** (Cloud Pro ~$49/mo; FSL self-hosted Open Edition as escape hatch) —
  durable SQLite offline writes, RN + web SDKs, JWT-parameterized sync rules bucketing by org +
  assignment, attachments helper for the offline photo queue. Alternatives failed: Zero rejects
  offline writes, ElectricSQL is read-path-only, Replicache in maintenance, WatermelonDB stale.
- **Office console: Next.js on Netlify, online-only**, straight to Supabase — no sync engine.
- **Monorepo:** share plain-TS packages only (domain types, zod schemas, sync/API client,
  design tokens). No Solito/Tamagui/Expo-RSC.

**Why the PWA lost the durability question:** iOS installed-PWA persistence is a heuristic, not
a contract (iOS 17.0–17.2 shipped a 3-month bug wiping installed-PWA storage); no background
sync on iOS ever; standalone-mode camera bugs through iOS 18.5; and zero of eight competitors
ship a web field app — the market's 1-star reviews are all offline-sync failures. Native
app-sandbox storage persists until uninstall.

**Runner-up:** Capacitor 7 hybrid (native Camera/Filesystem/SQLite plugins DO match Expo's
durability — the honest tiebreakers are PowerSync's native RN SDK vs web-SDK-in-WKWebView,
richer BLE/NFC ecosystem for phase 2, no App Store Guideline 4.2 web-shell risk, and the field
UI diverges from the console anyway so web-code reuse is small). It wins only if a demo-quality
slice is needed in weeks and phase-2 hardware is descoped.

**Red-team amendments (binding):**
1. **Week-1 spike, before anything else:** build the photo path first and adversarially verify
   the PowerSync attachments queue survives app kill, force-quit mid-upload, hours of airplane
   mode, OS reboot, and low storage on physical iOS + Android. If it fails any test, replace
   with a ~200-line hand-rolled drain loop over the same SQLite schema (TUS upload to Supabase
   Storage). Do not ship on vendor marketing claims.
2. **Anti-uninstall safeguard:** inspectors uninstall/reinstall to "fix" stuck syncs (documented
   competitor failure mode) and uninstall wipes unsynced photos. Prominent "N unsynced" state
   in-app AND in the office console; never advise reinstall while unsynced data exists.
3. **Setup gotchas:** PowerSync needs a direct (non-pooled) Postgres connection — provision the
   Supabase IPv4 add-on or verify IPv6 reachability; PowerSync free tier idle-deactivates weekly,
   budget Pro from the start. SOC2/HIPAA claims require the $599/mo Team tier — don't cite
   compliance in sales while on Pro.
4. **Honest velocity:** ~1.5–2.5× first-app overhead vs a PWA for the app shell, PLUS ~1–2 weeks
   for sync-rule design and the durability spike. Check the customer device floor before
   committing to SDK 56's iOS 16.4 minimum.

**Exit paths:** PowerSync → self-hosted Open Edition → hand-rolled sync over the same local
schema (data layer survives). Supabase is vanilla Postgres → pg_dump anywhere; only Auth/Storage
need substitutes. If RN itself proves wrong, shared TS packages + the whole backend carry into
a Capacitor or native rebuild; PowerSync's web SDK even allows a browser field mode as a bridge.

## 7. Open questions (owner decisions still pending)

1. **Target size:** Sedona demographic ($5M–$50M) matches the importer wedge; smaller shops adopt
   faster. Beachhead?
2. **Hosted-Sedona backups:** importer verified for on-prem SQL only. Recruit a Bold-hosted design
   partner to test whether Bold releases restorable backups before marketing to that subset.
3. **Brycer posture:** pursue partner API early (BD relationship) vs adversarial fee-free-filing
   positioning? Mutually exclusive.
4. **AHJ fee economics:** absorb the $5 Compliance Sync / $10–30 TCE fees or pass through as an
   invoice line (industry norm)?
5. **Pricing:** transparent month-to-month per-user, free sub/customer seats (Uptick attack) vs
   quote-based annual?
6. **Warranty auto-detection** deferred to v1.x (manual flag only in core) — acceptable?
7. **On-test automation** deferred to later (manual logged checklist in core) — acceptable for
   the alarm accounts the importer brings in?
8. **Mobile sequencing:** iOS+Android parity at launch (differentiator vs iOS-only Inspect
   Point) or one platform first? (Also an architecture question: PWA vs React Native/Expo for
   the offline field app.)
9. **Design shell reach:** tactical dark theme everywhere, or field/ops only with conventional
   light surfaces for accounting/customer/AHJ contexts? AHJ-facing PDFs need print-friendly
   light layout regardless.
10. **Speed vs consolidation window:** Inspect Point is one acquisition away from the same
    all-in-one. Optimize for fastest credible design-partner launch or the fuller migration wedge?
