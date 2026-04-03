"use client";

import { useState, useEffect } from "react";
import {
  Lock,
  Loader2,
  ShieldAlert,
  AlertTriangle,
  Droplets,
  SprayCan,
  ShieldCheck,
  Wrench,
  ChevronUp,
} from "lucide-react";

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/handbook/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.valid) {
        localStorage.setItem("bd_handbook_auth", "true");
        onUnlock();
      } else {
        setError(data.error || "Incorrect password");
      }
    } catch {
      setError("Failed to validate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-lg border-l-4 border-l-teal shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-teal" />
            </div>
            <h1 className="font-heading text-xl uppercase tracking-wide">
              Employee Handbook
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Enter your team password to access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm text-center tracking-wider placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal/30"
            />
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary w-full justify-center"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Access Handbook"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─── Callout Components ─── */

function SafetyCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-l-teal bg-teal/5 p-4 my-4">
      <div className="flex gap-3">
        <ShieldAlert className="w-5 h-5 text-teal shrink-0 mt-0.5" />
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function DangerCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-l-destructive bg-destructive/5 p-4 my-4">
      <div className="flex gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/* ─── Handbook Content ─── */

function HandbookContent() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 bg-teal rotate-45 rounded-sm" />
          <span className="font-heading text-sm uppercase tracking-wider text-teal">
            Internal Document
          </span>
        </div>
        <h1 className="font-heading text-3xl uppercase tracking-wide">
          Employee Field Handbook
        </h1>
        <p className="text-muted-foreground mt-2">
          Black Diamond Alpine Wash — Standard operating procedures, safety
          protocols, and surface protection guidelines.
        </p>
      </div>

      {/* Table of Contents */}
      <nav className="bg-card rounded-lg border border-border p-6 mb-12">
        <h2 className="font-heading text-sm uppercase tracking-wider mb-4">
          Contents
        </h2>
        <ol className="space-y-2 text-sm">
          {[
            { id: "safety", icon: ShieldAlert, label: "General Safety" },
            { id: "pressure-washing", icon: SprayCan, label: "Driveway Pressure Washing" },
            { id: "soft-washing", icon: Droplets, label: "Window Soft Washing" },
            { id: "roof-cleaning", icon: ShieldCheck, label: "Roof Cleaning" },
            { id: "equipment", icon: Wrench, label: "Equipment Care" },
          ].map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="flex items-center gap-3 text-muted-foreground hover:text-teal transition-colors py-1"
              >
                <item.icon className="w-4 h-4" />
                <span>
                  {i + 1}. {item.label}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* ── Section 1: General Safety ── */}
      <section id="safety" className="mb-16 scroll-mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-teal" />
          </div>
          <h2 className="font-heading text-2xl uppercase tracking-wide">
            1. General Safety
          </h2>
        </div>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Required PPE — Every Job
        </h3>
        <ul className="space-y-2 text-sm list-none">
          {[
            "Safety glasses or chemical splash goggles (mandatory when spraying any chemical)",
            "Non-slip, closed-toe boots with ankle support — no sneakers, ever",
            "Chemical-resistant gloves (nitrile minimum; neoprene for SH handling)",
            "Hearing protection when running the pressure washer for more than 15 minutes",
            "Long pants and long sleeves when applying chemical treatments",
            "Hard hat when working below a team member on a ladder or roof",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-teal rotate-45 shrink-0 mt-2" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <SafetyCallout>
          <strong>Montana weather rule:</strong> In summer, start hydrating before
          you arrive on site. In winter, watch for ice on walkways and equipment.
          If the ambient temp is below 35&deg;F, chemicals react slower — increase
          dwell time, not concentration.
        </SafetyCallout>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Ladder Safety
        </h3>
        <ul className="space-y-2 text-sm list-none">
          {[
            "Always set up on firm, level ground. Use leg levelers on slopes — never stack boards.",
            "Maintain 3 points of contact at all times (two hands + one foot or two feet + one hand).",
            "Do not carry equipment up a ladder. Use a rope/bucket system or have a ground partner hand items up.",
            "Extension ladders: extend 3 feet above the roofline or gutter edge.",
            "Never lean a ladder against a gutter — use a standoff stabilizer.",
            "If working above 10 feet, a second person must be on site. Above 20 feet, use a harness.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-teal rotate-45 shrink-0 mt-2" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Chemical Handling
        </h3>
        <ul className="space-y-2 text-sm list-none">
          {[
            "Read the SDS (Safety Data Sheet) for every product we carry. Copies are in the truck binder and on the shared drive.",
            "Never mix chemicals unless the SOP explicitly calls for it. Bleach + acid = chlorine gas.",
            "Sodium hypochlorite (SH) is our primary cleaning agent. It's effective but caustic — skin contact causes burns, inhaling fumes irritates lungs.",
            "Always dilute SH before loading into the tank. Never spray concentrate.",
            "If SH contacts skin, flush with water for 15 minutes. If it contacts eyes, flush and call 911.",
            "Rinse all equipment thoroughly after every SH use — it corrodes metal fittings.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-teal rotate-45 shrink-0 mt-2" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <DangerCallout>
          <strong>NEVER mix bleach (sodium hypochlorite) with any acid-based
          cleaner.</strong> This produces chlorine gas, which is immediately
          dangerous to life and health. If you smell a sharp, pungent chemical
          odor that isn&apos;t normal SH, leave the area immediately and call
          your supervisor.
        </DangerCallout>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Emergency Procedures
        </h3>
        <ul className="space-y-2 text-sm list-none">
          {[
            "First aid kit is in every truck — check it's stocked at the start of each week.",
            "Eye wash bottles: one in the truck, one on your person when spraying chemicals.",
            "For chemical burns: flush with clean water immediately — do not wait.",
            "For falls from height: do not move the person. Call 911, keep them warm.",
            "Know the nearest hospital to every job site — check before you start.",
            "Report every injury to your supervisor the same day, even if it seems minor.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-teal rotate-45 shrink-0 mt-2" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Section 2: Driveway Pressure Washing ── */}
      <section id="pressure-washing" className="mb-16 scroll-mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
            <SprayCan className="w-5 h-5 text-teal" />
          </div>
          <h2 className="font-heading text-2xl uppercase tracking-wide">
            2. Driveway Pressure Washing
          </h2>
        </div>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          PSI Guidelines by Surface
        </h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-card">
                <th className="text-left p-3 font-heading text-xs uppercase tracking-wider">Surface</th>
                <th className="text-left p-3 font-heading text-xs uppercase tracking-wider">Max PSI</th>
                <th className="text-left p-3 font-heading text-xs uppercase tracking-wider">Tip</th>
                <th className="text-left p-3 font-heading text-xs uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr><td className="p-3">Poured concrete</td><td className="p-3">3,000–4,000</td><td className="p-3">25&deg; (green)</td><td className="p-3">Standard — can handle full pressure</td></tr>
              <tr><td className="p-3">Stamped/stained concrete</td><td className="p-3">1,500–2,000</td><td className="p-3">40&deg; (white)</td><td className="p-3">Too much pressure lifts sealant</td></tr>
              <tr><td className="p-3">Brick pavers</td><td className="p-3">2,000–2,500</td><td className="p-3">25&deg; (green)</td><td className="p-3">Watch for loose joint sand — resand after</td></tr>
              <tr><td className="p-3">Asphalt</td><td className="p-3">2,000–2,500</td><td className="p-3">25&deg; (green)</td><td className="p-3">High pressure can strip aggregate</td></tr>
              <tr><td className="p-3">Flagstone/natural stone</td><td className="p-3">1,200–1,500</td><td className="p-3">40&deg; (white)</td><td className="p-3">Soft stone — test a hidden spot first</td></tr>
              <tr><td className="p-3">Wood deck</td><td className="p-3">500–1,200</td><td className="p-3">40&deg; (white)</td><td className="p-3 font-semibold text-destructive">Soft wash preferred — see note</td></tr>
            </tbody>
          </table>
        </div>

        <DangerCallout>
          <strong>Wood surfaces:</strong> Standard pressure washing destroys
          wood fibers, leaving a fuzzy, splintered surface that looks worse
          than before. Use the soft wash system at &lt;1,200 PSI or
          downstream the chemical and rinse gently. If the customer has a
          cedar deck, always default to soft wash.
        </DangerCallout>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Pre-Wash Inspection
        </h3>
        <ul className="space-y-2 text-sm list-none">
          {[
            "Walk the entire surface. Note cracks, lifted sections, expansion joints, and drainage direction.",
            "Identify nearby plants, vehicles, outdoor furniture, and pets. Move what you can, cover what you can't.",
            "Pre-wet all landscaping within 10 feet of the work area — this dilutes any chemical runoff before it can harm plants.",
            "Check for electrical outlets, exterior wiring, or light fixtures at ground level — mask them with plastic.",
            "Photograph any pre-existing damage (cracks, stains, chipped edges) and show the customer before starting.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-teal rotate-45 shrink-0 mt-2" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Technique
        </h3>
        <ol className="space-y-3 text-sm list-decimal list-inside">
          <li><strong>Pre-treat stains.</strong> Apply degreaser to oil spots and let it dwell 5–10 minutes. For rust stains, use oxalic acid solution (wear full PPE).</li>
          <li><strong>Start at the far end</strong> and work toward your truck/water source so you&apos;re never walking over cleaned areas.</li>
          <li><strong>Use a surface cleaner</strong> for flat areas whenever possible — it gives even, streak-free results and is 3x faster than a wand.</li>
          <li><strong>Maintain consistent distance:</strong> 6–8 inches for the surface cleaner, 12–18 inches for wand work. Closer = risk of etching. Further = uneven clean.</li>
          <li><strong>Overlap each pass by 50%.</strong> If you see stripes, you&apos;re not overlapping enough.</li>
          <li><strong>Detail edges and joints</strong> with the wand after the main pass. Switch to a 15&deg; (yellow) tip for stubborn spots only.</li>
          <li><strong>Post-rinse</strong> the surrounding area — sidewalks, garage door bottom, foundation edges — to remove splashback.</li>
        </ol>

        <SafetyCallout>
          <strong>Never point the wand at a person, even when the trigger is
          off.</strong> At 3,000+ PSI, a pressure washer can inject water
          through skin, causing serious internal injuries. Treat the wand
          like a firearm — muzzle discipline applies.
        </SafetyCallout>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Common Mistakes
        </h3>
        <ul className="space-y-2 text-sm list-none">
          {[
            "Holding the wand too close — etches concrete and leaves visible lines that are permanent.",
            "Using the wrong tip — a 0° (red) tip should almost never be used on flat surfaces. It concentrates the stream and cuts into material.",
            "Not rinsing landscaping before and after — one complaint about dead plants costs more than the entire job.",
            "Skipping the pre-treat — you'll end up going over oil stains 5 times instead of letting chemistry do the work.",
            "Working against the drainage slope — dirty water pools on your clean areas.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-destructive rotate-45 shrink-0 mt-2" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Section 3: Window Soft Washing ── */}
      <section id="soft-washing" className="mb-16 scroll-mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-teal" />
          </div>
          <h2 className="font-heading text-2xl uppercase tracking-wide">
            3. Window Soft Washing
          </h2>
        </div>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Why Soft Wash for Windows
        </h3>
        <p className="text-sm mb-4">
          Standard pressure washing cracks glass, blows out seals, forces water
          behind frames, and damages screens. Windows are always soft washed
          — meaning low volume, low pressure, with cleaning solution doing the
          work instead of force.
        </p>

        <DangerCallout>
          <strong>Never use a pressure washer on windows.</strong> Even at
          &quot;low&quot; settings, the concentrated stream can crack panes,
          break seals (causing permanent fogging between double-pane glass),
          and drive water into the wall cavity behind the frame.
        </DangerCallout>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Solution Mixing
        </h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-card">
                <th className="text-left p-3 font-heading text-xs uppercase tracking-wider">Situation</th>
                <th className="text-left p-3 font-heading text-xs uppercase tracking-wider">SH Ratio</th>
                <th className="text-left p-3 font-heading text-xs uppercase tracking-wider">Surfactant</th>
                <th className="text-left p-3 font-heading text-xs uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr><td className="p-3">Light dirt/pollen</td><td className="p-3">1% SH</td><td className="p-3">1 oz/gal</td><td className="p-3">Most residential maintenance cleans</td></tr>
              <tr><td className="p-3">Moderate buildup</td><td className="p-3">2% SH</td><td className="p-3">1 oz/gal</td><td className="p-3">Annual or first-time cleans</td></tr>
              <tr><td className="p-3">Heavy mold/algae</td><td className="p-3">3% SH</td><td className="p-3">2 oz/gal</td><td className="p-3">Shaded or north-facing windows</td></tr>
              <tr><td className="p-3">Hard water stains</td><td className="p-3">No SH</td><td className="p-3">—</td><td className="p-3">Use dedicated HW remover (see below)</td></tr>
            </tbody>
          </table>
        </div>

        <SafetyCallout>
          <strong>SH on windows:</strong> Do not let SH solution sit on glass
          for more than 3–5 minutes. It won&apos;t etch glass at our
          concentrations, but it will damage window frames (especially painted
          wood and vinyl) and kill any plants the runoff touches. Rinse
          promptly.
        </SafetyCallout>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Procedure
        </h3>
        <ol className="space-y-3 text-sm list-decimal list-inside">
          <li><strong>Remove screens.</strong> Lean them against the house (glass side out) and note which window they came from. Clean screens separately with a soft brush and rinse.</li>
          <li><strong>Pre-rinse the glass</strong> with clean water from top to bottom. This removes loose dirt and ensures even chemical coverage.</li>
          <li><strong>Apply solution</strong> with a pump sprayer or soft wash system. Work one window at a time on sunny days (solution dries fast).</li>
          <li><strong>Scrub with a strip washer</strong> (T-bar with microfiber sleeve). Work in horizontal strokes, overlapping each pass.</li>
          <li><strong>Squeegee</strong> from top to bottom in a reverse-S pattern. Wipe the blade with a clean cloth after every stroke.</li>
          <li><strong>Detail the edges</strong> with a lint-free cloth. Wipe the sill and frame.</li>
          <li><strong>Reinstall screens</strong> after all windows on that side are complete.</li>
        </ol>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Hard Water Stain Removal
        </h3>
        <p className="text-sm mb-3">
          Hard water deposits (white mineral spots from sprinklers) don&apos;t
          respond to SH. Use a dedicated hard water remover with a white
          scrub pad:
        </p>
        <ul className="space-y-2 text-sm list-none">
          {[
            "Apply the product to a wet pad, not directly to dry glass.",
            "Work in small circles with moderate pressure. You'll feel the grit dissolving.",
            "Rinse frequently and check your progress — once the spots are gone, stop scrubbing.",
            "Never use a green (abrasive) pad on glass — it scratches. White or blue pads only.",
            "For extreme cases (years of sprinkler buildup), a glass polishing compound and buffer may be needed — flag this for the supervisor to quote separately.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-teal rotate-45 shrink-0 mt-2" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Working at Height
        </h3>
        <ul className="space-y-2 text-sm list-none">
          {[
            "First floor: no ladder needed — use an extension pole.",
            "Second floor: extension ladder. Follow all ladder safety rules from Section 1.",
            "Third floor: ladder plus harness, OR use a water-fed pole system from the ground (preferred).",
            "If the window can't be safely reached, tell the customer. Never overextend on a ladder to reach a window.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-teal rotate-45 shrink-0 mt-2" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Section 4: Roof Cleaning ── */}
      <section id="roof-cleaning" className="mb-16 scroll-mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-teal" />
          </div>
          <h2 className="font-heading text-2xl uppercase tracking-wide">
            4. Roof Cleaning
          </h2>
        </div>

        <DangerCallout>
          <strong>RULE #1: Never pressure wash a roof.</strong> This is
          non-negotiable, regardless of what the customer asks for. Pressure
          washing strips granules from asphalt shingles (destroying their UV
          protection and halving their lifespan), cracks tile, splinters cedar
          shake, and drives water under flashing. We soft wash every roof, every
          time. If a customer insists on pressure washing, we decline the job.
        </DangerCallout>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Soft Wash Application
        </h3>
        <ol className="space-y-3 text-sm list-decimal list-inside">
          <li><strong>Inspect the roof from the ground first</strong> with binoculars. Look for missing shingles, damaged flashing, or structural sag. If anything looks unsafe, do not get on the roof — flag it for the customer.</li>
          <li><strong>Pre-wet all landscaping</strong> below the roofline and cover delicate plants with tarps. SH runoff will kill plants.</li>
          <li><strong>Mix your solution:</strong> 3–4% SH with surfactant for algae/moss. For heavy lichen, go to 5% max. Never exceed 6%.</li>
          <li><strong>Apply from the ridge down</strong> using a 12V soft wash system. Work in sections, letting the solution run naturally with gravity.</li>
          <li><strong>Dwell time:</strong> 15–20 minutes for algae. Moss and lichen may need 25–30 minutes. If it starts to dry, mist it (don&apos;t re-saturate).</li>
          <li><strong>Rinse from the ridge down</strong> with low-pressure water. Let the garden hose or soft wash rinse do the work — no wand.</li>
          <li><strong>Post-rinse all landscaping</strong> thoroughly. Run water at the base of all plants in the runoff zone for at least 5 minutes.</li>
        </ol>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Surface-Specific Notes
        </h3>
        <div className="space-y-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <h4 className="font-heading text-sm uppercase tracking-wider mb-2">Asphalt Shingles</h4>
            <p className="text-sm text-muted-foreground">
              The most common and most fragile. The granule surface is what
              protects the asphalt from UV — every granule knocked loose
              shortens the roof&apos;s life. Never walk on asphalt shingles in
              direct sun (they soften) or below freezing (they crack). If you
              must walk, wear soft-soled shoes and step on the lower third of
              each shingle where the nail line provides support.
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <h4 className="font-heading text-sm uppercase tracking-wider mb-2">Metal Roofing</h4>
            <p className="text-sm text-muted-foreground">
              Extremely slippery when wet — walking on a wet metal roof is
              one of the most dangerous things in this job. Clean from a
              ladder with extension wands whenever possible. If you must walk
              on it, use roof-rated non-slip boots and a harness, and only
              when the surface is dry.
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <h4 className="font-heading text-sm uppercase tracking-wider mb-2">Cedar Shake</h4>
            <p className="text-sm text-muted-foreground">
              <strong>Do not use bleach (SH) on cedar.</strong> It strips the
              natural oils and turns the wood gray/white. Use an
              oxygen-based cleaner (sodium percarbonate) instead. Lower
              concentration, longer dwell time. Cedar is also structurally
              fragile when old — test each shake before putting your weight
              on it.
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <h4 className="font-heading text-sm uppercase tracking-wider mb-2">Tile and Slate</h4>
            <p className="text-sm text-muted-foreground">
              Walk only on the peaks (where tiles overlap and the nail line
              sits). Stepping in the valleys cracks tiles. Slate is especially
              brittle — avoid walking entirely if possible. Use extension wands
              from the ladder or ridge.
            </p>
          </div>
        </div>

        <SafetyCallout>
          <strong>Fall protection:</strong> Any time you&apos;re on a roof, you
          need a harness attached to a roof anchor. No exceptions, regardless of
          pitch. A 6-foot fall from a single-story roof can be fatal. Set up
          your anchor and lanyard before stepping off the ladder.
        </SafetyCallout>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Gutter Rinse &amp; Debris
        </h3>
        <ul className="space-y-2 text-sm list-none">
          {[
            "After the roof rinse, flush all gutters with a garden hose to clear dead algae and debris.",
            "Check downspouts for clogs — the chemical runoff carries organic material that can block them.",
            "Remove any large debris (leaves, branches, moss clumps) by hand into a bucket. Don't push it into the downspout.",
            "If gutters are overflowing or visibly damaged, note it for the customer — we don't do gutter repair, but they should know.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-teal rotate-45 shrink-0 mt-2" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Section 5: Equipment Care ── */}
      <section id="equipment" className="mb-16 scroll-mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-teal" />
          </div>
          <h2 className="font-heading text-2xl uppercase tracking-wide">
            5. Equipment Care
          </h2>
        </div>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Daily Checklist — Before Every Job
        </h3>
        <ul className="space-y-2 text-sm list-none">
          {[
            "Check oil level on the pressure washer pump and engine.",
            "Inspect all hoses for kinks, cracks, or bulges. Replace any damaged hose immediately — a blowout at 4,000 PSI is dangerous.",
            "Test all spray tips and quick-connect fittings. If a fitting is hard to connect, clean or replace the O-ring.",
            "Verify the unloader valve is functioning — run water through the system before connecting the wand.",
            "Check soft wash pump and hose connections. Prime the pump if it's been sitting.",
            "Confirm chemical tanks are sealed and labeled. Never transport open or unlabeled containers.",
            "Test the truck battery and water tank level. Running dry damages the pressure washer pump.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-teal rotate-45 shrink-0 mt-2" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Pump Maintenance
        </h3>
        <ul className="space-y-2 text-sm list-none">
          {[
            "Change pump oil every 50 hours of use or monthly, whichever comes first.",
            "After every job involving SH, run 2 minutes of clean water through the entire system to flush residual chemical.",
            "If the pump pulsates or loses pressure, check the inlet filter first — 90% of issues are a clogged filter.",
            "Store the pump with the bypass valve open. Never leave pressure sitting in a stationary system.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-teal rotate-45 shrink-0 mt-2" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <h3 className="font-heading text-lg uppercase tracking-wide mb-3 mt-8">
          Winterization (Montana Critical)
        </h3>
        <SafetyCallout>
          <strong>Frozen equipment = destroyed equipment.</strong> When nighttime
          temps drop below 32&deg;F, winterize every piece of water equipment
          at the end of every day. Don&apos;t wait for &quot;later&quot; — one
          freeze cracks a pump housing, and that&apos;s a $500+ repair.
        </SafetyCallout>
        <ul className="space-y-2 text-sm list-none">
          {[
            "Drain all water from the pressure washer pump, hoses, and spray gun. Disconnect and coil hoses so water drains completely.",
            "Run RV antifreeze (propylene glycol, NOT automotive ethylene glycol) through the pump and soft wash system.",
            "Store hoses indoors or in a heated space. Frozen hoses crack at the fittings.",
            "Remove and store spray tips indoors — the small orifices trap water that expands when frozen.",
            "If the truck doesn't have a heated compartment, bring the pressure washer inside overnight.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-teal rotate-45 shrink-0 mt-2" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Back to top */}
      <div className="text-center pt-8 border-t border-border">
        <a
          href="#"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-teal transition-colors"
        >
          <ChevronUp className="w-3 h-3" />
          Back to top
        </a>
        <p className="text-xs text-muted-foreground/50 mt-4">
          Black Diamond Alpine Wash — Internal Use Only
        </p>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function HandbookPage() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("bd_handbook_auth") === "true") {
      setUnlocked(true);
    }
  }, []);

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return <HandbookContent />;
}
