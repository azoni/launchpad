# Varscout

A live screener for [Variational Omni](https://omni.variational.io/).
Live at **https://varscout.netlify.app**

Two modes, because two horizons need different arithmetic:

- **Now** (default) — what's moving on a horizon of hours. Volume as a multiple
  of its normal rate, price move in standard deviations, open-interest change,
  and a flow read separating positions opening from positions closing.
- **Carry** — multi-day holds ranked by funding yield net of amortized spread.

## Why the two modes aren't the same ranking presented twice

Funding accrues per second; the spread is paid once. One hour of 50% annualized
carry is ~0.006%, against a round trip costing 5–50x that. So on short horizons
**carry cannot justify a position and the move has to** — Now mode uses cost as
a *gate*, not a subtraction. Over a week the ratio reverses and carry dominates.

The gate is **edge vs spread**: the one-sigma move over your holding window
divided by the move needed to cover the round trip. Below 1x, a normal move
doesn't pay for the trade, and the market is excluded however much volume it
prints.

## How the live signals work

**Omni's `volume_24h` is venue volume, not market volume.** It runs 10–100× below
a token's real turnover (ORDI: $0.02M on Omni vs $7.2M globally). Screening on it
hid nearly every genuine mover, so real volume and 24h change come from a public
spot venue via cached `/api/reference`; Omni's figures are kept strictly for
spread, depth, funding and OI. Both are shown side by side.

**The reference venue is a fallback chain, because exchanges geo-block.** Binance
returns **451** and Bybit **403** to Netlify's us-east-1 functions while both work
fine from a laptop — a single-source design passes local testing and silently
returns nothing in production. `sources.ts` tries Binance → Bybit → OKX → KuCoin
and reports the winner plus a per-venue attempt log in the response. OKX currently
wins with ~213/543 coverage.

**Spikes are measured for the most active markets**, not inferred: the latest real
5-minute volume bar vs the median of the previous twelve, which needs no warm-up.
Markets without reference coverage fall back to the older estimator — the change
in rolling `volume_24h` per second against a collector-built baseline — marked
`est`. Negative deltas there mean an old burst aged out of the window rather than
trading stopping, so they're floored at zero.

**Volatility comes from the collector's multi-day history, not the live window.**
Short-window vol is unstable, and a smoothly trending price has almost no
variance in its increments — session vol would report a market as dead precisely
while it's moving most. This was caught by `verify-pulse.ts` before it shipped.

**"Live" means about a minute.** Upstream advances in discrete ~70s steps: six
polls 8s apart return byte-identical data, then hundreds of quotes move at once.
The page polls every 20s and counts a tick **only when the venue's own timestamp
advances** — counting repeat polls would divide real volume by imaginary elapsed
time. Sub-minute resolution isn't available from this source at any poll rate.

**A spike is not a direction.** Elevated volume says something is happening, not
how it resolves. The direction shown is momentum continuation, not a forecast.

## What makes the carry numbers non-obvious

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
| `src/lib/variational/pulse.ts` | Short-horizon metrics: volume spike, sigma move, OI flow, edge-vs-spread gate |
| `src/lib/variational/history.ts` | Incremental accumulator → funding stability, realized vol, volume baseline |
| `src/lib/useScreener.ts` | Session tick buffer, deduped on upstream quote timestamp |
| `src/app/api/collect/route.ts` | Folds one poll into the aggregates + seed series |
| `src/app/api/aggregates/route.ts` | Cached read for the browser (history + seed) |

The seed series lives in its own Firestore doc (`stats/seed`), not folded into
`stats/current` — together they'd push that doc toward the 1MB ceiling as
markets accumulate.

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
npx tsx scripts/verify-pulse.ts                 # pulse metrics vs hand-computed
node scripts/gen-icons.mjs                      # re-rasterize icon.svg
node scripts/push-env.mjs                       # .env.local -> Netlify
```

Firebase project `varscout-omni`. Research tooling, not advice and not a broker.
