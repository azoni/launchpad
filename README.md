# Launchpad

A monorepo of independent web apps, each built and deployed from a single prompt using [Claude Code](https://claude.ai/claude-code) (or any LLM tool that reads `CLAUDE.md`).

## Apps

| App | Description | Live URL |
|-----|-------------|----------|
| [meeplematch](./meeplematch/) | Board game discovery with swipe-based voting | [meeplematch-app.netlify.app](https://meeplematch-app.netlify.app) |
| [blackdiamond](./blackdiamond/) | Exterior cleaning company site with quote form | [blackdiamond-alpine-wash.netlify.app](https://blackdiamond-alpine-wash.netlify.app) |
| [console](./console/) | Launchpad dashboard — app gallery and AI builder | [launchpad-console.netlify.app](https://launchpad-console.netlify.app) |
| [benchmark](./benchmark/) | Turn any achievement into a bench press max | [benchmark-app-azoni.netlify.app](https://benchmark-app-azoni.netlify.app) |
| [repmatch](./repmatch/) | Workout rep equivalence calculator for competing with friends | [repmatch-app.netlify.app](https://repmatch-app.netlify.app) |
| [crypto-tax-2025](./crypto-tax-2025/) | Personal 2025 crypto tax reconstruction with FIFO + review queue | [crypto-tax-2025.netlify.app](https://crypto-tax-2025.netlify.app) |
| [pyroguard](./pyroguard/) | All-in-one ops platform for fire/life-safety inspection contractors (SedonaOffice replacement, ground-up rebuild) — playable "A Day in the Field" demo | [pyroguard-demo.netlify.app](https://pyroguard-demo.netlify.app) |
| [daily](./dayrun/) | An opt-in calendar — sign in with Google, sync your calendar, track interviews & opportunities, toggle what the world sees | [dayrun-app.netlify.app](https://dayrun-app.netlify.app) |
| [macromarket](./macromarket/) | Ranks foods, snacks & supplements by dollars per gram of protein — with a protein calculator, deals, and an AI coach | [macromarket-app.netlify.app](https://macromarket-app.netlify.app) |
| [health](./health/) | Year-over-year recap of a personal Apple Health export — benchmark year, annual recaps, all-time records & activity breakdowns | [health-recap-azoni.netlify.app](https://health-recap-azoni.netlify.app) |
| [varscout](./varscout/) | Funding-carry screener for Variational Omni perps — ranks 540+ markets by carry net of the tiered spread at your position size | [varscout.netlify.app](https://varscout.netlify.app) |

## How It Works

The [`CLAUDE.md`](./CLAUDE.md) checklist tells the AI everything it needs to build a production-ready app from scratch — design system, SEO, analytics, deployment, the works.

**One prompt. One deployed app.** The checklist handles:

- **Opinionated design** — no generic AI aesthetic, every app gets a distinct visual identity
- **Full SEO & GEO** — metadata, JSON-LD, sitemaps, `llms.txt`, AI crawler directives
- **Analytics** — PostHog, GA4, AdSense, portfolio view tracking
- **Infrastructure** — Firebase/Firestore setup, Netlify config, security headers
- **Deployment** — GitHub repo, Netlify site creation, env vars, live URL verification

Each app deploys independently to Netlify from its own subdirectory. The AI scaffolds, builds, deploys, and verifies — you get back a working link.
