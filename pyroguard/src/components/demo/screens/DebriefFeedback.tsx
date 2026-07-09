"use client";
import { useEffect, useState } from "react";
import { haptic } from "@/lib/haptics";

/**
 * The real ending: an in-page feedback ask, styled as part of the debrief.
 * The demo exists to collect critique from a handful of inspector friends, so the
 * primary action IS the ask — not a sales CTA. One-tap realism chip captures even
 * a lazy reviewer; the free-text box is where the gold is. Posts to Netlify Forms
 * (zero backend, see public/__forms.html); if that ever fails, it falls back to a
 * prefilled email so a reviewer's words are never lost.
 */

const FEEDBACK_EMAIL = "charltonuw@gmail.com"; // where inspector feedback actually lands

const REALISM_CHIPS = [
  { value: "Nailed it", tone: "pass" },
  { value: "Mostly right", tone: "pass" },
  { value: "Some of this is off", tone: "warn" },
  { value: "Not how it works", tone: "alarm" },
] as const;

const encode = (data: Record<string, string>) =>
  Object.entries(data)
    .map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v))
    .join("&");

export function DebriefFeedback({
  runContext = "",
  fieldNotes = [],
}: {
  runContext?: string;
  /** the reviewer's own in-run field notes — captured so they're never discarded */
  fieldNotes?: string[];
}) {
  const [from, setFrom] = useState("");
  const [realism, setRealism] = useState<string>("");
  const [wrong, setWrong] = useState("");
  const [usingToday, setUsingToday] = useState("");
  const [blocker, setBlocker] = useState("");
  const [name, setName] = useState("");
  const [cert, setCert] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Per-friend attribution: the owner can text a link with ?from=marcus
  useEffect(() => {
    try {
      const f = new URLSearchParams(window.location.search).get("from");
      if (f) setFrom(f);
    } catch {
      /* no-op */
    }
  }, []);

  // Join on newline — impossible for a single-line note input to contain, so it never
  // fragments a reviewer's note (a literal " | " in prose would).
  const notesJoined = fieldNotes.join("\n");
  const payload = {
    realism,
    wrong,
    using_today: usingToday,
    blocker,
    name,
    cert,
    from,
    run: runContext,
    notes: notesJoined,
  };

  const mailtoHref = () => {
    const subject = `PyroGuard demo — feedback${from ? ` from ${from}` : ""}`;
    const body = [
      `Did it match your real shift?  ${realism || "—"}`,
      ``,
      `What I got wrong about the trade:`,
      `${wrong || "(add anything — on-test call, severity, the garage head, the extinguisher annual)"}`,
      ``,
      `What you use for this today:  ${usingToday || "—"}`,
      `One thing that'd stop you using this:  ${blocker || "—"}`,
      ...(fieldNotes.length ? [``, `Field notes from the run:`, ...fieldNotes.map((n) => `• ${n}`)] : []),
      ``,
      `— ${name || "(name optional)"}${cert ? `, ${cert}` : ""}`,
    ].join("\n");
    return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const submit = async () => {
    if (sending) return;
    haptic(20);
    setSending(true);
    try {
      const res = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({ "form-name": "demo-feedback", "bot-field": "", ...payload }),
      });
      // NOTE: res.ok does NOT by itself prove Netlify captured the submission — if form
      // detection is off, the CDN just serves the static __forms.html back with a 200. The
      // real guarantee is operational: after deploy we submit a live test and confirm the row
      // lands under Netlify → Forms → demo-feedback (+ an email notification is enabled). The
      // always-visible "or just email it" link below is every reviewer's guaranteed path.
      if (!res.ok) throw new Error(String(res.status));
      setSent(true);
    } catch {
      // Forms not reachable (dev, or detection miss) — never lose their words.
      window.location.href = mailtoHref();
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="border border-pass/50 rounded bg-pass/5 p-4 animate-fade-up">
        <div className="text-pass text-[12px] tracking-widest2 uppercase">// Got it — thank you</div>
        <p className="mt-2 text-ink2 text-[13.5px] leading-relaxed font-sans">
          This came straight to me{from ? `, ${from}` : ""}. If you told me where I got your job wrong, that&apos;s
          exactly what changes next. I&apos;ll send you the build that answers it.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-fire rounded bg-fire/5 p-4 space-y-4">
      <div>
        <div className="tactical-label">// Where I got your job wrong</div>
        <p className="mt-1.5 text-ink text-[13.5px] leading-relaxed font-sans">
          You just ran a shift I built for inspectors like you. Tell me what&apos;s wrong with it — it changes what I
          build next.
        </p>
        {fieldNotes.length > 0 && (
          <p className="mt-2 text-pass text-[11.5px] leading-snug font-sans">
            ▪ Your {fieldNotes.length} field {fieldNotes.length === 1 ? "note" : "notes"} from the run will ride along
            with this.
          </p>
        )}
      </div>

      {/* Step 1 — one tap, captures even if they type nothing */}
      <div>
        <div className="text-fainter text-[11px] tracking-widest2 uppercase mb-2">Did this match your real shift?</div>
        <div className="grid grid-cols-2 gap-2">
          {REALISM_CHIPS.map((c) => {
            const on = realism === c.value;
            const ring =
              c.tone === "pass" ? "border-pass text-pass bg-pass/10" : c.tone === "warn" ? "border-warn text-warn bg-warn/10" : "border-alarm text-alarm bg-alarm/10";
            return (
              <button
                key={c.value}
                onClick={() => {
                  haptic(8);
                  setRealism(c.value);
                }}
                aria-pressed={on}
                className={`min-h-[44px] px-3 py-2.5 rounded border text-[12px] tracking-wide text-left leading-snug transition-colors font-sans ${
                  on ? ring : "border-border text-ink2 hover:border-fire"
                }`}
              >
                {on ? "● " : "○ "}
                {c.value}
              </button>
            );
          })}
        </div>
      </div>

      {/* Steps 2-4 unlock once they've reacted — no blank-form homework up front */}
      {realism && (
        <div className="space-y-4 animate-fade-up">
          <div>
            <label htmlFor="fb-wrong" className="text-fainter text-[11px] tracking-widest2 uppercase">
              What did I get wrong about the trade?
            </label>
            <textarea
              id="fb-wrong"
              value={wrong}
              onChange={(e) => setWrong(e.target.value)}
              rows={3}
              placeholder="The on-test call, the severity classification, the garage head, the extinguisher annual — anything I botched."
              className="mt-1.5 w-full bg-bg border border-border rounded px-3 py-2 text-[15px] text-ink placeholder:text-fainter outline-none focus:border-fire font-sans leading-relaxed resize-none"
            />
          </div>

          <div>
            <label htmlFor="fb-using" className="text-fainter text-[11px] tracking-widest2 uppercase">
              What do you use for this today?
            </label>
            <input
              id="fb-using"
              value={usingToday}
              onChange={(e) => setUsingToday(e.target.value)}
              placeholder="Sedona + paper, Inspect Point, ServiceTrade, BuildingReports…"
              className="mt-1.5 w-full bg-bg border border-border rounded px-3 py-2 text-[15px] text-ink placeholder:text-fainter outline-none focus:border-fire font-sans"
            />
          </div>

          <div>
            <label htmlFor="fb-blocker" className="text-fainter text-[11px] tracking-widest2 uppercase">
              The one thing that&apos;d stop you using this?
            </label>
            <input
              id="fb-blocker"
              value={blocker}
              onChange={(e) => setBlocker(e.target.value)}
              placeholder="Be brutal. This is the useful part."
              className="mt-1.5 w-full bg-bg border border-border rounded px-3 py-2 text-[15px] text-ink placeholder:text-fainter outline-none focus:border-fire font-sans"
            />
          </div>

          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional)"
              className="flex-1 min-w-0 bg-bg border border-border rounded px-3 py-2 text-[15px] text-ink placeholder:text-fainter outline-none focus:border-fire font-sans"
              aria-label="Your name, optional"
            />
            <input
              value={cert}
              onChange={(e) => setCert(e.target.value)}
              placeholder="Cert / jurisdiction (optional)"
              className="flex-1 min-w-0 bg-bg border border-border rounded px-3 py-2 text-[15px] text-ink placeholder:text-fainter outline-none focus:border-fire font-sans"
              aria-label="Your cert or jurisdiction, optional"
            />
          </div>

          <button
            onClick={submit}
            disabled={sending}
            className="w-full bg-fire hover:bg-fire3 active:scale-[0.98] text-white py-3.5 rounded text-[12px] tracking-widest2 uppercase transition-all disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send it straight to me →"}
          </button>
          <p className="text-center">
            <a href={mailtoHref()} className="text-fainter hover:text-ink text-[11px] tracking-widest2 uppercase underline underline-offset-2">
              or just email it →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
