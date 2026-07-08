import type { Scenario } from "@/lib/demo/types";

/**
 * "A Day in the Field" — the playable inspector scenario.
 * Trade details verified against NFPA 25/10/72 practice; every statistic
 * traces to the discovery research brief (see REBUILD.md §1) or published
 * NFPA fire-experience data. Do not add numbers without a source.
 */
export const scenario: Scenario = {
  metaInfo: {
    title: "A Day in the Field",
    tagline: "Play one real NFPA 25 inspection, riser to invoice. Watch four systems become one.",
    estimatedMinutes: 4,
  },

  dummyData: {
    company: { name: "Cascade Fire Protection Co.", city: "Seattle, WA" },
    inspector: {
      name: "Marcus Webb",
      certs: "NICET Level II — Inspection & Testing of Water-Based Systems",
      license: "WA Cert. of Competency No. C-6120",
    },
    site: {
      name: "Meridian Exchange Building",
      address: "1201 Western Ave, Seattle, WA 98101",
      floors: [
        { id: "L3", name: "L3 — TENANT FLOOR", areas: ["East corridor", "Open office", "Elec/IT closet"] },
        { id: "L1", name: "L1 — GROUND", areas: ["Lobby", "Riser room", "Western Ave facade (FDC / PIV)"] },
        { id: "B1", name: "B1 — PARKING", areas: ["Ramp", "Row C stalls", "Elevator lobby"] },
      ],
    },
    customer: { name: "Dana Whitfield", role: "Facility Manager, Meridian Exchange" },
    ahj: {
      name: "Seattle Fire Department — Fire Prevention Division",
      portal: "The Compliance Engine (Brycer)",
      filingFee:
        "~$10–17 per system per report, contractor-paid ($15 Charleston SC, $17 Forney TX, $10 Eugene OR); deficiency repair reports re-file free",
    },
    agreement: {
      type: "3-year ITM agreement (auto-renew), NFPA 25 water-based + NFPA 10 portables",
      frequencies:
        "NFPA 25: annual full inspection; semiannual waterflow device test; quarterly control-valve and gauge inspections. NFPA 10: annual maintenance with barcode-tagged units (owner performs monthly quick-checks); 6-yr internal exam and 12-yr hydro dates tracked.",
    },
  },

  devices: [
    {
      id: "WET-RISER-1",
      label: "Wet-Pipe System Riser",
      type: "sprinkler-riser",
      floor: "L1",
      location: "Riser room off the lobby service corridor — the door with the mop bucket and the WET FLOOR sign that's been dry since 2019",
      checklistItems: [
        "Control valve OPEN — locked & supervised",
        "Static pressure: supply 65 PSI / system 78 (excess held by check valve)",
        "Main drain test: log residual + recovery time",
        "Gauges within 5-yr calibration/replacement",
        "Spare head cabinet: heads + wrench present",
        "Hydraulic design placard legible",
      ],
      history: {
        lastInspected: "2024-03-11 · T. Reyes",
        lastReading: "static 64 PSI · residual 50 · recovery 38 s",
        priorNotes: "No open deficiencies. Gauge flagged for age — still ignored.",
        trendFlag: "ok",
      },
    },
    {
      id: "FLOW-SW-1",
      label: "Waterflow Pressure Switch",
      type: "waterflow-switch",
      floor: "L1",
      location: "Riser room, on WET-RISER-1",
      checklistItems: [
        "Flow inspector's test connection — time to signal",
        "Signal confirmed at central station ≤ 90 s (NFPA 72)",
        "Retard chamber held — no surge trip",
      ],
      history: {
        lastInspected: "2024-03-11 · T. Reyes",
        lastReading: "signal at 0:29 · retard intact",
        priorNotes: "Passed inside the NFPA 72 window.",
        trendFlag: "ok",
      },
    },
    {
      id: "BFP-1",
      label: "Backflow Preventer (DCVA)",
      type: "backflow",
      floor: "L1",
      location: "Riser room, supply side of riser",
      checklistItems: ["Isolation valves open", "No leakage at test cocks", "Annual forward-flow test current"],
    },
    {
      id: "PIV-1",
      label: "Post Indicator Valve",
      type: "control-valve",
      floor: "L1",
      location: "Western Ave planting strip",
      checklistItems: ["Target reads OPEN", "Locked & supervised", "Accessible — no obstructions"],
    },
    {
      id: "FDC-1",
      label: "Fire Department Connection",
      type: "fdc",
      floor: "L1",
      location: "Western Ave facade, north of main entry",
      checklistItems: [
        "Caps/plugs in place",
        "Swivels rotate freely",
        "Check valve holding — no leakage",
        "Signage visible, clear access",
      ],
    },
    {
      id: "FE-L1-01",
      label: "Extinguisher 10-lb ABC",
      type: "extinguisher",
      floor: "L1",
      location: "Lobby, by stair core",
      checklistItems: [
        "Barcode scan — unit verified on route",
        "Gauge in operable (green) range",
        "Pull pin — examine shell, handle, lever, hose",
        "Heft + new tamper seal",
        "Punch maintenance tag — month/year + tech ID",
      ],
      history: {
        lastInspected: "2024-03-11 · T. Reyes",
        lastReading: "gross wt matched · new tag punched",
        priorNotes: "Mounted a proud 62 in. to the top. Left it.",
        trendFlag: "ok",
      },
    },
    {
      id: "HEADS-L3",
      label: "Sprinkler Heads — Floor Survey",
      type: "heads-survey",
      floor: "L3",
      location: "East corridor + open office",
      checklistItems: [
        "18 in. clearance below deflectors",
        "No corrosion, paint, or loading",
        "Escutcheons in place",
        "Correct orientation & temp rating",
      ],
    },
    {
      id: "FE-L3-04",
      label: "Extinguisher 5-lb ABC",
      type: "extinguisher",
      floor: "L3",
      location: "East corridor at the exit door — coffee ring on top like someone's been using it as a coaster",
      checklistItems: [
        "Gauge in operable (green) range",
        "Pull pin — examine shell, handle, lever, hose, nozzle",
        "Heft — matches full-charge weight",
        "New pull-pin + tamper seal installed",
        "Punch maintenance tag — month/year + tech ID",
      ],
      history: {
        lastInspected: "2024-03-11 · T. Reyes",
        lastReading: "gross wt matched · new tag punched",
        priorNotes: "Wiped the coffee ring. Not a finding, just a sigh.",
        trendFlag: "ok",
      },
    },
    {
      id: "VLV-B1-SECT",
      label: "Sectional Control Valve",
      type: "control-valve",
      floor: "B1",
      location: "B1 ramp landing, overhead",
      checklistItems: ["Sealed OPEN", "Tamper switch intact"],
    },
    {
      id: "HEAD-B1-C7",
      label: "Pendent Head, Row C Stall 7",
      type: "sprinkler-head",
      floor: "B1",
      location: "B1 parking, Row C above stall 7, near exhaust fan",
      scripted: "THE DEFICIENCY — corroded, loaded head found in the no-signal zone",
      checklistItems: ["Frame/deflector corrosion check", "Loading — exhaust residue you could write your initials in", "Escutcheon + deflector clearance"],
      history: {
        lastInspected: "2024-03-11 · T. Reyes",
        lastReading: "minor surface corrosion noted — monitor",
        priorNotes: "Downwind of the garage exhaust fan. Worst seat in the building.",
        trendFlag: "worse",
      },
    },
    {
      id: "FE-B1-02",
      label: "Extinguisher 10-lb ABC",
      type: "extinguisher",
      floor: "B1",
      location: "B1 elevator lobby",
      checklistItems: [
        "Gauge in operable (green) range",
        "Pull pin — examine shell, handle, lever, hose",
        "Heft + new tamper seal",
        "Punch maintenance tag — month/year + tech ID",
        "6-yr internal exam verified on collar",
      ],
      history: {
        lastInspected: "2024-03-11 · T. Reyes",
        lastReading: "gross wt matched · 6-yr internal current",
        priorNotes: "Owner's monthly quick-check initials: 3 months, a shrug, nothing since March.",
        trendFlag: "watch",
      },
    },
  ],

  steps: [
    {
      id: "s01-morning",
      phase: "MORNING",
      screen: "briefing",
      title: "0645 — Work order + site intel",
      narrative:
        "SHOP, BALLARD. Coffee's hot. Phone buzzes. WO-2841: Meridian Exchange, 1201 Western Ave. Annual NFPA 25 wet system + NFPA 10 extinguisher round. Year 2 of a 3-year ITM agreement. One card stack, everything on it: last year's main drain numbers, 11 tagged devices, garage gate code 4471# (taped to a coffee stain in truck 6 last year — not this year), riser room behind the lobby service corridor, FM Dana Whitfield on site 0800–1600, central station account 4471-ME. Roll out.",
      interaction: "Accept the work order, thumb through the intel stack, roll out.",
      painPoint: {
        title: "The morning shuffle",
        oldWay:
          "Sedona dispatches the job — it even has a field app — but neither carries the actual inspection: no NFPA 25 forms, no device-level pass/fail, no deficiency capture. So the trail goes cold. Inspection forms are paper NFPA 25 templates printed at the shop. Gate codes and riser-room locations live in a binder in truck 6, or in the head of a tech who quit in March. Site history is a filing cabinet. Whatever happens today gets re-keyed into two more systems tonight.",
        fix: "One work order carries the agreement, the device roster, every prior reading, and the site intel to the phone before wheels roll. Any tech, any truck, zero phone calls. Nothing printed. Nothing re-keyed.",
        stat: "The status-quo stack is 3–5 disconnected systems — Sedona or QuickBooks for money, ServiceTrade or Inspect Point for inspections, BuildingReports for barcodes, a Brycer portal for the AHJ — with the same data re-keyed between all of them.",
      },
    },
    {
      id: "s02-sitemap",
      phase: "ON SITE",
      screen: "sitemap",
      title: "0805 — Site map",
      narrative:
        "MERIDIAN EXCHANGE. Check-in logged — timestamped, geostamped. Building map online: three levels, 11 device pins, status rings waiting. Plan of attack: L1 riser room first, street-side sweep, then L3 top-down, finish in B1 parking.",
      interaction: "Preview each floor with the tabs, then tap the RISER ROOM pin on L1 to begin.",
      painPoint: {
        title: "The paper map problem",
        oldWay:
          "The device list is rows on a paper form. No map. Techs miss devices hidden behind tenant improvements, and nobody knows until the AHJ or a fire finds the gap.",
        fix: "Every tagged device is a pin on the floor map. The job can't close with an uninspected pin.",
        stat: "NFPA fire data (2017–2021): sprinklers operated in 92% of fires large enough to trigger them — and where they failed, 59% of the time the system had been shut off. The gaps are findable. Paper device lists don't find them.",
      },
    },
    {
      id: "s03-ontest",
      phase: "ON SITE",
      screen: "ontest",
      title: "Decision — before you flow water",
      narrative:
        "Riser room. Main drain test is next on the board — a hard 2-inch flow that can trip FLOW-SW-1. And the waterflow alarm test after it definitely will. Central station account 4471-ME is live and dispatching. Your move.",
      interaction: "Pick one. A wrong pick shows the fine, then lets you make the call.",
      choices: [
        {
          label: "Call central station — place ON TEST",
          correct: true,
          feedback:
            "Confirmed. Account 4471-ME on test until 1500 — dispatcher name, time, and window stamped into the job log automatically. Flow all you want; nobody rolls. You'll restore the account off test on your way out.",
        },
        {
          label: "Skip it — it's just a main drain",
          correct: false,
          feedback:
            "Negative. The waterflow test WILL send a signal — and even a hard main drain flow can trip the pressure switch. Central station dispatches. An engine company rolls on a working inspection. Cities typically bill $100–500 per false-alarm response, escalating for repeats. The FM remembers exactly who caused it — for years, at every renewal meeting. Make the call.",
        },
      ],
      painPoint: {
        title: "The on-test call",
        oldWay:
          "Central station number is on a sticky note in the truck. No record the call happened. When a false-dispatch bill lands, it's the tech's word against the monitoring log.",
        fix: "One tap dials central station with the account number pre-loaded; the on-test window is timestamped in the job record. Proof, not memory.",
        stat: "False-alarm response fees typically run $100–500 per incident, escalating for repeat offenses.",
      },
    },
    {
      id: "s04-riser",
      phase: "ON SITE",
      screen: "checklist",
      title: "WET-RISER-1 — main drain + waterflow",
      narrative:
        "System on test. Control valve open, locked, supervised — check. Two gauges on a wet riser: supply reads 65 PSI, system side 78 — that's the excess the alarm-check valve traps, exactly as it should be (system below supply would mean a leaking check). Last year's 64 shows inline, green delta. Crack the main drain: full flow, residual settles at 48 PSI off the supply gauge — log it. Recovery to static in 40 seconds, within 10% of last year. Supply is healthy. Now prove the alarm: open the inspector's test connection. Time to signal... dispatcher confirms waterflow received at 0:34. NFPA 72 window is 90 seconds. FLOW-SW-1 passes.",
      interaction: "Pass the checks, type the main-drain residual and log it, then enter the ITC signal time (or run the timer).",
      painPoint: {
        title: "Clipboard data dies",
        oldWay:
          "Readings penciled onto a paper NFPA 25 form, typed into a Word template back at the office days later, then keyed AGAIN into Sedona for billing. Last year's numbers are in a banker's box, so a slow supply-main decline is invisible.",
        fix: "Structured readings with last year's values inline. Year-over-year trend flags a degrading water supply before it fails a design curve — that's the whole point of annual main drain data.",
        stat: "Sprinkler professionals lose 4.8–14+ hours a week to manual documentation and admin overhead — every reading in the old stack is written once and re-typed twice more.",
      },
    },
    {
      id: "s05-l1-sweep",
      phase: "ON SITE",
      screen: "checklist",
      title: "L1 sweep — street + lobby",
      narrative:
        "Out the lobby doors. PIV in the Western Ave planting strip: target reads OPEN, locked, supervised. FDC north of the entry: caps in place, swivels free, check valve holding, signage clear. Back inside to the supply side: backflow preventer — valves open, no leakage at the test cocks, forward-flow current. Lobby extinguisher FE-L1-01: scan, gauge in the green, pull the pin, examine, heft it, new seal on, new tag punched. Four for four. Elevator to 3.",
      interaction: "Batch quick-pass: four devices, a dozen taps, under a minute.",
    },
    {
      id: "s06-l3-round",
      phase: "ON SITE",
      screen: "extinguishers",
      title: "L3 — heads + portables",
      narrative:
        "Level 3, east corridor. Floor-level head survey: 18-inch deflector clearance good, no paint, no corrosion, no loading, escutcheons seated. FE-L3-04 at the exit door — this is the annual, not a glance: scan the barcode, confirm the gauge sits in the green, pull the pin, examine shell, handle, lever, hose, nozzle. Heft it — still carries its full-charge weight. New tamper seal installed. New maintenance tag punched: month/year, tech ID. Owner keeps the monthly quick-checks; this is the pro pass, and it leaves new hardware on the unit to prove it.",
      interaction: "Tap the head-survey rows to pass, scan the barcode, then run the extinguisher's annual maintenance.",
      painPoint: {
        title: "Tag punches and spreadsheets",
        oldWay:
          "Extinguisher records are hand-punched tags plus a spreadsheet nobody reconciles. A unit walks off to a tenant's storage room and disappears from the program until the AHJ writes it up.",
        fix: "Barcode scan verifies every unit against the route. A missed scan blocks report close-out. The 6-yr internal exam and 12-yr hydro dates ride on the asset record and auto-schedule themselves.",
        stat: "Re-keyed records run 3–8% error rates. Scan-verified visits are the trade's answer — BuildingReports built an entire business on barcoded proof each device was visited, year over year.",
      },
    },
    {
      id: "s07-descend",
      phase: "THE FIND",
      screen: "sitemap",
      title: "B1 — signal lost",
      narrative:
        "Elevator down to B1 parking — enclosed and heated, so it's wet pipe down here, no dry system to fuss. Two floors of concrete overhead, though. Watch the status bar: three bars... one... NO SERVICE. The console shifts to amber: OFFLINE MODE — ALL WORK SAVED LOCALLY. This is the moment most field apps start lying to you.",
      interaction: "Descend to B1. Watch the signal die. Keep working.",
      signal: "none",
    },
    {
      id: "s08-deficiency",
      phase: "THE FIND",
      screen: "camera",
      title: "HEAD-B1-C7 — deficiency",
      narrative:
        "Row C, stall 7, under the exhaust fan. There it is: heavy corrosion across the frame and deflector, exhaust residue loading the head. Two neighbors going the same way. This isn't a speck of surface rust you note and move on — under the 2017/2023 NFPA 25 rule, loading and corrosion only get written up when they're detrimental to performance, and this is: the head may not fuse, and if it does the spray pattern's wrecked. Frame the shot. Shutter. The photo does NOT vanish into a spinner — it lands in the local queue, bound to this head and this work order. Badge: 1 UNSYNCED. Still no bars. Doesn't matter.",
      interaction: "Tap the shutter. Watch the photo file into the local queue.",
      signal: "none",
      painPoint: {
        title: "The photo that vanishes",
        oldWay:
          "Competitor app shows an upload spinner in the garage, fails, and discards the shot. Or the tech photographs it on the camera roll 'to attach later' — it never gets matched to the device, and the deficiency ships undocumented.",
        fix: "Write-ahead local queue. The photo is committed to disk on the phone, bound to HEAD-B1-C7 and this work order, before any network call is attempted. The UNSYNCED badge is an honest promise, not a hope.",
        stat: "The incumbents' 1-star reviews are dominated by exactly this: vanished notes, stuck syncs, stalled photo batches. Apple itself shipped an OS bug (iOS 17.0–17.2) that silently wiped web-app storage — browser-grade persistence is a hope, not a contract.",
      },
    },
    {
      id: "s09-severity",
      phase: "THE FIND",
      screen: "severity",
      title: "Classify it",
      narrative:
        "Row C is documented. Now classify it. Severity — critical vs noncritical — drives your report language, the quote's priority, and the AHJ's clock. Impairment is a separate call on a separate axis: it means the system, or part of it, is OUT OF SERVICE — and this riser is wet, valve open, in service. So the only real question is how much these heads hurt performance.",
      interaction: "Make the call. Wrong answers teach the NFPA 25 classification logic.",
      signal: "none",
      choices: [
        {
          label: "Impairment",
          correct: false,
          feedback:
            "Negative. An impairment means the system or a portion is OUT OF SERVICE — a closed control valve, a drained system. This riser is wet, open, and in service. Corroded heads degrade performance; they don't take the system down. Correct call: CRITICAL DEFICIENCY.",
        },
        {
          label: "Critical deficiency",
          correct: true,
          feedback:
            "Confirmed. A critical deficiency materially affects system performance while the system stays in service — that's the NFPA 25 class. Corrosion and loading can keep a head from fusing or wreck its spray pattern: replace the affected heads. Not an impairment (nothing is out of service), not noncritical (performance is at stake).",
        },
        {
          label: "Noncritical deficiency",
          correct: false,
          feedback:
            "Negative. Noncritical means performance isn't affected — a faded hydraulic placard, a missing spare-head wrench. Heavy frame-and-deflector corrosion can stop the head from operating at all. This materially affects performance: CRITICAL DEFICIENCY.",
        },
      ],
      painPoint: {
        title: "Severity is money and liability",
        oldWay:
          "Severity is a scrawl in a paper form's margin. The office admin — not the NICET tech — guesses at urgency when typing the report, and the repair quote gets priced and prioritized off that guess.",
        fix: "Classification is captured at the point of inspection by the certified tech, drives the quote's priority and the report's NFPA 25 language automatically, and is defensible in an AHJ audit.",
        stat: "When sprinklers operate, they're effective 96% of the time (NFPA, 2017–2021 fires). A head that won't fuse is the exception you're paid to catch — and the classification decides how fast it gets fixed.",
      },
    },
    {
      id: "s10-b1-sweep",
      phase: "THE FIND",
      screen: "checklist",
      title: "B1 sweep — still dark",
      narrative:
        "Finish the level. VLV-B1-SECT overhead on the ramp: sealed open, tamper switch intact — pass. FE-B1-02 at the elevator lobby: gauge green, pin pulled, parts examined, hefted for charge, new seal on, new tag punched, 6-yr internal exam date verified — pass. Queue tray climbs with every capture: 2... 3... 4 UNSYNCED. Zero bars the whole time. Zero anxiety.",
      interaction: "Work the last two devices offline. Watch the queue climb.",
      signal: "none",
    },
    {
      id: "s11-sync",
      phase: "WRAP-UP",
      screen: "sync",
      title: "Elevator up — sync + off test",
      narrative:
        "Doors close on B1. Doors open on L1. Bars return — and the queue flushes itself. 4 UNSYNCED → 3 → 2 → 1 → 0. Green check: ALL RECORDS SYNCED. The corroded-head photo is on the office dashboard before the elevator doors finish opening. One call left: central station. Tap — account 4471-ME restored OFF TEST at 1132, dispatcher confirmed, timestamped right next to the morning's on-test entry. Window closed. Nobody's real alarms get ignored on your account.",
      interaction: "Watch the queue drain, then restore the account off test.",
      painPoint: {
        title: "The truck-cab data silo",
        oldWay:
          "Field results ride home in the truck. The office learns about today's deficiency tomorrow — or Friday, when the paper stack gets processed. The on-test window? Whoever remembers. The repair quote starts its life already days behind.",
        fix: "Auto-sync on signal return, no button to remember. The office sees the critical deficiency while the tech is still riding the elevator — and both central-station calls are logged proof, not memory.",
        stat: "Invoice within 10 days of the job and you collect in ~52 days on average; let it lag and it's 85+. Missing field data — photos, parts, labor — is the top cause of the lag, and this data just synced itself.",
      },
    },
    {
      id: "s12-signature",
      phase: "WRAP-UP",
      screen: "signature",
      title: "1140 — FM sign-off",
      narrative:
        "Lobby. Walk Dana Whitfield through it on the phone: eleven devices, ten passed clean, one critical deficiency with the photo right there on screen — corroded heads, Row C, replacement recommended. Dana squints at the photo: 'That's the one by the fan, isn't it. It's always the one by the fan.' No surprises later, no disputed findings. She signs the glass with her thumb.",
      interaction: "Hand-the-phone moment: draw Dana's signature, then confirm.",
      painPoint: {
        title: "The carbon-copy handshake",
        oldWay:
          "FM signs a carbon-copy paper form and gets the pink sheet, which goes in a drawer. Weeks later the typed report arrives and the customer disputes what the checkmarks meant.",
        fix: "Customer signs on glass over the actual findings and the actual photo. The signed report is in Dana's inbox before the truck clears the garage gate.",
        stat: "Under the old stack, office staff re-enter the same finding into the accounting system, the NFPA report, the quote, and the AHJ portal — four re-entries of one finding, at 3–8% error rates. Dana's copy came straight from the source.",
      },
    },
    {
      id: "s13-office",
      phase: "WRAP-UP",
      screen: "office",
      title: "Meanwhile, back at the office",
      narrative:
        "Four beats, zero humans re-keying: report auto-generated and stamped with the inspector's license. AHJ filing routed with the deadline clock running. The critical deficiency already a priced quote on a hosted approval link. Today's inspection invoiced — same day. Truck's still on Western Ave.",
      interaction: "Tap through the four office beats as they stamp DONE.",
      painPoint: {
        title: "Where the old way goes to die",
        oldWay:
          "Four separate jobs across four systems over days: an admin types the report in Word (days later), someone uploads the PDF to the AHJ portal manually (if remembered), a salesperson builds the repair quote in Sedona (weeks later, if the paper note surfaces), and the invoice waits for the month-end batch.",
        fix: "One field record fans out automatically: licensed-and-stamped report, AHJ filing with a deadline clock, priced quote on an approval link, same-day invoice. The deficiency-to-quote pipe is where ITM contractors mint pull-through repair revenue — or leak it.",
        stat: "The industry benchmark is $1 of repair pull-through per $1 of inspection revenue — and top-half performers on this exact workflow earn 38% more per work order. Deficiency repair reports re-file to The Compliance Engine free.",
      },
    },
    {
      id: "s14-debrief",
      phase: "WRAP-UP",
      screen: "debrief",
      title: "Debrief — scorecard",
      narrative:
        "1147. One building. Eleven devices — all eleven inspected, zero open pins. One critical deficiency found, photographed in a dead zone, classified, quoted, filed, and invoiced — before lunch. Tally it against the old way. Then, since you actually run this route: tell me where I got it wrong.",
      interaction: "Read the tallies against the old way — then tell me what I botched about your job.",
    },
  ],

  debrief: {
    tallies: [
      {
        label: "Paperwork avoided",
        value: "Write-up + data entry done before the truck left",
        contrast: "Sprinkler pros lose 4.8–14+ hours a week to manual documentation and admin — none of it billable.",
      },
      {
        label: "Data re-keyed",
        value: "0 entries",
        contrast:
          "Old way: the same finding is re-entered into accounting, the NFPA report, the quote, and the AHJ portal — four re-entries at 3–8% error rates.",
      },
      {
        label: "False-dispatch fine",
        value: "$0 — on-test window opened and closed, both logged",
        contrast: "One skipped central-station call = a $100–500 false-alarm response fee, escalating for repeats, and an engine company rolled on your inspection.",
      },
      {
        label: "Severity call",
        value: "CRITICAL DEFICIENCY — captured by the certified tech on site",
        contrast: "Old way: an office admin guesses urgency from a margin scrawl days later, and the repair quote gets priced off the guess.",
      },
      {
        label: "Records lost in the dead zone",
        value: "0 of 4",
        contrast: "Cloud-only apps drop photos when the signal dies in a concrete garage; the deficiency ships undocumented or the floor gets re-walked.",
      },
      {
        label: "Deficiency → priced quote",
        value: "Same day, hosted approval link",
        contrast:
          "Old way: the finding rides home on paper and waits weeks for a salesperson. The benchmark is $1 of repair revenue per $1 of inspection revenue — unquoted deficiencies are that dollar, leaked.",
      },
      {
        label: "Invoice out",
        value: "Same day",
        contrast:
          "Batch invoicing adds a 2–3 day gap after every job. Invoice within 10 days and you're paid in ~52 days on average; wait longer and it stretches past 85.",
      },
    ],
    closing:
      "One inspector. One phone. One system from work order to paid — no paper, no re-keying, no lost photos, no open on-test window. Home for lunch. Ask any inspector how often that sentence is true.",
  },
};

/** devices covered by each checklist-style step */
export const stepDevices: Record<string, string[]> = {
  "s04-riser": ["WET-RISER-1", "FLOW-SW-1"],
  "s05-l1-sweep": ["PIV-1", "FDC-1", "BFP-1", "FE-L1-01"],
  "s06-l3-round": ["HEADS-L3", "FE-L3-04"],
  "s10-b1-sweep": ["VLV-B1-SECT", "FE-B1-02"],
};
