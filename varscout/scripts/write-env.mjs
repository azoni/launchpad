/**
 * One-time setup: assemble .env.local from the provisioned Firebase config,
 * the collector service-account key, and the launchpad shared MCP keys.
 * Secrets are copied file-to-file and never printed.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SA_KEY_PATH = process.argv[2];
const SHARED_ENV = process.argv[3];
const OUT = new URL("../.env.local", import.meta.url);

if (!existsSync(SA_KEY_PATH)) throw new Error(`service account key not found: ${SA_KEY_PATH}`);
const sa = JSON.parse(readFileSync(SA_KEY_PATH, "utf8"));

const shared = {};
if (existsSync(SHARED_ENV)) {
  for (const line of readFileSync(SHARED_ENV, "utf8").split(/\r?\n/)) {
    const m = /^(MCP_ADMIN_KEY|NEXT_PUBLIC_MCP_READ_KEY)=(.*)$/.exec(line.trim());
    if (m) shared[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const env = `# Firebase — project varscout-omni
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAtIoIycDebVoPJasc9JfhFLNKtGwCmKto
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=varscout-omni.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=varscout-omni
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=varscout-omni.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=256094073001
NEXT_PUBLIC_FIREBASE_APP_ID=1:256094073001:web:c5735a6d5c4fe22a9079b8

# Server-side only — the scheduled collector writes to Firestore with this.
# Base64, not raw JSON: Next 16 will not reliably parse a JSON-wrapped env var.
FIREBASE_SERVICE_ACCOUNT_KEY=${Buffer.from(JSON.stringify(sa), "utf8").toString("base64")}

# Launchpad shared keys
NEXT_PUBLIC_MCP_READ_KEY=${shared.NEXT_PUBLIC_MCP_READ_KEY ?? ""}
MCP_ADMIN_KEY=${shared.MCP_ADMIN_KEY ?? ""}
`;

writeFileSync(OUT, env, "utf8");
console.log("wrote .env.local");
console.log("  service account client_email present:", Boolean(sa.client_email));
console.log("  shared MCP keys resolved:", Object.keys(shared).sort().join(", ") || "NONE");
