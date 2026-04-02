# Benchmark

Turn any achievement into a bench press max. A memeable, shareable "universal achievement to bench press translator."

## Stack

- **Frontend:** React + Vite
- **Backend:** Netlify Functions (serverless)
- **LLM:** Anthropic Claude (swappable)
- **Styling:** Custom CSS, dark mode

## Setup

```bash
npm install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY
```

## Local Development

Using Netlify CLI (recommended — runs both frontend and functions):

```bash
npx netlify dev
```

This starts the Vite dev server and Netlify Functions on `http://localhost:8888`.

Or run just the frontend (no API):

```bash
npm run dev
```

## Deploy

Push to a connected Netlify site. Build settings are in `netlify.toml`.

Set `ANTHROPIC_API_KEY` in your Netlify site's environment variables.

## Project Structure

```
benchmark/
├── index.html              # Entry HTML with OG/meta tags
├── netlify.toml             # Netlify config + redirects
├── netlify/functions/
│   └── benchmark.js         # POST /api/benchmark — LLM endpoint
├── src/
│   ├── main.jsx
│   ├── App.jsx              # Main app shell
│   ├── index.css            # All styles
│   ├── components/
│   │   ├── Hero.jsx         # Input, CTA, example chips
│   │   ├── ResultCard.jsx   # Result display + share/download
│   │   ├── History.jsx      # localStorage history list
│   │   └── Footer.jsx
│   └── utils/
│       ├── api.js           # Fetch wrapper
│       └── history.js       # localStorage helpers
└── public/
    └── favicon.svg
```

## API

### POST /api/benchmark

**Request:**
```json
{ "input": "Grandmaster in StarCraft as Zerg" }
```

**Response:**
```json
{
  "normalized_input": "Grandmaster in StarCraft as Zerg",
  "domain": "Gaming",
  "prestige": 9,
  "physicality": 2,
  "competitiveness": 10,
  "discipline": 9,
  "bench_estimate": 315,
  "confidence": 0.85,
  "explanation": "Relentless pressure and elite execution. Strong 315 energy."
}
```
