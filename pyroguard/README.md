# PyroGuard

Mobile-first fire/life-safety inspection platform demo — aimed at commercial inspection contractors
(AAA Fire Protection, Guardian Fire, Johnson Controls, Cintas). Built to open instantly on a
prospect's phone, run a full 20-device inspection in under two minutes, and deliver an AHJ-ready PDF.

**Live:** https://pyroguard-demo.netlify.app
**Repo:** [azoni/launchpad/pyroguard](https://github.com/azoni/launchpad/tree/main/pyroguard)

## What the demo does

- **Try Demo** → anonymous Firebase sign-in → clones a Seattle-themed sandbox (3 customers, ~300 devices, 2 years of test history)
- **Dashboard** — real-time KPI cards, critical deficiencies, today's jobs
- **Jobs & routes** — Mapbox GL map of 3 Seattle properties, "Optimize Route" toggle with drive-time delta (nearest-neighbor over Mapbox Directions)
- **Inspect** — swipe Pass/Fail on devices, haptic feedback, native camera on Fail, inline deficiency drawer with "Draft with AI" (Claude Sonnet 4.5)
- **Complete** — signature pad with geo-tag, generates NFPA 72 Ch 14 record-of-completion PDF, uploads to Firebase Storage
- **AI Assistant** — code lookup, deficiency drafting with conservative citation rules ("defer if not 100% certain")
- **Reports** — per-inspection PDF list with share/download

## Stack

- Next.js 14 App Router + TypeScript + Tailwind
- Firebase: Auth (anonymous), Firestore (offline persistence), Storage
- Anthropic Claude Sonnet 4.5 via Next.js Route Handler (deploys as Netlify Function)
- Mapbox GL JS + Directions API (SVG fallback if `NEXT_PUBLIC_MAPBOX_TOKEN` missing)
- `@react-pdf/renderer` for NFPA-ready PDFs, `signature_pad` for touchscreen signatures
- `framer-motion` for swipe gestures, `zustand` for client state, `next-themes` for dark mode
- PWA installable via `manifest.ts`

## Local setup

```bash
npm install
cp .env.example .env.local
# fill in Firebase + ANTHROPIC_API_KEY + NEXT_PUBLIC_MAPBOX_TOKEN (optional)
npm run seed   # writes the _template workspace
npm run dev    # → http://localhost:3000
```

### Env vars

| Var | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | yes | public |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | yes | public |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | yes | public |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | yes | public |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | yes | public |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | yes | public |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | yes | single-line JSON of the admin service account |
| `ANTHROPIC_API_KEY` | yes | server-side only, Sonnet 4.5 |
| `MCP_ADMIN_KEY` | no | launchpad activity feed logging |
| `NEXT_PUBLIC_MCP_READ_KEY` | no | launchpad view beacon |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | no | real map; SVG fallback when absent |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_GA_ID` | no | analytics |

## Deployment

Deploy lives on Netlify at `https://pyroguard-demo.netlify.app`. The monorepo root README tracks the live
URL in the Apps table, and the console gallery reads `apps.json`.

```bash
# From repo root (azoni/launchpad)
cd pyroguard
netlify link --id <site-id>
# Set env vars (secrets piped to /dev/null)
netlify env:set NEXT_PUBLIC_FIREBASE_API_KEY "..."
# (etc.)
npm run seed           # seed the template workspace
netlify deploy --build --prod
```

Base directory on Netlify MUST be `pyroguard` — otherwise git-triggered builds will ship the wrong app. See the root `CLAUDE.md` for the `netlify api updateSite` call.

## Disclaimer

PyroGuard supports but does not replace the judgment of a NICET-certified inspector. Every NFPA / IFC
citation must be verified against the current edition of the applicable standard before being relied
upon in a formal report. The inspector of record is responsible for all findings and citations.

## See also

- [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) — 5-minute and 15-minute sales walkthroughs
- [TODO.md](./TODO.md) — v1 gaps and the v2 roadmap
