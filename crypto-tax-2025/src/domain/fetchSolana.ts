// Client-side Solana wallet fetcher. Runs in the browser to avoid
// Netlify's 10-second function timeout. Calls the public Solana RPC
// directly from the user's IP (not rate-limited like shared server IPs).

// Use Helius if env var is set (configured at build time via VITE_ prefix),
// otherwise fall back to public RPC (will fail for high-volume wallets)
const HELIUS_KEY = import.meta.env.VITE_HELIUS_API_KEY ?? "";
const RPC_URL = HELIUS_KEY
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`
  : "https://api.mainnet-beta.solana.com";
const START_2025 = Math.floor(Date.UTC(2025, 0, 1) / 1000);
const END_2025 = Math.floor(Date.UTC(2026, 0, 1) / 1000);

const TOKEN_SYMBOLS: Record<string, string> = {
  "So11111111111111111111111111111111111111112": "SOL",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "USDC",
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "USDT",
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": "BONK",
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": "JUP",
  "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr": "POPCAT",
  "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm": "WIF",
  "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof": "RENDER",
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": "mSOL",
};

function tokenSymbol(mint: string): string {
  return TOKEN_SYMBOLS[mint] ?? mint.slice(0, 8) + "...";
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface Signature {
  signature: string;
  blockTime: number | null;
  err: unknown;
}

interface TokenBalance {
  mint: string;
  uiTokenAmount: { uiAmount: number | null };
  owner?: string;
}

interface ParsedTx {
  blockTime: number | null;
  meta: {
    err: unknown;
    fee: number;
    preTokenBalances: TokenBalance[];
    postTokenBalances: TokenBalance[];
    preBalances: number[];
    postBalances: number[];
  } | null;
  transaction: {
    message: {
      accountKeys: Array<{ pubkey: string }>;
    };
  };
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt > 0) await sleep(1500 * attempt + Math.random() * 1000);
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const data = (await res.json()) as { result: T; error?: { message: string } };
    if (data.error) {
      if (/too many/i.test(data.error.message) && attempt < 4) continue;
      throw new Error(data.error.message);
    }
    return data.result;
  }
  throw new Error("Max retries");
}

export interface FetchProgress {
  stage: string;
  detail: string;
  sigsFetched: number;
  txsProcessed: number;
  totalSigs: number;
}

export async function fetchSolanaWallet(
  address: string,
  onProgress?: (p: FetchProgress) => void,
  onBatch?: (rows: Array<Record<string, unknown>>) => Promise<void>
): Promise<Array<Record<string, unknown>>> {
  const BATCH_SIZE = 100; // save every 100 txs
  const report = (stage: string, detail: string, extra?: Partial<FetchProgress>) => {
    onProgress?.({
      stage,
      detail,
      sigsFetched: 0,
      txsProcessed: 0,
      totalSigs: 0,
      ...extra,
    });
  };

  // 1. Get all 2025 signatures
  report("signatures", "Fetching transaction signatures…");
  const allSigs: Signature[] = [];
  let before: string | undefined;
  let keepGoing = true;

  while (keepGoing) {
    const params: Record<string, unknown> = { limit: 1000 };
    if (before) params.before = before;

    const sigs = await rpc<Signature[]>("getSignaturesForAddress", [address, params]);
    if (sigs.length === 0) break;

    for (const s of sigs) {
      if (s.blockTime === null) continue;
      if (s.blockTime < START_2025) { keepGoing = false; break; }
      if (s.blockTime >= END_2025) continue;
      if (s.err) continue;
      allSigs.push(s);
    }
    before = sigs[sigs.length - 1].signature;
    if (sigs.length < 1000) break;
    report("signatures", `Found ${allSigs.length} signatures so far…`, { sigsFetched: allSigs.length });
    await sleep(1000);
  }

  report("signatures", `Found ${allSigs.length} 2025 signatures`, {
    sigsFetched: allSigs.length,
    totalSigs: allSigs.length,
  });

  if (allSigs.length === 0) return [];

  // 2. Fetch each transaction, saving in batches
  const rows: Array<Record<string, unknown>> = [];
  let pendingBatch: Array<Record<string, unknown>> = [];

  for (let i = 0; i < allSigs.length; i++) {
    const sig = allSigs[i];
    report("transactions", `Processing tx ${i + 1} of ${allSigs.length}…`, {
      sigsFetched: allSigs.length,
      txsProcessed: i,
      totalSigs: allSigs.length,
    });

    try {
      const tx = await rpc<ParsedTx | null>("getTransaction", [
        sig.signature,
        { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
      ]);
      if (!tx || !tx.meta || tx.meta.err) continue;

      const timestamp = (sig.blockTime ?? 0) * 1000;
      const fee = tx.meta.fee / 1e9;
      const accountKeys = tx.transaction.message.accountKeys;
      const userIndex = accountKeys.findIndex((k) => k.pubkey === address);

      const preSol = (tx.meta.preBalances[userIndex] ?? 0) / 1e9;
      const postSol = (tx.meta.postBalances[userIndex] ?? 0) / 1e9;
      const solDiff = postSol - preSol + fee;

      const preTokens = new Map<string, number>();
      const postTokens = new Map<string, number>();
      for (const tb of tx.meta.preTokenBalances) {
        if (tb.owner === address) preTokens.set(tb.mint, tb.uiTokenAmount.uiAmount ?? 0);
      }
      for (const tb of tx.meta.postTokenBalances) {
        if (tb.owner === address) postTokens.set(tb.mint, tb.uiTokenAmount.uiAmount ?? 0);
      }

      const allMints = new Set([...preTokens.keys(), ...postTokens.keys()]);
      const changes: Array<{ asset: string; mint: string; diff: number }> = [];
      for (const mint of allMints) {
        const diff = (postTokens.get(mint) ?? 0) - (preTokens.get(mint) ?? 0);
        if (Math.abs(diff) > 1e-9) changes.push({ asset: tokenSymbol(mint), mint, diff });
      }
      if (Math.abs(solDiff) > 0.001) changes.push({ asset: "SOL", mint: "native", diff: solDiff });

      if (changes.length === 0) continue;

      const gained = changes.filter((c) => c.diff > 0);
      const lost = changes.filter((c) => c.diff < 0);

      const addRow = (row: Record<string, unknown>) => {
        rows.push(row);
        pendingBatch.push(row);
      };

      if (gained.length > 0 && lost.length > 0) {
        addRow({
          type: "swap",
          timestamp,
          hash: sig.signature,
          assetSent: lost.map((c) => c.asset).join("+"),
          amountSent: Math.abs(lost[0].diff),
          assetReceived: gained.map((c) => c.asset).join("+"),
          amountReceived: gained[0].diff,
          fee,
          account: address,
          chain: "solana",
          rawChanges: changes,
        });
      } else if (gained.length > 0) {
        for (const c of gained) {
          addRow({ type: "receive", timestamp, hash: sig.signature, asset: c.asset, amount: c.diff, fee, account: address, chain: "solana" });
        }
      } else if (lost.length > 0) {
        for (const c of lost) {
          addRow({ type: "send", timestamp, hash: sig.signature, asset: c.asset, amount: Math.abs(c.diff), fee, account: address, chain: "solana" });
        }
      }
    } catch {
      // Skip failed txs, keep going
    }

    // Save batch every BATCH_SIZE txs
    if (onBatch && pendingBatch.length >= BATCH_SIZE) {
      await onBatch(pendingBatch);
      pendingBatch = [];
    }

    await sleep(500);
  }

  // Save any remaining rows
  if (onBatch && pendingBatch.length > 0) {
    await onBatch(pendingBatch);
    pendingBatch = [];
  }

  report("done", `${rows.length} transactions found`, {
    sigsFetched: allSigs.length,
    txsProcessed: allSigs.length,
    totalSigs: allSigs.length,
  });

  return rows;
}
