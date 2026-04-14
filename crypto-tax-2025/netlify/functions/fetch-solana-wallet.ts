// Solana wallet fetcher. Uses the public Solana RPC to pull transaction
// history and parse token balance changes to detect swaps, transfers, etc.
//
// Flow:
// 1. getSignaturesForAddress — get all tx signatures for 2025
// 2. getTransaction for each — get parsed tx with pre/post token balances
// 3. Diff token balances to determine what was swapped/transferred

import type { Handler } from "@netlify/functions";

const RPC_URL = "https://api.mainnet-beta.solana.com";
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

interface RpcResponse<T> {
  jsonrpc: string;
  result: T;
  error?: { code: number; message: string };
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data = (await res.json()) as RpcResponse<T>;
  if (data.error) throw new Error(`RPC ${method}: ${data.error.message}`);
  return data.result;
}

interface Signature {
  signature: string;
  blockTime: number | null;
  err: unknown;
}

interface TokenBalance {
  accountIndex: number;
  mint: string;
  uiTokenAmount: { uiAmount: number | null; decimals: number };
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
      accountKeys: Array<{ pubkey: string; signer: boolean }>;
    };
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function tokenSymbol(mint: string): string {
  return TOKEN_SYMBOLS[mint] ?? mint.slice(0, 8) + "...";
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body: { address?: string };
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const address = body.address?.trim();
  if (!address) {
    return { statusCode: 400, body: JSON.stringify({ error: "address required" }) };
  }

  try {
    // 1. Get all signatures for 2025
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
      await sleep(200);
    }

    // 2. Fetch transaction details in batches
    const rows: Array<Record<string, unknown>> = [];
    const batchSize = 5;

    for (let i = 0; i < allSigs.length; i += batchSize) {
      const batch = allSigs.slice(i, i + batchSize);
      const txPromises = batch.map((s) =>
        rpc<ParsedTx | null>("getTransaction", [
          s.signature,
          { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
        ]).catch(() => null)
      );
      const txResults = await Promise.all(txPromises);

      for (let j = 0; j < batch.length; j++) {
        const sig = batch[j];
        const tx = txResults[j];
        if (!tx || !tx.meta || tx.meta.err) continue;

        const timestamp = (sig.blockTime ?? 0) * 1000;
        const fee = tx.meta.fee / 1e9;

        const accountKeys = tx.transaction.message.accountKeys;
        const userIndex = accountKeys.findIndex((k) => k.pubkey === address);

        // SOL balance diff
        const preSol = (tx.meta.preBalances[userIndex] ?? 0) / 1e9;
        const postSol = (tx.meta.postBalances[userIndex] ?? 0) / 1e9;
        const solDiff = postSol - preSol + fee;

        // Token balance diffs
        const preTokens = new Map<string, number>();
        const postTokens = new Map<string, number>();

        for (const tb of tx.meta.preTokenBalances) {
          if (tb.owner === address) {
            preTokens.set(tb.mint, tb.uiTokenAmount.uiAmount ?? 0);
          }
        }
        for (const tb of tx.meta.postTokenBalances) {
          if (tb.owner === address) {
            postTokens.set(tb.mint, tb.uiTokenAmount.uiAmount ?? 0);
          }
        }

        const allMints = new Set([...preTokens.keys(), ...postTokens.keys()]);
        const changes: Array<{ asset: string; mint: string; diff: number }> = [];

        for (const mint of allMints) {
          const pre = preTokens.get(mint) ?? 0;
          const post = postTokens.get(mint) ?? 0;
          const diff = post - pre;
          if (Math.abs(diff) > 1e-9) {
            changes.push({ asset: tokenSymbol(mint), mint, diff });
          }
        }

        if (Math.abs(solDiff) > 0.001) {
          changes.push({ asset: "SOL", mint: "native", diff: solDiff });
        }

        if (changes.length === 0) continue;

        const gained = changes.filter((c) => c.diff > 0);
        const lost = changes.filter((c) => c.diff < 0);

        if (gained.length > 0 && lost.length > 0) {
          rows.push({
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
            rows.push({
              type: "receive",
              timestamp,
              hash: sig.signature,
              asset: c.asset,
              amount: c.diff,
              fee,
              account: address,
              chain: "solana",
            });
          }
        } else if (lost.length > 0) {
          for (const c of lost) {
            rows.push({
              type: "send",
              timestamp,
              hash: sig.signature,
              asset: c.asset,
              amount: Math.abs(c.diff),
              fee,
              account: address,
              chain: "solana",
            });
          }
        }
      }

      if (i + batchSize < allSigs.length) await sleep(300);
    }

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: true,
        address,
        totalSignatures: allSigs.length,
        totalRows: rows.length,
        rows,
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
    };
  }
};
