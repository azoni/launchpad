/**
 * Reference market data, from whichever public venue will actually serve us.
 *
 * Why a chain rather than one source: Binance returns HTTP 451 to Netlify's
 * us-east-1 functions (it geo-blocks US IPs), while working perfectly from a
 * developer machine — so a single-source implementation passes local testing and
 * silently returns nothing in production. Each provider is tried in turn and the
 * winner is reported in the response, so the failure mode is visible instead of
 * looking like "no markets are active".
 *
 * What this is for: Omni's own `volume_24h` measures what trades *on Omni*,
 * which runs 10-100x below a token's real turnover and hides genuine movers.
 * Omni's figures still decide spread, depth, funding and open interest.
 */

const UA = {
  "User-Agent": "varscout/1.0 (+https://varscout.netlify.app)",
  Accept: "application/json",
};

export interface Reference {
  /** Venue symbol the figures came from. */
  symbol: string;
  /** Global 24h volume in quote currency (USD-equivalent). */
  vol24: number;
  /** 24h price change, as a fraction. */
  pct24: number;
  /** Trades in 24h where the venue reports it; 0 otherwise. */
  trades: number;
  /** Latest 5m bar volume vs the median of prior bars. Null until sampled. */
  spike: number | null;
  barVol: number | null;
}

/** Base asset -> 24h figures, keyed by upper-case base symbol. */
type Book = Map<string, { symbol: string; vol24: number; pct24: number; trades: number }>;

export interface Source {
  name: string;
  /** One call returning every USD-quoted spot pair on the venue. */
  fetchBook(): Promise<Book>;
  /** Real 5m volume bars for one symbol, if the venue exposes them. */
  fetchBars?(symbol: string): Promise<number[]>;
}

const num = (v: unknown): number => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: UA, cache: "no-store" });
  if (!res.ok) throw new Error(`${new URL(url).host} returned ${res.status}`);
  return res.json();
}

// --------------------------------------------------------------------------
// Providers
// --------------------------------------------------------------------------

const binance: Source = {
  name: "binance",
  async fetchBook() {
    const rows = (await getJson("https://api.binance.com/api/v3/ticker/24hr")) as {
      symbol: string;
      quoteVolume: string;
      priceChangePercent: string;
      count: number;
    }[];
    const book: Book = new Map();
    for (const r of rows) {
      if (!r.symbol?.endsWith("USDT")) continue;
      book.set(r.symbol.slice(0, -4).toUpperCase(), {
        symbol: r.symbol,
        vol24: num(r.quoteVolume),
        pct24: num(r.priceChangePercent) / 100,
        trades: r.count ?? 0,
      });
    }
    return book;
  },
  async fetchBars(symbol) {
    const rows = (await getJson(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=5m&limit=13`,
    )) as unknown[][];
    return rows.map((r) => num(r[7])); // index 7 = quote asset volume
  },
};

const bybit: Source = {
  name: "bybit",
  async fetchBook() {
    const body = (await getJson("https://api.bybit.com/v5/market/tickers?category=spot")) as {
      result?: { list?: { symbol: string; turnover24h: string; price24hPcnt: string }[] };
    };
    const book: Book = new Map();
    for (const r of body.result?.list ?? []) {
      if (!r.symbol?.endsWith("USDT")) continue;
      book.set(r.symbol.slice(0, -4).toUpperCase(), {
        symbol: r.symbol,
        vol24: num(r.turnover24h),
        pct24: num(r.price24hPcnt), // already a fraction
        trades: 0,
      });
    }
    return book;
  },
  async fetchBars(symbol) {
    const body = (await getJson(
      `https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=5&limit=13`,
    )) as { result?: { list?: string[][] } };
    // Bybit returns newest-first; index 6 is turnover (quote volume).
    return (body.result?.list ?? []).map((r) => num(r[6])).reverse();
  },
};

const okx: Source = {
  name: "okx",
  async fetchBook() {
    const body = (await getJson("https://www.okx.com/api/v5/market/tickers?instType=SPOT")) as {
      data?: { instId: string; last: string; open24h: string; volCcy24h: string }[];
    };
    const book: Book = new Map();
    for (const r of body.data ?? []) {
      if (!r.instId?.endsWith("-USDT")) continue;
      const open = num(r.open24h);
      book.set(r.instId.slice(0, -5).toUpperCase(), {
        symbol: r.instId,
        vol24: num(r.volCcy24h),
        pct24: open > 0 ? (num(r.last) - open) / open : 0,
        trades: 0,
      });
    }
    return book;
  },
  async fetchBars(symbol) {
    const body = (await getJson(
      `https://www.okx.com/api/v5/market/candles?instId=${symbol}&bar=5m&limit=13`,
    )) as { data?: string[][] };
    // OKX returns newest-first; index 7 is volCcyQuote.
    return (body.data ?? []).map((r) => num(r[7])).reverse();
  },
};

