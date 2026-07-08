# PyroGuard — TODO / known gaps

v1 ships enough demo coverage to close prospects. This is the backlog for v1.1 / v2.

## Must-do before production use (not demo)

- **Full NFPA citation verification** — every `section: null` in `lib/regulations.ts` must be filled against the current edition before any AHJ report goes out. Coordinate with a NICET-certified inspector.
- **Firestore security rules** — currently permissive for anonymous workspace writes. Add rules scoped to `request.auth.uid == workspaceId` so users can only read/write their own sandbox. (High priority.)
- **Storage rules** — same scoping for `/workspaces/{uid}/**`.
- **Rate limit Claude endpoint** — the `/api/claude-assistant` route is auth-gated but not rate-limited. Add a per-uid token bucket before v2.
- **PII scrubbing in MCP cost log** — `description.slice(0, 200)` may include customer names from inspector prompts. Redact before logging.

## Cuts from v1 (scaffolded, not built)

- **SendGrid / Resend email integration** — one-tap AHJ and customer emails. Netlify Function + `/api/email-report` route.
- **Firebase Cloud Messaging reminders** — 60/30/14/7 day reminders to customers before due dates.
- **Customer portal** — lightweight separate login at `/customer/{customerId}`; see buildings, download reports, e-sign deficiencies.
- **24-hour sandbox self-delete** — anonymous workspaces currently persist. Add a scheduled Netlify Function that sweeps `createdAt < now - 24h` anonymous workspaces.
- **CSV bulk device import** — for contractor onboarding.
- **Multi-day week calendar view** — day view only on mobile v1. Build desktop week view.
- **QR camera scan** — `@zxing/browser` is installed but the UI currently falls back to a manual building picker. Wire up QR scan for real.
- **Deficiency notice PDF** — currently only the inspection record PDF is generated. Add a separate deficiency-notice PDF template.
- **Voice notes** — Web Speech API on device header; transcribe into inspection notes.
- **Landscape tablet layout** — inspection checklist specifically needs a side-by-side layout at 1024+ widths.
- **Dexie offline photo queue** — Dexie is installed but photos aren't queued yet when offline. Wire `photoQueue.ts` into `CameraCapture`.

## Deferred workflows (structure exists, content doesn't)

- NFPA 17 / 17A full checklists (kitchen suppression, wet chemical)
- NFPA 96 full checklists (kitchen hoods)
- NFPA 101 full egress / emergency lighting checklists
- IFC Ch 9 building-wide life safety walkthrough

## Nice-to-have polish

- Landscape tablet view for `/app/inspect/[slug]`
- Haptic variety (success triple-pulse vs. fail long-pulse)
- Per-jurisdiction AHJ template packs (Seattle vs. NYC vs. Dallas)
- Multi-tenant workspaces (not just one workspace per anon user)
- Audit log of every Firestore write on `/app/admin`
