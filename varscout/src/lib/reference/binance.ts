/**
 * Reference market data from Binance.
 *
 * Why this exists: Omni's `volume_24h` is Omni's *own venue* volume, which runs
 * 8-100x below a token's real market activity. Using it to decide "is anything
 * happening here" hides genuine movers — ONG showed $0.6M on Omni against
 * $23.7M on Binance while up 141% on the day. Omni's numbers still decide
 * whether *you* can get filled and at what spread; they are simply the wrong
 * instrument for measuring whether a market is in play.
 */

const BINANCE = "https://api.binance.com/api/v3";
const UA = { "User-Agent": "varscout/1.0 (+https://varscout.netlify.app)", Accept: "application/json" };

export interface Reference {
  /** Binance symbol the figures came from. */
  symbol: string;
  /** Global 24h volume in quote currency (USDT). */
  vol24: number;
  /** 24h price change, as a fraction. */
  pct24: number;
  /** Number of trades in 24h — an activity proxy independent of notional. */
  trades: number;
  /** Latest 5m bar volume vs the median of the prior bars. Null until sampled. */
  spike: number | null;
  /** Latest 5m bar volume in quote currency. */
  barVol: number | null;
}

/**
 * Omni lists multiplier tokens as 1000PEPE where Binance may use either form.
 * Volume and percentage change are identical either way — only the price level
 * differs by the multiplier, and we use neither price from this source.
 */
function candidates(ticker: string): string[] {
  const out = [ticker];
  if (ticker.startsWith("1000")) out.push(ticker.slice(4));
  else out.push(`1000${ticker}`);
  return out;
}

interface Ticker24h {
  symbol: string;
  quoteVolume: string;
  priceChangePercent: string;
  count: number;
}

/** One call returns every symbol on the venue. Weight 40 of a 1200/min budget. */
export async function fetchBinance24h(): Promise<Map<string, Ticker24h>> {
  const res = await fetch(`${BINANCE}/ticker/24hr`, { headers: UA, cache: "no-store" });
  if (!res.ok) throw new Error(`Binance ticker returned ${res.status}`);
  const rows = (await res.json()) as Ticker24h[];
  const byBase = new Map<string, Ticker24h>();
  for (const r of rows) {
    if (!r.symbol.endsWith("USDT")) continue;
    byBase.set(r.symbol.slice(0, -4), r);
  }
  return byBase;
}

/**
 * Real 5-minute volume bars for one symbol, and the latest bar as a multiple of
 * the median of the prior ones. This is a measured spike rather than one
 * inferred from a rolling 24h figure, so it needs no baseline to warm up.
 */
export async function fetchSpike(
  symbol: string,
): Promise<{ spike: number | null; barVol: number | null }> {
  try {
    const res = await fetch(`${BINANCE}/klines?symbol=${symbol}&interval=5m&limit=13`, {
      headers: UA,
      cache: "no-store",
    });
    if (!res.ok) return { spike: null, barVol: null };
    const rows = (await res.json()) as unknown[][];
    if (!Array.isArray(rows) || rows.length < 4) return { spike: null, barVol: null };
    // Index 7 is quote asset volume — notional traded, not token count, so it
    // is comparable across markets.
    const vols = rows.map((r) => parseFloat(String(r[7]))).filter(Number.isFinite);
    if (vols.length < 4) return { spike: null, barVol: null };
    const current = vols[vols.length - 1];
    const prior = vols.slice(0, -1).sort((a, b) => a - b);
    const median = prior[Math.floor(prior.length / 2)];
    return { spike: median > 0 ? current / median : null, barVol: current };
  } catch {
    return { spike: null, barVol: null };
  }
}

export interface BuildOptions {
  /** How many of the most active markets get a real kline sample. */
  spikeDepth?: number;
}

/**
 * Build the reference map for a set of Omni tickers.
 *
 * Klines are only sampled for the most active candidates: one call per symbol
 * makes a full sweep wasteful, and the markets worth a precise spike reading
 * are exactly the ones already showing size or movement.
 */
export async function buildReference(
  tickers: string[],
  opts: BuildOptions = {},
): Promise<Record<string, Reference>> {
  const spikeDepth = opts.spikeDepth ?? 40;
  const byBase = await fetchBinance24h();

  const out: Record<string, Reference> = {};
  for (const t of tickers) {
    for (const c of candidates(t)) {
      const hit = byBase.get(c);
      if (!hit) continue;
      out[t] = {
        symbol: hit.symbol,
        vol24: parseFloat(hit.quoteVolume) || 0,
        pct24: (parseFloat(hit.priceChangePercent) || 0) / 100,
        trades: hit.count ?? 0,
        spike: null,
        barVol: null,
      };
      break;
    }
  }

  // Rank by the product of movement and volume so both a big mover on modest
  // size and a quiet name suddenly trading heavily get sampled.
  const ranked = Object.entries(out)
    .sort((a, b) => Math.abs(b[1].pct24) * b[1].vol24 - Math.abs(a[1].pct24) * a[1].vol24)
    .slice(0, spikeDepth);

  const spikes = await Promise.all(
    ranked.map(async ([ticker, ref]) => [ticker, await fetchSpike(ref.symbol)] as const),
  );
  for (const [ticker, s] of spikes) {
    out[ticker].spike = s.spike;
    out[ticker].barVol = s.barVol;
  }

  return out;
}
