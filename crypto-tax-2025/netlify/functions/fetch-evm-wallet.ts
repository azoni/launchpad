// EVM wallet fetcher. Uses Blockscout (free, no API key) as primary,
// with Etherscan v2 as fallback if an API key is provided.
//
// Fetches three types:
// 1. Normal transactions (ETH transfers + contract calls)
// 2. ERC-20 token transfers
// 3. Internal transactions (contract-to-contract ETH)

import type { Handler } from "@netlify/functions";

// Blockscout: free, no key needed, Etherscan-compatible API
const BLOCKSCOUT_API = "https://eth.blockscout.com/api";
// Etherscan v2: needs free API key
const ETHERSCAN_V2_API = "https://api.etherscan.io/v2/api";

interface EtherscanTx {
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed?: string;
  gasPrice?: string;
  tokenSymbol?: string;
  tokenDecimal?: string;
  isError?: string;
  functionName?: string;
  contractAddress?: string;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchApi(
  module: string,
  action: string,
  address: string,
  apiKey: string | undefined
): Promise<EtherscanTx[]> {
  // Use Etherscan v2 if key available, otherwise Blockscout
  let url: string;
  if (apiKey) {
    const params = new URLSearchParams({
      chainid: "1",
      module,
      action,
      address,
      startblock: "0",
      endblock: "99999999",
      sort: "asc",
      apikey: apiKey,
    });
    url = `${ETHERSCAN_V2_API}?${params}`;
  } else {
    const params = new URLSearchParams({
      module,
      action,
      address,
      startblock: "0",
      endblock: "99999999",
      sort: "asc",
    });
    url = `${BLOCKSCOUT_API}?${params}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API HTTP ${res.status}`);
  const data = (await res.json()) as { status: string; result: EtherscanTx[] | string };

  if (data.status !== "1" || !Array.isArray(data.result)) {
    if (typeof data.result === "string" && /no transactions/i.test(data.result)) return [];
    return [];
  }
  return data.result;
}

function weiToEth(wei: string): number {
  return Number(BigInt(wei)) / 1e18;
}

function tokenAmount(value: string, decimals: string): number {
  const d = parseInt(decimals) || 18;
  return Number(BigInt(value)) / Math.pow(10, d);
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body: { address?: string; chain?: string };
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const address = body.address?.trim();
  if (!address) {
    return { statusCode: 400, body: JSON.stringify({ error: "address required" }) };
  }

  const apiKey = process.env.ETHERSCAN_API_KEY;

  try {
    // Fetch all three tx types. With API key: 5 req/sec, no sleep needed.
    // Without key (Blockscout): add small delays.
    const delay = apiKey ? 200 : 1500;
    const normalTxs = await fetchApi("account", "txlist", address, apiKey);
    await sleep(delay);
    const tokenTxs = await fetchApi("account", "tokentx", address, apiKey);
    await sleep(delay);
    const internalTxs = await fetchApi("account", "txlistinternal", address, apiKey);

    const rows: Array<Record<string, unknown>> = [];
    const seenHashes = new Set<string>();

    const start2025 = Math.floor(Date.UTC(2025, 0, 1) / 1000);
    const end2025 = Math.floor(Date.UTC(2026, 0, 1) / 1000);
    const in2025 = (ts: string) => {
      const t = parseInt(ts);
      return t >= start2025 && t < end2025;
    };

    // Group token transfers by tx hash for swap detection
    const tokensByHash = new Map<string, EtherscanTx[]>();
    for (const tx of tokenTxs) {
      if (!in2025(tx.timeStamp)) continue;
      const list = tokensByHash.get(tx.hash) ?? [];
      list.push(tx);
      tokensByHash.set(tx.hash, list);
    }

    // Normal transactions
    for (const tx of normalTxs) {
      if (!in2025(tx.timeStamp)) continue;
      if (tx.isError === "1") continue;

      const ethValue = weiToEth(tx.value);
      const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
      const gasFee = tx.gasUsed && tx.gasPrice
        ? weiToEth((BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString())
        : 0;

      // Check if this tx hash also has token transfers → likely a swap
      const relatedTokens = tokensByHash.get(tx.hash) ?? [];
      const tokenIn = relatedTokens.find(
        (t) => t.to.toLowerCase() === address.toLowerCase()
      );
      const tokenOut = relatedTokens.find(
        (t) => t.from.toLowerCase() === address.toLowerCase()
      );

      if (tokenIn && (ethValue > 0 || tokenOut)) {
        // DEX swap detected: ETH/token out + token in
        rows.push({
          type: "swap",
          timestamp: parseInt(tx.timeStamp) * 1000,
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          assetSent: tokenOut ? (tokenOut.tokenSymbol ?? "UNKNOWN") : "ETH",
          amountSent: tokenOut
            ? tokenAmount(tokenOut.value, tokenOut.tokenDecimal ?? "18")
            : ethValue,
          assetReceived: tokenIn.tokenSymbol ?? "UNKNOWN",
          amountReceived: tokenAmount(tokenIn.value, tokenIn.tokenDecimal ?? "18"),
          gasFee,
          functionName: tx.functionName || null,
          chain: "ethereum",
        });
        // Mark these token transfers as handled
        for (const rt of relatedTokens) seenHashes.add(`${rt.hash}-${rt.tokenSymbol}-${rt.from}-${rt.to}`);
        seenHashes.add(tx.hash);
        continue;
      }

      if (ethValue === 0 && !tx.functionName) continue;

      rows.push({
        type: "normal",
        timestamp: parseInt(tx.timeStamp) * 1000,
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        asset: "ETH",
        amount: ethValue,
        direction: isOutgoing ? "out" : "in",
        gasFee,
        functionName: tx.functionName || null,
        chain: "ethereum",
      });
      seenHashes.add(tx.hash);
    }

    // Remaining ERC-20 transfers not already handled as swaps
    for (const tx of tokenTxs) {
      if (!in2025(tx.timeStamp)) continue;
      const amount = tokenAmount(tx.value, tx.tokenDecimal ?? "18");
      if (amount === 0) continue;

      const key = `${tx.hash}-${tx.tokenSymbol}-${tx.from}-${tx.to}`;
      if (seenHashes.has(key)) continue;
      seenHashes.add(key);

      const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
      rows.push({
        type: "token_transfer",
        timestamp: parseInt(tx.timeStamp) * 1000,
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        asset: tx.tokenSymbol ?? "UNKNOWN",
        amount,
        direction: isOutgoing ? "out" : "in",
        contractAddress: tx.contractAddress,
        chain: "ethereum",
      });
    }

    // Internal transactions
    for (const tx of internalTxs) {
      if (!in2025(tx.timeStamp)) continue;
      if (tx.isError === "1") continue;
      const ethValue = weiToEth(tx.value);
      if (ethValue === 0) continue;

      const key = `internal-${tx.hash}-${tx.from}-${tx.to}`;
      if (seenHashes.has(key)) continue;
      seenHashes.add(key);

      const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
      rows.push({
        type: "internal",
        timestamp: parseInt(tx.timeStamp) * 1000,
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        asset: "ETH",
        amount: ethValue,
        direction: isOutgoing ? "out" : "in",
        chain: "ethereum",
      });
    }

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: true,
        address,
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
