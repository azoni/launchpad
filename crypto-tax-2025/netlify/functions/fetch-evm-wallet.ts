// EVM wallet fetcher. Pulls transaction history from Etherscan's free API.
//
// Fetches three types:
// 1. Normal transactions (ETH transfers + contract calls)
// 2. ERC-20 token transfers
// 3. Internal transactions (contract-to-contract ETH)
//
// Returns normalized rows ready to be inserted as rawTransactions.
// Rate limit: 5 calls/sec with API key, 1/5sec without.

import type { Handler } from "@netlify/functions";

const ETHERSCAN_API = "https://api.etherscan.io/api";

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

async function fetchEtherscan(
  module: string,
  action: string,
  address: string,
  apiKey: string | undefined
): Promise<EtherscanTx[]> {
  const params = new URLSearchParams({
    module,
    action,
    address,
    startblock: "0",
    endblock: "99999999",
    sort: "asc",
    ...(apiKey ? { apikey: apiKey } : {}),
  });

  const res = await fetch(`${ETHERSCAN_API}?${params}`);
  if (!res.ok) throw new Error(`Etherscan HTTP ${res.status}`);
  const data = (await res.json()) as { status: string; result: EtherscanTx[] | string };

  if (data.status !== "1" || !Array.isArray(data.result)) {
    // status "0" with "No transactions found" is fine — just empty
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

  const apiKey = process.env.ETHERSCAN_API_KEY; // optional, works without but slower

  try {
    // Fetch all three tx types in parallel
    const [normalTxs, tokenTxs, internalTxs] = await Promise.all([
      fetchEtherscan("account", "txlist", address, apiKey),
      fetchEtherscan("account", "tokentx", address, apiKey),
      fetchEtherscan("account", "txlistinternal", address, apiKey),
    ]);

    const rows: Array<Record<string, unknown>> = [];
    const seenHashes = new Set<string>();

    // Filter to 2025 only
    const start2025 = Math.floor(Date.UTC(2025, 0, 1) / 1000);
    const end2025 = Math.floor(Date.UTC(2026, 0, 1) / 1000);
    const in2025 = (ts: string) => {
      const t = parseInt(ts);
      return t >= start2025 && t < end2025;
    };

    // Normal transactions (ETH transfers)
    for (const tx of normalTxs) {
      if (!in2025(tx.timeStamp)) continue;
      if (tx.isError === "1") continue;
      const ethValue = weiToEth(tx.value);
      if (ethValue === 0 && !tx.functionName) continue; // skip zero-value non-contract calls

      const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
      const gasFee = tx.gasUsed && tx.gasPrice
        ? weiToEth((BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString())
        : 0;

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

    // ERC-20 token transfers
    for (const tx of tokenTxs) {
      if (!in2025(tx.timeStamp)) continue;
      const amount = tokenAmount(tx.value, tx.tokenDecimal ?? "18");
      if (amount === 0) continue;

      const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
      const key = `${tx.hash}-${tx.tokenSymbol}-${tx.from}-${tx.to}`;
      if (seenHashes.has(key)) continue;
      seenHashes.add(key);

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

    // Internal transactions (ETH from contracts)
    for (const tx of internalTxs) {
      if (!in2025(tx.timeStamp)) continue;
      if (tx.isError === "1") continue;
      const ethValue = weiToEth(tx.value);
      if (ethValue === 0) continue;

      const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
      const key = `internal-${tx.hash}-${tx.from}-${tx.to}`;
      if (seenHashes.has(key)) continue;
      seenHashes.add(key);

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
