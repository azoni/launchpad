"use client";
import { useState } from "react";
import Link from "next/link";
import { SiteLogo } from "@/components/SiteLogo";

type Phase = "MVP" | "v1" | "scale";
type Box = { id: string; name: string; tech: string; hard: string; effort: "S" | "M" | "L" | "XL"; phase: Phase; star?: boolean };
type Layer = { id: string; label: string; tag: string; accent: string; boxes: Box[] };

const LAYERS: Layer[] = [
  {
    id: "A",
    label: "Field client",
    tag: "offline-first · on the truck",
    accent: "#ff4500",
    boxes: [
      { id: "A1", name: "Field app shell", tech: "Expo RN + EAS + custom dev client", effort: "M", phase: "MVP", hard: "NFC & high-quality camera/barcode aren't in Expo Go; iOS/Android kill background execution (~30 s), so sync can't rely on background time — heavy sync runs foreground with the screen awake." },
      { id: "A2", name: "Local DB", tech: "on-device SQLite (PowerSync RN SDK)", effort: "M", phase: "MVP", hard: "Reads are reactive SQLite queries; every id must be minted offline (uuid v7) so nothing waits on the server to exist." },
      { id: "A3", name: "Never-lose-a-photo outbox", tech: "expo-file-system + AttachmentQueue · sha256", effort: "L", phase: "MVP", star: true, hard: "The file must never live only in volatile OS cache, and its link 'this photo belongs to this deficiency' must be INSERTed in the SAME SQLite transaction as the finding — then uploaded and only marked synced after a server-verified checksum. Everything else hangs off this atomic write." },
      { id: "A5", name: "On-glass capture widgets", tech: "signature-canvas + Skia/Reanimated", effort: "M", phase: "MVP", hard: "Signature, main-drain gauge, stopwatch, battery load-test — each value persists to the write-ahead log the instant it's taken (not on screen-exit), and timers survive backgrounding." },
      { id: "A4", name: "Barcode + NFC scan", tech: "vision-camera + nfc-manager", effort: "M", phase: "v1", hard: "NFC forces the custom dev client and differs sharply iOS vs Android; a scan must resolve to an existing local device row (or flag an off-route unit) fully offline." },
      { id: "A7", name: "Crash-recovery + close-out gate", tech: "PowerSync hooks + Sentry + pending dashboard", effort: "M", phase: "v1", hard: "Zero-loss is only real if it's verifiable — a job can't close while any capture is unsynced; surface queue depth + 'N photos pending' honestly." },
      { id: "A6", name: "Multi-tech collaboration", tech: "shared buckets + LWW-per-field (Yjs for notes)", effort: "L", phase: "scale", hard: "Real-time isn't guaranteed underground — you need conflict-free merge of two techs on one building, not live presence." },
    ],
  },
  {
    id: "B",
    label: "Sync",
    tag: "SQLite ↔ Postgres · zero loss",
    accent: "#f5c842",
    boxes: [
      { id: "B1", name: "Row sync engine", tech: "PowerSync Service (Cloud → self-host)", effort: "M", phase: "MVP", star: true, hard: "uploadData() applies the client op-log transactionally to Postgres and reconciles; bucket rules scope each phone to only its jobs." },
      { id: "B2", name: "Photo upload WAL", tech: "attachments + object storage (R2 / Supabase) · tus", effort: "M", phase: "MVP", hard: "Resumable, checksum-verified binary upload, decoupled from row sync so a stalled 40-photo batch never blocks the findings." },
      { id: "B3", name: "Versioned sync HTTP", tech: "/v1/sync push + pull (idempotent)", effort: "S", phase: "v1", hard: "You can never break an offline truck on an old app version — version the sync contract hard and keep it separate from the office API." },
    ],
  },
  {
    id: "C",
    label: "Core API + Data",
    tag: "system of record",
    accent: "#5b9dff",
    boxes: [
      { id: "C1", name: "Postgres + RLS (not Firestore)", tech: "Supabase Postgres 16", effort: "M", phase: "MVP", star: true, hard: "Every deliverable — PDF, quote, invoice, AHJ filing, dashboard — is a multi-entity JOIN/aggregate. Firestore can't join server-side and its Storage does NOT durably queue offline photo uploads (that IS the 'competitors drop photos' bug). Postgres is the record of truth." },
      { id: "C2", name: "Domain schema — physical", tech: "single-table-inheritance devices, FK + jsonb, uuid v7", effort: "L", phase: "MVP", hard: "Heterogeneous devices (riser, waterflow switch, backflow, PIV, FDC, head, extinguisher, FACP, annunciator, NAC booster, radio) live under one queryable model via a device_class discriminator + typed jsonb attrs." },
      { id: "C4", name: "Multi-tenant isolation (RLS)", tech: "RLS FORCE + request-scoped GUC from verified JWT", effort: "M", phase: "MVP", star: true, hard: "The policy is trivial; the breach is one request where the workspace context is unset/wrong under a permissive policy. SET LOCAL app.current_workspace inside every transaction, claim from a server-verified JWT only, and a CI test that proves tenant A sees zero of B's rows." },
      { id: "C5", name: "tRPC API", tech: "tRPC on Next.js route handlers", effort: "M", phase: "MVP", hard: "Serves the office app's CRUD + reporting; deliberately separate from the field sync protocol (one API can't be both a good sync protocol and a good office API)." },
      { id: "C3", name: "Agreements + NFPA frequencies", tech: "status columns + append-only readings/test_events", effort: "M", phase: "v1", hard: "ITM agreements encode NFPA frequencies at multiple granularities — site annual, device quarterly, dry-system trip test — that drive scheduling and the 'you're due' clock." },
      { id: "C6", name: "Auth · roles · certs", tech: "Supabase Auth JWT + membership + technician_cert", effort: "M", phase: "v1", hard: "Two orthogonal axes: role gates the write surface (tech/office/admin); cert gates work eligibility (who may sign an NFPA 25) — per-person, never per-browser." },
      { id: "C7", name: "Scheduling engine", tech: "durable worker (Inngest/Trigger.dev) + Mapbox/OR-Tools", effort: "L", phase: "v1", hard: "Three stacked problems: frequency expansion into due windows, leveling lumpy due-windows across the month, and cert-matched routing of the day." },
      { id: "C8", name: "Deficiency lifecycle + outbox", tech: "state machine + append-only events + transactional outbox", effort: "L", phase: "v1", star: true, hard: "Severity (impairment vs critical vs noncritical) is domain truth captured at inspection; the transactional outbox fans one field record out — report, filing, quote, invoice, letters — exactly once, with zero re-keying. This is the anti-re-keying engine." },
    ],
  },
  {
    id: "D",
    label: "AI services",
    tag: "drafts prose · never decides safety",
    accent: "#a78bfa",
    boxes: [
      { id: "D1", name: "AI document drafting", tech: "Claude opus-4-8 (letters) / haiku-4-5 · json_schema", effort: "M", phase: "MVP", star: true, hard: "AI drafts the AHJ/customer letter + report narrative FROM the tech's classification but is structurally barred from deciding severity — inject severity & citations from the DB after generation; drafts land in a human review queue. (The demo's live Claude call is the seed.)" },
      { id: "E5ai", name: "Anomaly detection", tech: "plain stats in SQL/Python (not ML)", effort: "S", phase: "v1", hard: "Sparse, noisy annual data (~1 reading/system/year, gauge error) makes naive thresholds throw trust-eroding false alarms — flag main-drain drift & battery age conservatively, LLM only writes the summary." },
      { id: "D2", name: "LLM gateway + evals", tech: "in-house wrapper + golden eval set in CI + LangFuse", effort: "M", phase: "v1", hard: "Build a (findings → expected letter) corpus and an automated grader that fails the build on prompt drift; version prompts, validate structured output, trace every call." },
      { id: "D3", name: "RAG — 'Ask the code'", tech: "Voyage embeddings + pgvector + Claude citations", effort: "M", phase: "v1", hard: "NFPA standard text is copyrighted — RAG only over content you OWN (SOPs, frequency facts, past letters); license NFPA commercially before embedding it, else deep-link to the official viewer." },
      { id: "D5", name: "Voice-to-finding", tech: "on-device ASR → Deepgram/Whisper → Claude extract", effort: "M", phase: "scale", hard: "Offline + noisy + fire vocabulary ('FDC', 'PIV', 'annunciator', 'preaction') — cloud ASR can't run live underground, so capture audio and defer extraction to sync." },
    ],
  },
  {
    id: "E",
    label: "Integrations",
    tag: "the outside world",
    accent: "#4ade80",
    boxes: [
      { id: "E5", name: "NFPA PDF generation", tech: "server-side Chromium (Playwright) from HTML/CSS", effort: "M", phase: "MVP", star: true, hard: "Pixel-faithful NFPA 25/72/10 + AHJ forms with many embedded photos + the on-glass signature, reproducible & archivable — render async from a queue so a 60-device report never blocks a request." },
      { id: "E1", name: "AHJ e-filing", tech: "Brycer / The Compliance Engine partner adapter", effort: "M", phase: "v1", hard: "No open public API — step one is getting into Brycer's partner program; then a submission state machine handles accepted/rejected/re-file with idempotent callbacks." },
      { id: "E3", name: "Accounting sync", tech: "QuickBooks Online REST (OAuth2); Sedona/Sage bridges", effort: "M", phase: "v1", hard: "QBO is the flagship 'keep your books, own the field' target; SedonaOffice has no modern open API (real links are SQL/partner-level) — hide it all behind one 'accounting target' interface." },
      { id: "E4", name: "Payments", tech: "Stripe Payment Links/Checkout + Invoices + webhooks", effort: "M", phase: "v1", hard: "quote → approval → invoice → accounting must stay consistent across PyroGuard + Stripe + QBO with signed, idempotent webhooks that can arrive out of order." },
      { id: "E2", name: "Central-station on/off-test", tech: "workflow + reminders always; Manitou/Stages where granted", effort: "M", phase: "scale", hard: "You usually don't own the central station — 'on test' lives in their automation platform, reachable only via a dealer API; ship the logged workflow everywhere, automate where access is granted." },
    ],
  },
  {
    id: "F",
    label: "Office web app",
    tag: "schedule · review · dashboards",
    accent: "#a7bece",
    boxes: [
      { id: "F1", name: "Office web", tech: "Next.js/TS + tRPC (Netlify/Firebase hosting OK)", effort: "M", phase: "MVP", hard: "Scheduling review, the deficiency review/edit queue, compliance dashboards, and the AI-draft approval surface — the one place a human confirms what the field and the AI produced." },
    ],
  },
];

