# Health Recap

A year-over-year recap of my Apple Health data — steps, calories, workouts, and personal
records, compared across years. Built to answer one question: **can I get back to my most
active year?**

**Live:** https://health-recap.netlify.app  <!-- updated on deploy -->

## What it shows
- **Benchmark banner** — most active year (the target) vs this year vs lifetime totals
- **Annual recap panels** — one per year: steps/day, energy, exercise, distance, resting HR,
  workout/activity breakdown, and % of peak
- **All-time records** — best day / rolling 7-day / rolling 30-day / month, for every metric
- **Best day · week · month by year**, and **Top-10 days** with the activities behind each
- **Calendar heatmaps**, **workout breakdowns**, and a **full comparison table + CSV**

## Stack
Single self-contained **static HTML page** — vanilla JS + inline SVG, no framework, no build
server, no tracking. ~2.3M Apple Health records are pre-aggregated into
`build/health_data.json` and inlined into `public/index.html`.

## Regenerate after a new Apple Health export
1. On iPhone: Health app → profile → *Export All Health Data* → unzip → find `export.xml`.
2. Point `SRC` in `build/parse_health.py` at that `export.xml`.
3. `cd build && python3 parse_health.py`  → rebuilds `health_data.json` (~12s for a 1GB export).
4. `bash build/build.sh`  → inlines the data into the template → `public/index.html`.
5. Commit & push (Netlify auto-deploys) or `netlify deploy --prod --dir=public`.

Methodology (device dedup, active vs total energy, DST-safe date handling, sleep union) is
documented in the page footer and the header of `build/parse_health.py`.
