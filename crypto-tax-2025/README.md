# Crypto Tax 2025 — Personal Reconstruction App

A single-user web app to reconstruct your 2025 crypto tax activity across MetaMask, Phantom, Abstract, Hyperliquid, Lighter, NFTs, and assorted junk. Deterministic FIFO cost basis. LLM is helper-only — never does the math.

**Not** a SaaS. **Not** multi-tenant. Built for one person, one tax year, one purpose: getting numbers into TurboTax with a real audit trail.

## Stack

- **Frontend**: Vite + React 19 + TypeScript + Tailwind 4 + Recharts
- **Hosting**: Netlify
- **Auth**: Firebase Auth (Google sign-in)
- **DB**: Firestore
- **Storage**: Firebase Storage (raw CSVs)
- **Serverless**: Netlify Functions (LLM helper, stub wallet fetchers)
- **LLM**: Anthropic Claude (helper layer only — explanations, suggestions)

## Setup

### 1. Firebase project

1. Create a new Firebase project at https://console.firebase.google.com
2. Enable **Authentication → Sign-in method → Google**
3. Enable **Firestore** (production mode)
4. Enable **Storage**
5. From Project Settings → Your apps → Web, copy the config values into `.env`

### 2. Environment variables

```bash
cp .env.example .env
```

Fill in:

- `VITE_FIREBASE_*` — from the Firebase web app config
- `VITE_ALLOWED_UID` — leave blank for now; you'll fill it in after first sign-in
- `ANTHROPIC_API_KEY` — required only if you want the AI helper to work

### 3. Install + run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 and click **Sign in with Google**.

### 4. Lock down access (single-user mode)

After your first sign-in:

1. Go to Firebase Console → Authentication → Users, copy your UID
2. Set `VITE_ALLOWED_UID=<your-uid>` in `.env`
3. Edit `firestore.rules` and `storage.rules`, replacing `OWNER_UID` with your UID
4. Deploy the rules:

```bash
firebase login
firebase use --add   # pick your project
firebase deploy --only firestore:rules,storage:rules
firebase deploy --only firestore:indexes
```

After this, only your Google account can read/write your data.

### 5. Run unit tests

```bash
npm run test
```

The FIFO engine has unit coverage for buy/sell, partial sells, long-term split, swaps, perps, and missing-basis fallbacks.

### 6. Deploy to Netlify

```bash
npm install -g netlify-cli   # if needed
netlify login
netlify init                  # link to a new or existing site
netlify deploy --build         # preview
netlify deploy --build --prod  # production
```

In the Netlify site settings, add the same env vars from `.env` plus `ANTHROPIC_API_KEY` (server-side).

## Workflow

1. **Login** with Google
2. **Wallets & Imports** — paste wallet addresses, upload CSVs (Hyperliquid, Lighter, generic)
3. Click **Re-run pipeline** — normalizes, classifies, runs FIFO, generates review queue
4. **Review Queue** — work down the list, biggest dollar impact first. Action buttons commit a decision; the audit log captures it.
5. **Tax Summary** — see live ST/LT/NFT/Perp totals as you resolve issues
6. **Exports** — download seven CSVs for TurboTax + audit backup

## What the AI helper does (and doesn't)

**Does:**

- Explains a flagged transaction in plain English
- Suggests a likely classification

**Doesn't:**

- Compute gain/loss
- Compute cost basis
- Look up missing prices
- Auto-classify without your confirmation

Every final number comes from `src/domain/basis/fifoEngine.ts`, which is pure deterministic code. The LLM never writes to Firestore.

## Project structure

```
src/
  domain/        # Pure deterministic logic — no React, no Firebase
    normalize/   # CSV + chain row → NormalizedTransaction
    classify/    # Transfer matching, spam, NFT detection
    basis/       # FIFO engine + holding period
    review/      # Review queue generator
    aggregate/   # Chart selectors
    exports/     # CSV writers
    pipeline.ts  # Orchestrator: fetch → normalize → classify → fifo → review → persist
  data/          # Firestore wrappers — thin, no logic
  hooks/         # React hooks
  pages/         # 6 main pages
  components/
    layout/      # Shell + sidebar
    ui/          # Button, Card, Badge, Input, ProgressBar
    overview/    # StatCard
    wallets/     # WalletForm, WalletList, CsvUploader
    review/      # ReviewItemCard
    charts/      # 7 Recharts components
  lib/           # Firebase init, env, auth, format
  types/         # Shared type definitions
netlify/
  functions/
    llm-classify.ts        # Claude helper (helper-only, never does math)
    fetch-evm-wallet.ts    # STUB — wire up Etherscan v2 here later
    fetch-solana-wallet.ts # STUB — wire up Helius here later
firestore.rules            # Owner-only access (single UID)
storage.rules              # Owner-only uploads
```

## Roadmap (intentionally short)

- v1 (now): CSV-driven workflow, FIFO, review queue, exports, charts
- v2 (later): wire `fetch-evm-wallet` to Etherscan v2 multichain, `fetch-solana-wallet` to Helius
- v3 (maybe): on-chain price oracle for missing USD values
- Never: multi-year, multi-user, public sharing, IRS auto-filing, every-exchange-on-earth

## Non-goals

This app intentionally does NOT do:

- Multi-year support
- Multi-tenant / collaboration
- Automatic IRS filing
- Support for chains beyond EVM and Solana
- Exhaustive exchange support beyond Hyperliquid + Lighter + generic CSV
- Public landing page / marketing site
