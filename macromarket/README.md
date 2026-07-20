# MacroMarket

Ranks foods, snacks, and supplements by **dollars per gram of protein** — the most
protein for your money. Includes a protein-goal calculator, a deals tab, and a
Claude-powered protein coach that recommends the cheapest picks. The home
leaderboard defaults to **Most popular** (lifetime food-page views, tracked via
`/api/view` into the single `aggregates/itemViews` doc — one write per view, one
read per rebuild).

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

## Daily poster + automation (admin → Social)

The Social tab is an Instagram composer: pick a deal, blog post, or custom
message → a **branded card** (square/portrait/story PNG via `/api/social-card`,
satori-rendered with the site's Fraunces/DM Sans palette) plus a caption are
generated. Download the PNG, copy the caption, post manually, then "Mark as
posted" (history in Firestore `socialPosts`).

Two Netlify scheduled functions automate the content each morning (~6am PT):

- `daily-blog` → `POST /api/admin/daily?task=blog` — AI blog draft (rotating
  topic, grounded in catalog data) saved to the Content tab as a **draft**.
- `daily-social` → `POST /api/admin/daily?task=social` — today's IG post
  prepared (fresh blog post if ≤3 days old, else best live deal, else rotating
  value pick; no repeats within 7 days) into `socialQueue`, surfaced in the
  Social tab under "Prepared for you".

Both are idempotent per day (`?force=1` regenerates). Captions/drafts use Haiku
and are cost-logged to the portfolio feed.

## Usage dashboard

Public, no auth (`robots: noindex`):

- **`/stats`** — AI-coach usage, token cost, and affiliate clicks.
- **`/api/stats`** — the same data as JSON.

Coach chats log to Firestore (`chatLogs`); affiliate clicks log to
`affiliateClicks` via `/api/click`. Both require Firebase to be configured.

## Deploy

Monorepo app (`azoni/launchpad`), Netlify base directory `macromarket`. Set env
vars in Netlify, push to `main`, and the git-triggered build deploys.