const EFFORT_TONE: Record<string, string> = { S: "text-pass", M: "text-warn", L: "text-fire", XL: "text-alarm" };
const PHASE_TONE: Record<Phase, string> = { MVP: "text-fire border-fire/50", v1: "text-warn border-warn/50", scale: "text-muted border-border" };

function Box({ b, accent, dim }: { b: Box; accent: string; dim: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen((o) => !o)}
      className={`text-left rounded border bg-surface p-2.5 transition-all w-full ${dim ? "opacity-25" : "opacity-100"} ${
        open ? "border-fire" : "border-border hover:border-fire/60"
      }`}
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-ink text-[12.5px] leading-snug font-sans">
          {b.star && <span className="text-fire">★ </span>}
          {b.name}
        </span>
        <span className={`shrink-0 text-[9px] tracking-widest2 uppercase border rounded-sm px-1 py-0.5 ${PHASE_TONE[b.phase]}`}>{b.phase}</span>
      </div>
      <div className="mt-1 text-fainter text-[10.5px] leading-snug font-mono">{b.tech}</div>
      {open && (
        <div className="mt-2 pt-2 border-t border-border2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-fainter text-[9px] tracking-widest2 uppercase">The hard part</span>
            <span className={`text-[9px] tracking-widest2 uppercase ${EFFORT_TONE[b.effort]}`}>· {b.effort} effort</span>
          </div>
          <p className="text-muted text-[11.5px] leading-relaxed font-sans">{b.hard}</p>
        </div>
      )}
    </button>
  );
}