const kucoin: Source = {
  name: "kucoin",
  async fetchBook() {
    const body = (await getJson("https://api.kucoin.com/api/v1/market/allTickers")) as {
      data?: { ticker?: { symbol: string; volValue: string; changeRate: string }[] };
    };
    const book: Book = new Map();
    for (const r of body.data?.ticker ?? []) {
      if (!r.symbol?.endsWith("-USDT")) continue;
      book.set(r.symbol.slice(0, -5).toUpperCase(), {
        symbol: r.symbol,
        vol24: num(r.volValue),
        pct24: num(r.changeRate),
        trades: 0,
      });
    }
    return book;
  },
};

/** Ordered by breadth of listings; the first that answers wins. */
export const SOURCES: Source[] = [binance, bybit, okx, kucoin];

// --------------------------------------------------------------------------

/**
 * Omni lists multiplier tokens as 1000PEPE where a venue may use either form.
 * Volume and percentage change are identical either way — only the price level
 * differs, and no price is taken from this source.
 */
function candidates(ticker: string): string[] {
  const t = ticker.toUpperCase();
  return t.startsWith("1000") ? [t, t.slice(4)] : [t, `1000${t}`];
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
}

export interface BuildResult {
  markets: Record<string, Reference>;
  source: string | null;
  attempts: { source: string; ok: boolean; detail?: string }[];
}

export async function buildReference(
  tickers: string[],
  opts: { spikeDepth?: number } = {},
): Promise<BuildResult> {
  const spikeDepth = opts.spikeDepth ?? 40;
  const attempts: BuildResult["attempts"] = [];

  let book: Book | null = null;
  let winner: Source | null = null;
  for (const src of SOURCES) {
    try {
      const b = await src.fetchBook();
      if (b.size === 0) {
        attempts.push({ source: src.name, ok: false, detail: "empty book" });
        continue;
      }
      attempts.push({ source: src.name, ok: true, detail: `${b.size} pairs` });
      book = b;
      winner = src;
      break;
    } catch (e) {
      attempts.push({ source: src.name, ok: false, detail: (e as Error).message.slice(0, 80) });
    }
  }

  if (!book || !winner) return { markets: {}, source: null, attempts };

  const markets: Record<string, Reference> = {};
  for (const t of tickers) {
    for (const c of candidates(t)) {
      const hit = book.get(c);
      if (!hit) continue;
      markets[t] = { ...hit, spike: null, barVol: null };
      break;
    }
  }

  // Sample real bars only for the most active names: one call per symbol makes a
  // full sweep wasteful, and the markets worth a precise reading are the ones
  // already showing movement or size.
  if (winner.fetchBars) {
    const ranked = Object.entries(markets)
      .sort((a, b) => Math.abs(b[1].pct24) * b[1].vol24 - Math.abs(a[1].pct24) * a[1].vol24)
      .slice(0, spikeDepth);

    const bars = await Promise.all(
      ranked.map(async ([ticker, ref]) => {
        try {
          const vols = (await winner.fetchBars!(ref.symbol)).filter(Number.isFinite);
          if (vols.length < 4) return null;
          const current = vols[vols.length - 1];
          const base = median(vols.slice(0, -1));
          return { ticker, spike: base > 0 ? current / base : null, barVol: current };
        } catch {
          return null;
        }
      }),
    );
    for (const b of bars) {
      if (!b) continue;
      markets[b.ticker].spike = b.spike;
      markets[b.ticker].barVol = b.barVol;
    }
  }

  return { markets, source: winner.name, attempts };
}
