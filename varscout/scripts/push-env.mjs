/**
 * Push .env.local values to Netlify without echoing secrets.
 * Run with: node scripts/push-env.mjs
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FIREBASE_SERVICE_ACCOUNT_KEY",
  "NEXT_PUBLIC_MCP_READ_KEY",
  "MCP_ADMIN_KEY",
];

const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i > 0 && !line.trimStart().startsWith("#")) env[line.slice(0, i).trim()] = line.slice(i + 1);
}

for (const k of KEYS) {
  const v = env[k];
  if (!v) {
    console.log(`  SKIP  ${k} (not in .env.local)`);
    continue;
  }
  execFileSync("npx", ["--yes", "netlify-cli@17", "env:set", k, v, "--force"], {
    stdio: ["ignore", "ignore", "ignore"],
    shell: true,
  });
  console.log(`  set   ${k} (${v.length} chars)`);
}
console.log("done");