const DECISIONS = [
  { n: "1", t: "Postgres, not Firestore, for the record of truth", d: "Most consequential and hardest to reverse. The domain is deeply relational and every deliverable is a JOIN/aggregate; Firestore can't join server-side and — decisively — Firebase Storage does not durably queue offline photo uploads, which is the exact 'competitors drop photos on sync' failure this product exists to beat. Keep Firebase, if at all, only for presence/notifications and marketing hosting." },
  { n: "2", t: "Buy the sync engine; over-build the photo write-ahead", d: "Rolling your own bidirectional Postgres↔SQLite sync is a multi-quarter trap — adopt PowerSync. But the differentiator reduces to one line of discipline you own from day one: write the media file to persistent storage and INSERT its attachment row in the same SQLite transaction as the deficiency, then mark synced only after a server-verified checksum. Prove 'capture 50 photos in airplane mode → kill the app → land all 50 verified.'" },
  { n: "3", t: "Multi-tenancy = RLS with a reliably-set request context", d: "The policy is trivial; the breach is a single pooled/serverless connection where the workspace GUC is unset or wrong. RLS FORCE on every table, a mandatory transaction wrapper that SET LOCALs the workspace from a verified JWT, a dedicated non-superuser role, and a CI test proving tenant A sees zero of B's rows — built before customer #2 exists." },
  { n: "4", t: "NFPA content licensing gates 'Ask the Code'", d: "NFPA standard text is copyrighted; the free viewer grants no embedding rights, so RAG over scraped NFPA text is a legal liability, not a feature. Build RAG only over content you own; resolve NFPA licensing commercially before embedding any standard text. And structurally — not by prompt wording — the certified tech's classification is the sole source of truth for safety; the AI drafts and proposes, it never finalizes severity or go/no-go." },
];

