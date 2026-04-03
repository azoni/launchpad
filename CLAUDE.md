# Launchpad — Web App Quality Checklist

This is a quality checklist for every web app built in this workspace. It supplements your project-specific prompt — follow it alongside whatever you're building to make sure nothing gets missed.

## Stack Defaults

Unless told otherwise, use:
- **Framework:** Next.js App Router + TypeScript + Tailwind CSS
- **UI:** shadcn/ui (`npx shadcn@latest init -d`)
- **Database:** Firebase/Firestore (CLI already authenticated)
- **Hosting:** Netlify (`netlify-cli` installed, account: `azoni`)
- **Repo:** GitHub repo via `gh` CLI (account: `azoni`)
- **Affiliate:** Amazon Creators API (credentials already exist — see Amazon section)

If the user specifies a different stack (e.g. React + Vite, no Tailwind), use that instead — but still follow every other section of this checklist that applies. The stack is the only thing that changes; the quality bar stays the same.

### Non-Next.js Apps

When building with Vite, plain React, or other non-Next.js frameworks:
- **Env vars:** Vite uses `import.meta.env.VITE_*` (not `process.env.NEXT_PUBLIC_*`). Prefix client-side env vars with `VITE_`. Server-side vars in Netlify Functions use `process.env.*` normally.
- **Netlify config:** Set `publish = "dist"` (not `.next`), omit the `@netlify/plugin-nextjs` plugin. Use `netlify/functions/` directory for serverless endpoints with `[[redirects]]` to proxy `/api/*`.
- **SEO/OG:** Add meta tags directly in `index.html` since there's no `generateMetadata()`. For dynamic OG images, use a Netlify Function or pre-generate them.
- **Icons/PWA:** Place `favicon.svg` and `icon.svg` in `public/` directly (no `src/app/` convention).
- All other requirements (design, analytics beacon, footer link, llms.txt, security headers, cost logging, deployment steps) still apply exactly as written.

### Shared Environment Variables

The monorepo root `.env.local` contains shared API keys reused across apps:
- `OPENAI_API_KEY` — for apps using OpenAI models
- `ANTHROPIC_API_KEY` — for apps using Claude/Anthropic models
- `NEXT_PUBLIC_MCP_READ_KEY` — analytics beacon + MCP admin key (same value)
- `AMAZON_CLIENT_ID`, `AMAZON_CLIENT_SECRET`, `AMAZON_PARTNER_TAG` — affiliate API

Check this file before asking the user for API keys. Copy relevant values to each app's Netlify env vars during deployment.

## Design — No Generic AI Aesthetic

Every site must have a distinct, intentional visual identity. Do NOT use default shadcn styling, generic gradients, or the typical "AI-generated SaaS landing page" look.

**Before writing any CSS or components, decide:**

1. **Personality** — What feeling should this site give? (playful, premium, rugged, cozy, technical, etc.) Write one sentence describing the vibe before starting.
2. **Font pairing** — Pick 2 Google Fonts that match the personality. One for headings, one for body. Never use the default Geist/Inter/system fonts — those scream generic.
3. **Color palette** — Pick a primary color, 2-3 accent colors, and a background tone that fits the vertical. Use actual hex values, not default shadcn gray-on-white.
4. **Card/component style** — Choose a signature look for cards and interactive elements: chunky borders with offset shadows, soft glass morphism, paper/textured, minimal with bold type, etc. Pick ONE and commit to it.
5. **Micro-interactions** — At least one signature animation: hover transforms, spring physics on cards, playful button press effects, etc.

**Rules:**
- Override shadcn CSS variables in `globals.css` to match your palette — never ship the default gray theme
- The site should look like a human designer made choices, not like a template
- If the user doesn't specify a style, ask them what vibe they want. If they say "just pick something", choose something bold and opinionated for the vertical — a fishing gear site should feel different from a skincare site
- The favicon, OG image, color palette, and component style should all feel like the same brand

**Reference:** MeepleMatch uses Comic Neue + Lilita One, kraft/cardboard cards, candy colors, and chunky offset-shadow buttons. That's the level of intentionality expected — not necessarily that style, but that level of commitment to a theme.

## SEO — Every Public Page

