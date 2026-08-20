# Varscout

A funding-carry screener for [Variational Omni](https://omni.variational.io/).
Live at **https://varscout.netlify.app**

Ranks 540+ perpetual markets by funding carry net of the round-trip spread you'd
actually pay at your size, using Omni's own tiered depth quotes. Shows one
recommended position with entry, cost, payback, and risk — plus everything else
that clears the filters.

## What makes the numbers non-obvious

**Funding is annualized, and most of it is noise.** The `0.1095` seen across
hundreds of markets is exactly `0.01% × 3 × 365` — the standard 0.01%/8h
baseline. With the markets at zero, roughly four in five sit at a default and
carry no signal. They're excluded, not ranked. The real universe is ~50 markets.

**Carries are size-illusions.** The round-trip spread widens ~10x between the
base tier and a $100k clip in thin markets while the carry stays flat, so the
top-ranked position genuinely inverts with size. That's why position size is a
control on the screener, not a buried setting. Clips between published tiers are
priced by log-size interpolation of the depth curve; positions past the deepest
quote are flagged `size>quote`.

**Nothing is backtested.** The upstream endpoint is a snapshot with no history,
so a collector polls every 5 minutes and builds its own. Rows stay `PROVISIONAL`
until enough readings accumulate to judge funding persistence.

**It's not arbitrage.** Perp carry is an unhedged directional position and Omni
offers no internal hedge, so carry-to-volatility is reported alongside carry.

## Architecture

```
browser ──fetch──> Variational /metadata/stats     (CORS is open; live quotes)
        └─fetch──> /api/aggregates ──> Firestore   (CDN-cached; collected history)

Netlify scheduled fn (*/5) ──> /api/collect ──> Variational + Firestore
```

The browser never touches Firestore directly — history is served through the
edge-cached `/api/aggregates` route, so a hundred visitors in a cache window cost
one read rather than a hundred. Rules deny all client access. Per-market stats
are kept as **incremental sums** (Welford-style), so the collector reads one doc
and writes two regardless of how much history exists.

| Path | Purpose |
| --- | --- |
| `src/lib/variational/scoring.ts` | Depth curve, gates, carry math. Parity-verified against `Meme/omni-scout/scout.py` |
| `src/lib/variational/history.ts` | Incremental accumulator → funding stability, annualized realized vol |
| `src/app/api/collect/route.ts` | Folds one poll into the aggregates |
| `src/app/api/aggregates/route.ts` | Cached read for the browser |

## Gotchas that cost real time here

- **Build with `--webpack`, not Turbopack.** Turbopack rewrites
  `serverExternalPackages` entries to a hashed name (`firebase-admin-a14c…`) that
  doesn't resolve in Lambda, so every route importing firebase-admin 500s at
  module load. `next build --webpack` fixes it. Same fix as macromarket.
- **`serverExternalPackages: ["firebase-admin"]`** is still required — it uses
  dynamic requires and gRPC and must not be bundled.
- **`db.settings({ preferRest: true })`** or firebase-admin's gRPC transport
  hangs and times the function out.
- **Service account must be base64**, not raw JSON — Next 16 won't reliably parse
  a JSON-wrapped env var.
- **Firestore rejects nested arrays.** Packed snapshots are keyed maps, not
  arrays of tuples.
- **Security headers are set in `next.config.ts` as well as `netlify.toml`** — the
  toml alone didn't apply to Next-served responses on the CLI deploy.
- **The upstream endpoint 403s without a `User-Agent`.** Browsers send one;
  server-side fetches must set it explicitly.

## Scripts

```bash
npm run dev
npm run build                                   # next build --webpack

node --env-file=.env.local scripts/verify-firestore.mjs    # credential smoke test
node --env-file=.env.local scripts/verify-collector.mjs [baseUrl]
node --experimental-strip-types scripts/verify-history.ts  # accumulator vs batch math
node --experimental-strip-types scripts/verify-port.ts <snapshot.json> [notional]
node scripts/gen-icons.mjs                      # re-rasterize icon.svg
node scripts/push-env.mjs                       # .env.local -> Netlify
```

Firebase project `varscout-omni`. Research tooling, not advice and not a broker.