export function TechArchitecture() {
  const [phase, setPhase] = useState<"all" | Phase>("all");
  const match = (b: Box) => phase === "all" || b.phase === phase;

  return (
    <div className="min-h-dvh bg-bg text-ink grid-bg">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <SiteLogo />
            <div className="tactical-label mt-3">// System architecture</div>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl uppercase tracking-widest2 text-ink leading-tight">How PyroGuard gets built</h1>
          </div>
          <Link href="/demo" className="text-fainter hover:text-ink text-[11px] tracking-widest2 uppercase border border-border rounded px-3 py-2 transition-colors">
            ▶ The demo
          </Link>
        </header>

        {/* Thesis */}
        <section className="border border-fire/40 rounded bg-fire/5 p-4">
          <div className="tactical-label">// The one guarantee everything serves</div>
          <p className="mt-2 text-ink2 text-[13.5px] leading-relaxed font-sans">
            Two apps over one relational spine. A native field app runs 100% offline in a concrete garage — every capture is
            written to on-device SQLite <span className="text-ink">and a persistent file outbox in the same transaction</span>, so
            nothing a tech captures is ever lost across app-kill, dead battery, or days without signal. When signal returns, a
            bidirectional sync engine flushes it to Postgres, and landing a closed work order fans out — PDF report, AHJ filing,
            priced quote, same-day invoice, AI-drafted letters — with <span className="text-ink">zero re-keying</span>. That
            offline zero-loss guarantee is the reason the whole architecture is shaped the way it is.
          </p>
        </section>

        {/* Phase filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-fainter text-[10px] tracking-widest2 uppercase">Build phase:</span>
          {(["all", "MVP", "v1", "scale"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={`text-[10px] tracking-widest2 uppercase px-2.5 py-1.5 rounded border transition-colors ${
                phase === p ? "text-fire border-fire/50 bg-fire/5" : "text-fainter border-border hover:text-ink"
              }`}
            >
              {p === "all" ? "All" : p}
            </button>
          ))}
          <span className="text-fainter text-[10px] tracking-widest2 uppercase ml-1">tap any box for the hard part · ★ = load-bearing</span>
        </div>

        {/* Diagram — layered bands */}
        <section className="space-y-2">
          {LAYERS.map((layer, i) => (
            <div key={layer.id}>
              <div className="rounded border border-border2 bg-[#0a0e14] p-3">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-[13px] uppercase tracking-widest2" style={{ color: layer.accent }}>
                    {layer.label}
                  </span>
                  <span className="text-fainter text-[10.5px] font-sans">— {layer.tag}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {layer.boxes.map((b) => (
                    <Box key={b.id} b={b} accent={layer.accent} dim={!match(b)} />
                  ))}
                </div>
              </div>
              {/* Flow annotations between bands */}
              {i === 0 && (
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-1.5 text-[10px] tracking-widest2 uppercase">
                  <span className="text-fire">▲ findings · photos · readings</span>
                  <span className="text-info">▼ work orders · roster · prior readings · critical notes</span>
                </div>
              )}
              {i === 1 && (
                <div className="text-center py-1.5 text-fainter text-[10px] tracking-widest2 uppercase">↓ op-log applied transactionally · emits deficiency.synced / workorder.closed</div>
              )}
              {i === 2 && (
                <div className="text-center py-1.5 text-pass text-[10px] tracking-widest2 uppercase">outbox fan-out ⇒ PDF · AHJ filing · quote · invoice · AI letters (exactly once)</div>
              )}
              {(i === 3 || i === 4) && <div className="py-1" />}
            </div>
          ))}
        </section>

        {/* Build order */}
        <section>
          <div className="tactical-label mb-3">// Build order</div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { k: "MVP", tone: "border-fire/50", body: "One inspection type (NFPA 25 wet — the richest offline widgets), the capture loop proven safe end-to-end. Real: Expo shell, PowerSync + Postgres + RLS, the photo outbox with checksum verify + close-out gate, deterministic PDF, the Claude letter draft. Faked: AHJ filing (PDF + email), on-test (manual + reminder), billing (PDF invoice), scheduling (create work orders by hand)." },
              { k: "v1", tone: "border-warn/50", body: "The fan-out and the real integrations: deficiency lifecycle + transactional outbox, real AHJ (Brycer) + QBO + Stripe, scan + remaining widgets + NFPA 72/10, the scheduling engine + certs, sync observability, RAG / anomaly / evals." },
              { k: "scale", tone: "border-border", body: "Cost + frontier: self-host PowerSync, pooled Chromium PDF worker, live multi-tech feel (Yjs), voice-to-finding, ML anomaly forecasting, automated central-station APIs, SedonaOffice bridges per enterprise customer." },
            ].map((p) => (
              <div key={p.k} className={`border ${p.tone} rounded bg-surface p-3`}>
                <div className="text-[11px] tracking-widest2 uppercase text-ink mb-1.5">{p.k}</div>
                <p className="text-muted text-[12px] leading-relaxed font-sans">{p.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 border border-border rounded bg-[#0a0e14] p-3">
            <div className="tactical-label">// First three things to build, in order</div>
            <ol className="mt-2 space-y-1.5 text-ink2 text-[12.5px] leading-relaxed font-sans list-none">
              <li><span className="text-fire">1.</span> Postgres domain schema + RLS + uuid v7 + the tenancy transaction wrapper — everything downstream depends on the relational model and isolation being right first.</li>
              <li><span className="text-fire">2.</span> PowerSync row sync + the photo write-ahead outbox with the atomic same-transaction link and server checksum — prove <span className="text-ink">&ldquo;50 photos offline → kill the app → all 50 land verified&rdquo;</span> before anything else. This is the product&apos;s reason to exist.</li>
              <li><span className="text-fire">3.</span> The Expo capture loop for one NFPA 25 inspection + deterministic PDF + the Claude letter draft — now you have a demonstrable truck-to-report thread.</li>
            </ol>
          </div>
        </section>

        {/* Decisions */}
        <section>
          <div className="tactical-label mb-3">// Decisions that are expensive to reverse</div>
          <div className="space-y-2.5">
            {DECISIONS.map((d) => (
              <div key={d.n} className="border border-border rounded bg-surface p-3">
                <div className="text-ink text-[13px] font-sans">
                  <span className="text-fire tracking-widest2">{d.n}.</span> {d.t}
                </div>
                <p className="mt-1.5 text-muted text-[12px] leading-relaxed font-sans">{d.d}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="text-fainter text-[10.5px] tracking-widest2 uppercase pt-2 border-t border-border">
          PyroGuard — internal architecture · the demo you can play proves the field-to-report thread end to end
        </footer>
      </div>
    </div>
  );
}