Every server-rendered public page MUST have all of the following:

- [ ] `generateMetadata()` (or static `metadata`) with unique `title` and `description`
- [ ] `openGraph: { title, description, images: [{ url, width: 1200, height: 630, alt }] }`
- [ ] `twitter: { card: "summary_large_image" }`
- [ ] `alternates: { canonical: "https://[domain]/[path]" }`
- [ ] JSON-LD `<script type="application/ld+json">` — use the right schema type:
  - Homepage: `WebSite` + `Organization`
  - Category/listing pages: `CollectionPage` or `ItemList`
  - Product/detail pages: `Product` with `AggregateRating` and `Offer`
  - Nested pages: include `BreadcrumbList`
- [ ] Exactly one `<h1>` per page, then `<h2>`, `<h3>` in order
- [ ] Descriptive `alt` text on every image (not just the item name — add context like "box art" or "product photo")
- [ ] At least 2 internal links to other public pages
- [ ] A CTA linking to the main conversion flow

Private/dynamic pages (user sessions, API routes) should have `robots: { index: false, follow: false }`.

### SEO Infrastructure Files

- [ ] `src/app/sitemap.ts` — dynamic, lists every public page, correct `changeFrequency` and `priority`
- [ ] `src/app/robots.ts` — allow `/`, disallow `/api/` and any private routes. Include AI crawler directives (see GEO section)
- [ ] `metadataBase` in root layout must match the domain used in sitemap and robots — no mismatches
- [ ] Root layout `metadata.title` uses template: `{ default: "...", template: "%s — SiteName" }`

## GEO — Generative Engine Optimization (AI/LLM Discoverability)

Make the site discoverable and accurately represented by AI systems (ChatGPT, Claude, Perplexity, Google AI Overviews).

### llms.txt

- [ ] Create `public/llms.txt` — markdown file at root domain:
  - H1 with site/project name (must be first element)
  - Blockquote with 1-3 sentence summary of what the site does
  - `## Pages` section with links to key public pages, each with a one-sentence description
  - `## API` section if there are public APIs (link to OpenAPI spec if applicable)
- [ ] Optionally create `public/llms-full.txt` — same structure but with full page content instead of summaries (for comprehensive LLM ingestion)

### robots.txt — AI Crawler Directives

