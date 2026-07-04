# MacroMarket

Ranks foods, snacks, and supplements by **dollars per gram of protein** — the most
protein for your money. Includes a protein-goal calculator, a deals tab, and a
Claude-powered protein coach that recommends the cheapest picks.

Next.js (App Router) · TypeScript · Tailwind v4 · Firebase · Amazon Creators API ·
Anthropic · deployed on Netlify → https://macromarket-app.netlify.app

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in what you need (all keys are optional)
npm run dev
```

The site works with zero configuration (curated baseline prices). Each env var in
`.env.example` unlocks one capability.

## Pricing: baseline vs. live

Every catalog item ships with a curated **baseline** price so the site always
renders. When enabled, live Amazon prices override the baseline automatically.

**Live pricing is double-gated** — both are required, or the catalog stays on
baseline estimates:

1. `AMAZON_CLIENT_ID` + `AMAZON_CLIENT_SECRET` valid, **and**
2. `AMAZON_LIVE_PRICING` set to exactly `"1"` (not `"true"`, not `"0"`).

> The `AMAZON_LIVE_PRICING` flag is the macromarket equivalent of the oldways
> backend's `AMAZON_REFRESH_ENABLED`. The **names differ**, so copying oldways'
> env verbatim leaves live pricing off. See `src/lib/catalog/pricing.ts`.

## ASINs (product identity)

`src/data/verified.json` holds the **title-validated** ASIN + image for each
product. Live pricing, buy links, and images all key off this file — never the
raw seed ASINs (which were unreliable). Items without a validated ASIN fall back
to an affiliate **search** link + baseline price.

Maintenance scripts (need `AMAZON_*` creds in env):

```bash
npx tsx scripts/resolve-asins.ts   # search Amazon per product, keep title-matched ASINs → verified.json
npx tsx scripts/audit-asins.ts     # report OK / WRONG / NODATA for current ASINs
```

`resolve-asins.ts` only accepts a search result whose title matches the product's
brand + name, so a wrong-product ASIN can't get in — worst case an item is left on
the search-link fallback.

## Usage dashboard

Public, no auth (`robots: noindex`):

- **`/stats`** — AI-coach usage, token cost, and affiliate clicks.
- **`/api/stats`** — the same data as JSON.

Coach chats log to Firestore (`chatLogs`); affiliate clicks log to
`affiliateClicks` via `/api/click`. Both require Firebase to be configured.

## Deploy

Monorepo app (`azoni/launchpad`), Netlify base directory `macromarket`. Set env
vars in Netlify, push to `main`, and the git-triggered build deploys.
