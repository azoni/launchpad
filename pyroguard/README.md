# PyroGuard v2 — rebuild in progress

The v1 demo has been retired and deleted (recoverable in git history — `a01c52a` added it).
PyroGuard is being rebuilt from the ground up as a real all-in-one operations platform for
fire/life-safety inspection contractors — a SedonaOffice replacement.

**Start here: [REBUILD.md](./REBUILD.md)** — mission, market research digest, personas, the
full use-case map (core-v1 / v1.x / later), integration rankings, decisions made, and open
questions.

**Live:** https://pyroguard-demo.netlify.app (currently the holding page + design shell)

## What's in this directory right now

The **design shell** — the "tactical mission console" visual identity that survives the
rewrite — plus the landing page and **"A Day in the Field"**, a playable ~4-minute demo at
`/demo`: you play an inspector through one real NFPA 25 annual + NFPA 10 round (scenario data
in `src/lib/demo/scenario.ts`, engine in `src/components/demo/`). Every step contrasts the
old Sedona/paper way with the PyroGuard fix; the centerpiece is offline photo capture in a
no-signal parking level. Mobile-first; desktop gets a phone frame.

Shell files:

- `tailwind.config.ts` + `src/app/globals.css` — the design tokens (palette, radii, tracking,
  keyframes, `.tactical-label`, `.grid-bg`)
- `src/components/SiteLogo.tsx` — the triangle mark + wordmark
- `src/components/Shell.tsx` — app chrome pattern (header + tab nav), now app-logic-free
- `src/app/(marketing)/` — marketing chrome + holding page
- `src/app/icon.svg`, `opengraph-image.tsx`, `manifest.ts` — brand asset *slots*; the art is
  pre-rebrand and needs redrawing (see REBUILD.md §5 "Known shell defects")
- `src/lib/haptics.ts`, `src/lib/utils.ts` (`cn()` only)

## Decisions locked (2026-07-07)

1. Multi-tenant SaaS from day one
2. QuickBooks Online as interim GL (native GL is the last milestone)
3. First wedge: sprinkler/extinguisher ITM-pure shops
4. Field-ops slice ships first (backbone + scheduling + inspections + quotes + AHJ filing),
   billing layer immediately after

## Local dev

```bash
npm install
npm run dev   # → http://localhost:3000
```

No env vars required for the holding page (`NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_MCP_READ_KEY`
optional). The v2 stack beyond the shell (database, auth, mobile approach) is decided in the
architecture plan — see REBUILD.md open questions.
