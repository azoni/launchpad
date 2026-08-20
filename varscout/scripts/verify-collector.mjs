/**
 * End-to-end check of the collector loop against a running server:
 * POST /api/collect (as the scheduled function would), then GET /api/aggregates
 * and confirm real history came back.
 * Run with: node --env-file=.env.local scripts/verify-collector.mjs [baseUrl]
 */
const base = process.argv[2] ?? "http://localhost:3111";
const key = process.env.MCP_ADMIN_KEY;
if (!key) throw new Error("MCP_ADMIN_KEY not set");

const collect = await fetch(`${base}/api/collect`, {
  method: "POST",
  headers: { Authorization: `Bearer ${key}` },
});
const collectBody = await collect.json();
console.log("POST /api/collect ->", collect.status, JSON.stringify(collectBody));

const unauth = await fetch(`${base}/api/collect`, { method: "POST" });
console.log("POST /api/collect (no auth) ->", unauth.status, unauth.status === 401 ? "correctly rejected" : "NOT PROTECTED");

const agg = await fetch(`${base}/api/aggregates`);
const data = await agg.json();
const tickers = Object.keys(data.histories ?? {});
console.log("GET /api/aggregates ->", agg.status);
console.log("  cache-control:", agg.headers.get("cache-control"));
console.log("  runs:", data.runs, "| updatedAt:", data.updatedAt ? new Date(data.updatedAt).toISOString() : null);
console.log("  markets with history:", tickers.length);

const sample = tickers.slice(0, 5).map((t) => {
  const h = data.histories[t];
  return `${t}: n=${h.n} mean=${h.fundingMean?.toFixed(4)} pos/neg=${h.posN}/${h.negN} vol=${h.vol ?? "—"}`;
});
console.log("  sample:\n    " + sample.join("\n    "));

const ok = collect.status === 200 && unauth.status === 401 && agg.status === 200 && tickers.length > 0;
console.log(ok ? "\nCOLLECTOR OK" : "\nCOLLECTOR FAILED");
process.exit(ok ? 0 : 1);
