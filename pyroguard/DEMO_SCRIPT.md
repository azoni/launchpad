# PyroGuard — sales demo scripts

Use the 5-minute version to open a call. Use the 15-minute version for a scheduled demo.
Both run against the live sandbox at `https://pyroguard-demo.netlify.app`.

## Setup (do once before the call)

- Open PyroGuard on the iPhone you'll hand the prospect
- Tap **Try Demo** → wait for clone (≈5 s)
- Land on **Dashboard** with 3 Seattle customers, ~300 devices, open deficiencies
- Put the phone in dark mode if the prospect is outside / in bright light

---

## 5-minute version — "get to the aha"

| Min | What you do | What you say |
|---|---|---|
| 0:00 | Open the site on the prospect's phone. Hand it to them. | "No login. Just tap Try Demo." |
| 0:30 | Prospect sees Dashboard | "This is what your tech sees on Monday morning. 3 customers, 300 devices, 4 critical deficiencies — everything real-time from Firestore." |
| 1:00 | Tap **Jobs** → show map | "Here's the three Pike Place / Swedish / Fairmont stops for today. Tap Optimize Route." |
| 1:20 | Tap Optimize | "Mapbox Directions reorders nearest-neighbor. You see the drive-time savings right there — that's 20 minutes back in the tech's day, every day." |
| 1:45 | Tap **Inspect** → pick a building | "Pick Pike Place Main Arcade." |
| 2:00 | Swipe first device right (Pass) | "Swipe right to pass. Haptic confirms. One tap to next device." |
| 2:20 | Swipe next device left (Fail) | "Swipe left, and the deficiency drawer opens with camera-capture. Let me tap Draft with AI…" |
| 2:40 | Tap **Draft with AI** | "Claude writes the formal description, picks a severity, and suggests a corrective action. It refuses to cite an NFPA section unless it's 100% sure — that's how we keep inspectors out of trouble with AHJs." |
| 3:00 | Log deficiency, swipe through 5 more | "Full inspection runs at about 6-second-per-device. 20 devices in 2 minutes." |
| 4:00 | Hit Finish → sign | "Signature, geo-tag, NFPA 72 Chapter 14 PDF generated client-side, uploaded to Firebase Storage." |
| 4:30 | Show Reports tab → open PDF | "One tap to share with the AHJ. This is what your inspector walks out of the building with, instead of a clipboard." |
| 5:00 | Close | "That's the full loop. What questions do you have?" |

**Kill lines if short on time:** skip the route optimization, skip the AI draft, skip the PDF preview.
Keep: swipe, camera on fail, PDF generation.

---

## 15-minute version — "deep dive"

### Minutes 0–3 — setup & dashboard

1. Open, tap **Try Demo** (5 s clone). Call out anonymous sandbox — "prospect data never hits production."
2. Dashboard KPI cards — today's jobs, overdue, open deficiencies, compliance %.
3. Real-time proof: edit a deficiency in another tab / Firestore console, show it update live.
4. Dark mode toggle — "inspectors work in basements; we don't light them up."

### Minutes 3–6 — jobs, routing, inventory

5. Jobs tab → map with the 3 Seattle stops + technician start point.
6. **Optimize Route** → narrate the drive-time delta. Emphasize Mapbox Directions API.
7. Tap **Maps** on a pin → hands off to native iOS Maps for turn-by-turn. No extra app.
8. Tap a building (e.g. Swedish Main Tower) → inventory grouped by device type, "past service life" badges for anything >10 y.
9. Show age-warning logic: a smoke detector approaching its 10-year NFPA 72 service life is flagged proactively.

### Minutes 6–11 — the inspection flow

10. Start inspection at Pike Place Main Arcade.
11. Swipe demo: right = pass, left = fail, N/A button. Haptic on each.
12. Fail path: camera opens natively via `capture="environment"`. Required photo evidence.
13. Deficiency drawer — severity (low / medium / high / critical), corrective action, re-inspect date.
14. **Draft with AI** → Claude Sonnet 4.5 returns a structured deficiency. Cite the guardrails:
    - "Only cites if 100% certain; otherwise defers to the inspector."
    - "Runs server-side on a Netlify Function with Firebase ID-token verification."
    - "Every call is cost-logged to our launchpad activity feed."
15. Run through 5–10 more devices at pace.
16. Show offline mode: toggle airplane → continue swiping → reconnect → writes flush.
17. Signature pad on completion — geo-tag, timestamped.

### Minutes 11–14 — reports + assistant

18. PDF generates client-side via `@react-pdf/renderer`, uploads to Firebase Storage, metadata lands in Firestore. Open it from Reports.
19. Show NFPA 72 Chapter 14 structure — property, inspection summary, findings table, signatures, disclaimer footer.
20. Share sheet → iOS native share → "This goes to the AHJ in one tap."
21. Back to **Assistant** tab:
    - Ask: *"What's the annual fire alarm inspection requirement per NFPA 72?"* → cited answer.
    - Ask: *"Draft a deficiency: beaded dust buildup on smoke detectors in mechanical room"* → structured output.
    - Point out every response can mark citations as **deferred** when unsure.

### Minutes 14–15 — commercial close

22. Standards page — coverage footprint (NFPA 72, 25, 10, 17/17A, 96, 101, IFC Ch 9).
23. Pricing page — Solo / Shop / Enterprise.
24. "Add to Home Screen" → show the PWA icon on the iPhone dock. "It's an app with zero App Store review cycle."
25. Next steps: "We can have your team running against real data inside two weeks. What's the biggest friction point for your techs today?"

---

## Objection handling cheat-sheet

- **"Is this NICET-certified?"** — PyroGuard is a tool; your NICET-certified inspectors are still the decision-makers. Every report carries the disclaimer. No AHJ rejects a signed PDF because of the software that generated it.
- **"What about AHJ e-filing?"** — Out-of-scope for v1. Plan is to wire into common AHJ portals post-close; one-tap PDF email is the v1 path.
- **"We already use BuildingReports / Inspect Point / ServiceTrade."** — Two differentiators: the swipe UX saves real time per device, and the AI drafting cuts deficiency paperwork by 70%. Offer a 30-day parallel trial.
- **"How is this different from a generic field-service app?"** — Device-level inventory tied to NFPA frequency tables, AI trained on the citation corpus, and inspector-specific UX. A generic FSM app doesn't know what a "supervisory signal monthly test" is.