The `src/app/robots.ts` file must include directives for AI crawlers. **Allow** search/inference bots (they send traffic). **Allow** training bots too (increases your site's representation in AI models):

```ts
rules: [
  { userAgent: "*", allow: "/", disallow: ["/api/", "/swipe/", "/results/"] },
  // AI search/inference bots — ALLOW (these send traffic)
  { userAgent: "Claude-SearchBot", allow: "/" },
  { userAgent: "Claude-User", allow: "/" },
  { userAgent: "OAI-SearchBot", allow: "/" },
  { userAgent: "ChatGPT-User", allow: "/" },
  { userAgent: "PerplexityBot", allow: "/" },
  // AI training bots — ALLOW (increases representation in AI models)
  { userAgent: "ClaudeBot", allow: "/" },
  { userAgent: "GPTBot", allow: "/" },
  { userAgent: "Google-Extended", allow: "/" },
]
```

### Content Structure for GEO

- [ ] Write clear, concise intro paragraphs on every page (LLMs use the first ~200 words heavily)
- [ ] Use `FAQPage` JSON-LD on pages that genuinely have Q&A content
- [ ] Use `HowTo` JSON-LD on pages with step-by-step instructions
- [ ] Structure content with clear headings — LLMs parse heading hierarchy to understand topics
- [ ] Include "best for" / "compared to" / "why this" sections on product pages — these get cited by AI answers

## Analytics Beacon — Launchpad View Tracking

Every app MUST send a **single** view beacon, once per browser session. Uses `sessionStorage` to deduplicate — same user browsing multiple pages only counts once. This keeps Firestore writes low.

**Next.js** — add to `PostHogProvider` (or root layout client component). Replace `APP_SLUG` with your app's slug:

```tsx
const APP_SLUG = "APP_NAME_HERE"; // e.g. "meeplematch" — lowercase, no spaces

// View beacon — fires once per browser session
useEffect(() => {
  const key = process.env.NEXT_PUBLIC_MCP_READ_KEY;
  if (!key) return;
  const storageKey = `lp_view_${APP_SLUG}`;
  try { if (sessionStorage.getItem(storageKey)) return; } catch { return; }
  fetch("https://azoni-mcp.onrender.com/launchpad/view", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ app: APP_SLUG, page: pathname }),
  })
    .then(() => { try { sessionStorage.setItem(storageKey, "1"); } catch {} })
    .catch(() => {});
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

**Vite / non-Next.js** — same pattern, use `import.meta.env.VITE_MCP_READ_KEY` and `window.location.pathname`.

- Env var: `NEXT_PUBLIC_MCP_READ_KEY` (Next.js) or `VITE_MCP_READ_KEY` (Vite) — same key value, different prefix
- The `app` field must be a short lowercase slug (e.g. "meeplematch", "benchmark")
- **One beacon per session** — `sessionStorage` resets when the tab closes, so returning visitors get counted again
- Fire-and-forget — `.catch(() => {})` ensures it never blocks the UI
- **Do NOT fire on every pathname change** — that burns Firestore quota for no value

## UI — Navbar

- [ ] Site icon (favicon SVG or small logo) must appear next to the site name in the navbar
- [ ] Consistent across marketing layout and any standalone pages (swipe, results, etc.)

## Footer — Portfolio Link

Every app footer MUST include a link back to the portfolio:

```
Built by <a href="https://azoni.ai">azoni.ai</a>
```

Keep it subtle — small text, muted color, in the existing footer alongside any affiliate disclosure.

## Icons & PWA

Every site MUST ship with:

- [ ] `src/app/icon.svg` — custom SVG favicon (see quality rules below)
- [ ] `src/app/apple-icon.png` — 180x180 PNG version
- [ ] `src/app/manifest.ts` exporting:
  ```ts
  { name, short_name, theme_color, background_color, display: "standalone",
    icons: [{ src: "/icon-192.png", sizes: "192x192" }, { src: "/icon-512.png", sizes: "512x512" }] }
  ```
- [ ] Generate 192 and 512 PNG icons and place in `public/`
- [ ] `themeColor` in root layout metadata

### Icon Quality Rules

The favicon is the first thing users see in their browser tab and bookmarks. Low-effort icons make the whole site feel cheap. Follow these rules:

1. **Use a 512x512 viewBox** (`viewBox="0 0 512 512"`), not 32x32. This ensures the icon has enough detail to look crisp at any size — PWA icons, apple-touch, bookmark grids, and the console gallery all render at 192px+.
2. **Design for recognition at 16px AND 512px.** The shape should be simple enough to read as a tiny favicon but detailed enough to not look like a placeholder at large sizes. Test it mentally at both extremes.
3. **Use the brand's primary color** as the icon background or dominant element. The icon should feel like it belongs to the site, not like a generic symbol.
4. **Include visual weight and depth.** Use at least 2-3 elements: a background shape, a foreground symbol, and a subtle accent (shadow, gradient, secondary color, or stroke detail). Flat single-shape icons look like placeholders.
5. **Round the corners** of the background rect to match platform conventions (`rx="80"` to `rx="110"` on a 512 viewBox).
6. **No generic symbols.** Don't use a plain circle, square, or single letter. The icon should hint at what the app does or reference the brand name visually.
7. **Copy `icon.svg` to `public/icon.svg`** so the console gallery and SiteLogo components can reference it at the app's live URL.

## OG Image

- [ ] `src/app/opengraph-image.tsx` — generates a branded 1200x630 image using `next/og` `ImageResponse`
- [ ] Include the site name and a short tagline — not blank or generic
- [ ] Test with https://www.opengraph.xyz/ before launch

## Custom Error Pages

- [ ] `src/app/not-found.tsx` — branded 404 page with a link back to home
- [ ] Style it to match the site's theme, not the default Next.js page

## Analytics & Ads

Always include the code, gated by env vars. If the env var isn't set, the script simply doesn't load.

- [ ] **PostHog:** `src/lib/analytics/posthog.ts` + `PostHogProvider` wrapping children in root layout. Env: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- [ ] **GA4:** Add in root layout:
  ```tsx
  {process.env.NEXT_PUBLIC_GA_ID && (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
      <Script id="gtag" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`}</Script>
    </>
  )}
  ```
- [ ] **AdSense:** Add in root layout:
  ```tsx
  {process.env.NEXT_PUBLIC_ADSENSE_ID && (
    <Script src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`} strategy="afterInteractive" crossOrigin="anonymous" />
  )}
  ```

## Images

- [ ] **Never** use `unoptimized` on `<Image>` components — let Next.js optimize
- [ ] Configure `images.remotePatterns` in `next.config.ts` for every external image domain used
- [ ] Use `priority` prop only on the single most important above-the-fold image per page

## Netlify Config

Every `netlify.toml` MUST include security headers. Use the correct template for your framework:

**Next.js apps:**

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**Vite / non-Next.js apps:**

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

## Firebase Setup

When a project needs a database, run these steps via CLI:

1. `firebase projects:create [project-id] --display-name "[Name]"`
2. `firebase apps:create WEB "[Name] Web" --project [project-id]`
3. `firebase apps:sdkconfig WEB [appId] --project [project-id]` — save the config
4. Enable Firestore API:
   ```bash
   ACCESS_TOKEN=$(python3 -c "import json; f=open('$HOME/.config/configstore/firebase-tools.json'); d=json.load(f); print(d['tokens']['access_token'])")
   curl -s -X POST "https://serviceusage.googleapis.com/v1/projects/[project-number]/services/firestore.googleapis.com:enable" -H "Authorization: Bearer $ACCESS_TOKEN"
   ```
5. Wait ~10s, then: `firebase firestore:databases:create "(default)" --project [project-id] --location us-east1`
6. Create service account + key via REST (see meeplematch/scripts for pattern)
7. Grant `roles/datastore.user` via IAM policy update
8. Write `.env.local` with all Firebase config + service account key JSON
9. Create:
   - `src/lib/firebase/admin.ts` — singleton with `cert(getServiceAccount())`
   - `src/lib/firebase/client.ts` — singleton with persistent local cache
   - `src/lib/firebase/collections.ts` — collection name constants

**Important:** When setting env vars on Netlify, suppress output for secrets. If a key is accidentally printed, rotate it immediately.

## Git & Deployment

**CRITICAL:** Every new app lives in a subdirectory of the `azoni/launchpad` monorepo. Follow ALL steps below — skipping any step (especially base directory or git push) will break the deploy.

1. Create app directory in the launchpad repo (e.g. `myapp/`)
2. **Remove inner `.git`** — if `create-next-app` initialized a nested git repo, run `rm -rf myapp/.git` before committing. Otherwise git treats it as a submodule and the files won't be pushed.
3. `netlify sites:create --name [name] --account-slug azoni` — note the **Site ID** from the output
4. `netlify link --id [site-id]` (from inside the app subdirectory)
5. **Set Netlify base directory via API** — this is required so git-triggered builds build the correct app, not the repo root. Set `dir` to `.next` for Next.js or `dist` for Vite:
   ```bash
   netlify api updateSite --data '{"site_id": "[site-id]", "body": {"repo": {"repo": "azoni/launchpad", "provider": "github", "branch": "main", "base": "[app-folder-name]", "cmd": "npm run build", "dir": ".next"}}}'
   ```
6. Set all env vars: `netlify env:set KEY "value"` — pipe secret output to `/dev/null`
7. `netlify deploy --build --prod`
8. Verify the live URL loads correctly
9. **Update the root `README.md`** — add a row to the Apps table with the app name, description, and live URL
10. **Update `apps.json`** at the repo root — add an entry with `name`, `slug`, `description`, `url`, and `tags` fields. This powers the console dashboard at `console/`.
11. **Commit and push to GitHub:**
    ```bash
    cd /path/to/launchpad
    git add README.md apps.json [app-folder-name]/
    git commit -m "Add [app-name] — [short description]"
    git push origin main
    ```
12. **Trigger a console rebuild** — the console gallery reads `apps.json` at build time, so it won't show the new app until it rebuilds. After pushing, trigger a rebuild of the console site:
    ```bash
    cd console && netlify deploy --build --prod
    ```
    Or push a change to `console/` to trigger a git-based rebuild. The new app will not appear in the gallery until this step is done.

## LLM Cost Logging

Every app that calls an LLM API MUST log each call to the MCP activity feed so costs are tracked across the portfolio.

### How to log

After each successful LLM call, fire-and-forget a POST to the MCP server:

```js
fetch('https://azoni-mcp.onrender.com/activity/log', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.MCP_ADMIN_KEY}`,
  },
  body: JSON.stringify({
    type: 'llm_call',
    title: 'Short description of what the call does',
    source: 'launchpad:APP_SLUG',       // e.g. 'launchpad:benchmark'
    description: userInput.slice(0, 200), // truncated input for context
    model: 'gpt-4.1-mini',              // exact model ID used
    tokens: { input: promptTokens, output: completionTokens, total: promptTokens + completionTokens },
    cost: calculatedCostInUSD,           // float, e.g. 0.000832
  }),
}).catch(() => {});
```

### Requirements

- **Calculate cost from token counts** using the model's published pricing. Don't estimate — use `usage` from the API response.
- **Set `MCP_ADMIN_KEY`** as a Netlify env var (same key used across all apps: the MCP admin key).
- **Never block the response** — logging is fire-and-forget with `.catch(() => {})`.
- **Source format**: always `launchpad:{app-slug}` so the dashboard can filter by app.
- **Log every call**, including retries that consume tokens, not just successful ones.

### Pricing reference (update as models change)

| Model | Input | Output |
|-------|-------|--------|
| gpt-4.1-mini | $0.40/1M tokens | $1.60/1M tokens |
| gpt-4.1-nano | $0.10/1M tokens | $0.40/1M tokens |
| claude-sonnet-4 | $3.00/1M tokens | $15.00/1M tokens |
| claude-haiku-4 | $0.80/1M tokens | $4.00/1M tokens |

### Dashboard

Cost data is viewable via:
- `GET https://azoni-mcp.onrender.com/activity/costs?days=30` — breakdown by source, model, type
- `GET https://azoni-mcp.onrender.com/activity/recent?limit=20&source=launchpad:benchmark` — recent events for a specific app

## Amazon Affiliate (If Applicable)

Only include this if the project involves product recommendations or affiliate links.

- Reuse existing credentials from the root `.env.local`:
  - `AMAZON_CLIENT_ID`
  - `AMAZON_CLIENT_SECRET`
  - `AMAZON_PARTNER_TAG`
- Port the TypeScript API client from `meeplematch/src/lib/amazon/` (client.ts, parser.ts, asin.ts, types.ts)
- Footer on every page must include: "As an Amazon Associate, we earn from qualifying purchases."
- Every affiliate link must include the partner tag from `AMAZON_PARTNER_TAG` env var
- Track affiliate clicks in PostHog with `affiliate_click` event

## Pre-Launch Checks

Run all of these before calling a site done:

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds without warnings
- [ ] Every public page returns 200
- [ ] `/sitemap.xml` lists all public pages with correct URLs
- [ ] `/robots.txt` blocks the right paths
- [ ] OG image renders correctly (test at https://www.opengraph.xyz/)
- [ ] Favicon and apple-touch-icon appear in browser
- [ ] Mobile: no horizontal overflow, all tap targets ≥ 44px
- [ ] Lighthouse SEO score: 100 (or justify why not)
- [ ] All images load (no broken/missing images)
- [ ] Affiliate links include correct partner tag (if applicable)
- [ ] Security headers present (check browser devtools → Network → Response Headers)
- [ ] No console errors on any page
- [ ] `/llms.txt` is accessible and well-formatted markdown
- [ ] `robots.txt` includes AI crawler directives
- [ ] Navbar shows site icon next to site name

## Final Output — REQUIRED

Every project MUST end with a fully deployed, working app. The final message to the user must include:

1. **The live Netlify URL** the user can click to view the site
2. A brief summary of what was built
3. Any credentials or env vars that still need to be filled in manually

Do NOT consider a project complete until it is deployed and the URL is confirmed working. "It builds locally" is not done — "here's your link" is done.
