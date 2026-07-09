"use client";
import { useCallback, useEffect, useState } from "react";

type Submission = {
  id: string;
  created_at: string;
  realism: string;
  wrong: string;
  using_today: string;
  blocker: string;
  name: string;
  cert: string;
  from: string;
  run: string;
};

type Todo = { id: string; text: string; done: boolean; created: number };

const TODO_KEY = "pg_admin_todos";

const SEED_TODOS: string[] = [
  "Ask Sam: what's a 'TAP account' + does it need its own on-test call?",
  "Ask Sam: restricted-site scope (jails) — whole site vs rooms; tablet allowed at all?",
  "Ask Sam: who authors the site map (photo of evac plan / client CAD / nothing)?",
  "Wire TAP-account field into the monitoring block once Sam defines it",
  "Build the restricted-site bypass UI (suppress map / photos / GPS)",
  "Confirm battery due-date basis (install vs mfg date; 3/4/5-yr interval)",
];

const REALISM_TONE: Record<string, string> = {
  "Nailed it": "text-pass border-pass/40",
  "Mostly right": "text-pass border-pass/40",
  "Some of this is off": "text-warn border-warn/40",
  "Not how it works": "text-alarm border-alarm/40",
};

function fmtDate(iso: string) {
  if (!iso) return "";
  // Avoid new Date() timezone surprises in SSR — this is a client component so it's fine.
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function AdminDashboard() {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<"open" | "all" | "done">("open");

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/feedback", { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) setErr(json.error || "Could not load feedback.");
      setSubs(Array.isArray(json.submissions) ? json.submissions : []);
    } catch {
      setErr("Could not reach /api/feedback.");
      setSubs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  // Todos — localStorage, seeded once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TODO_KEY);
      if (raw) {
        setTodos(JSON.parse(raw));
      } else {
        const seeded = SEED_TODOS.map((text, i) => ({ id: `seed-${i}`, text, done: false, created: i }));
        setTodos(seeded);
        localStorage.setItem(TODO_KEY, JSON.stringify(seeded));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (next: Todo[]) => {
    setTodos(next);
    try {
      localStorage.setItem(TODO_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };
  const addTodo = () => {
    const t = draft.trim();
    if (!t) return;
    persist([{ id: `t-${Date.now()}`, text: t, done: false, created: Date.now() }, ...todos]);
    setDraft("");
  };
  const toggleTodo = (id: string) => persist(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const removeTodo = (id: string) => persist(todos.filter((t) => t.id !== id));

  const shownTodos = todos.filter((t) => (filter === "all" ? true : filter === "done" ? t.done : !t.done));
  const openCount = todos.filter((t) => !t.done).length;

  // Feedback stats
  const tally = subs.reduce<Record<string, number>>((m, s) => {
    const k = s.realism || "(no rating)";
    m[k] = (m[k] || 0) + 1;
    return m;
  }, {});
  const sorted = [...subs].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="tactical-label">// PyroGuard admin</div>
            <h1 className="mt-1 font-display text-2xl uppercase tracking-widest2 text-ink">Command deck</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] tracking-widest2 uppercase">
            <a href="/demo" className="border border-border hover:border-fire text-muted hover:text-ink px-3 py-2 rounded transition-colors">
              ▶ Live demo
            </a>
            <a
              href="https://app.netlify.com/projects/pyroguard-demo/forms"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-border hover:border-fire text-muted hover:text-ink px-3 py-2 rounded transition-colors"
            >
              Netlify forms ↗
            </a>
          </div>
        </header>

        {/* Feedback inbox */}
        <section>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="tactical-label">// Feedback inbox {subs.length > 0 && `(${subs.length})`}</div>
            <button
              onClick={loadFeedback}
              className="text-fainter hover:text-ink text-[11px] tracking-widest2 uppercase border border-border2 rounded px-2.5 py-1.5 min-h-[36px] transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          {/* Realism tally */}
          {subs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(tally).map(([k, n]) => (
                <span
                  key={k}
                  className={`text-[11px] tracking-wide border rounded px-2 py-1 ${REALISM_TONE[k] ?? "text-muted border-border"}`}
                >
                  {k}: {n}
                </span>
              ))}
            </div>
          )}

          {loading && <p className="text-muted text-[13px] font-sans">Loading feedback…</p>}
          {!loading && err && (
            <div className="border border-warn/40 bg-warn/5 rounded p-3 text-[12.5px] leading-relaxed font-sans text-ink2">
              {err} — submissions still land in the Netlify dashboard.
            </div>
          )}
          {!loading && !err && subs.length === 0 && (
            <p className="text-muted text-[13px] font-sans">No feedback yet. It shows up here the moment a reviewer submits.</p>
          )}

          <div className="space-y-3">
            {sorted.map((s) => {
              const empty = !s.wrong && !s.using_today && !s.blocker;
              return (
                <div key={s.id} className="border border-border rounded bg-surface p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-[11px] tracking-wide border rounded px-2 py-0.5 ${REALISM_TONE[s.realism] ?? "text-muted border-border"}`}>
                      {s.realism || "(no rating)"}
                    </span>
                    <span className="text-fainter text-[11px] tracking-widest2 uppercase">
                      {s.from ? `${s.from} · ` : ""}
                      {fmtDate(s.created_at)}
                    </span>
                  </div>
                  {s.wrong && <p className="mt-2 text-ink2 text-[13.5px] leading-relaxed font-sans">{s.wrong}</p>}
                  {(s.using_today || s.blocker) && (
                    <div className="mt-2 space-y-1 text-[12.5px] leading-relaxed font-sans">
                      {s.using_today && (
                        <div>
                          <span className="text-fainter uppercase tracking-widest2 text-[10px]">Uses today:</span>{" "}
                          <span className="text-ink2">{s.using_today}</span>
                        </div>
                      )}
                      {s.blocker && (
                        <div>
                          <span className="text-fainter uppercase tracking-widest2 text-[10px]">Blocker:</span>{" "}
                          <span className="text-ink2">{s.blocker}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {empty && <p className="mt-2 text-fainter text-[12.5px] italic font-sans">Tapped a rating, left no notes.</p>}
                  {(s.name || s.cert || s.run) && (
                    <div className="mt-2 pt-2 border-t border-border2 text-fainter text-[11px] font-sans">
                      {s.name && <span className="text-muted">{s.name}</span>}
                      {s.cert && <span> · {s.cert}</span>}
                      {s.run && <span className="block mt-0.5 text-[10.5px]">run: {s.run}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Todos */}
        <section>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="tactical-label">// Todo {openCount > 0 && `(${openCount} open)`}</div>
            <div className="flex gap-1 text-[10px] tracking-widest2 uppercase">
              {(["open", "all", "done"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-1.5 rounded min-h-[32px] transition-colors ${filter === f ? "text-fire border border-fire/40" : "text-fainter hover:text-ink border border-transparent"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              placeholder="Add a task…"
              className="flex-1 bg-surface border border-border rounded px-3 py-2 text-[15px] text-ink placeholder:text-fainter outline-none focus:border-fire font-sans"
            />
            <button
              onClick={addTodo}
              disabled={!draft.trim()}
              className="bg-fire hover:bg-fire3 text-white px-4 rounded text-[12px] tracking-widest2 uppercase disabled:opacity-40 transition-colors"
            >
              Add
            </button>
          </div>

          <div className="space-y-1.5">
            {shownTodos.length === 0 && <p className="text-fainter text-[12.5px] font-sans">Nothing here.</p>}
            {shownTodos.map((t) => (
              <div key={t.id} className="flex items-start gap-3 border border-border rounded bg-surface px-3 py-2.5">
                <button
                  onClick={() => toggleTodo(t.id)}
                  aria-pressed={t.done}
                  className={`mt-[1px] w-5 h-5 rounded-[5px] border-2 shrink-0 flex items-center justify-center transition-colors ${t.done ? "bg-pass border-pass" : "border-muted"}`}
                >
                  {t.done && (
                    <svg width="12" height="10" viewBox="0 0 12 10" aria-hidden>
                      <polyline points="1,5 4.3,8.4 11,1.4" stroke="#0a0e14" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className={`flex-1 text-[13.5px] leading-snug font-sans ${t.done ? "text-fainter line-through" : "text-ink2"}`}>{t.text}</span>
                <button onClick={() => removeTodo(t.id)} className="text-fainter hover:text-fire text-[14px] leading-none shrink-0" aria-label="Delete task">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Status board */}
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="border border-fire/30 rounded bg-fire/5 p-3">
            <div className="tactical-label">// Waiting on Sam</div>
            <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed font-sans text-ink2 list-none">
              <li>▸ What a &ldquo;TAP account&rdquo; is + its own on-test call?</li>
              <li>▸ Restricted-site scope (jails) — whole site vs rooms?</li>
              <li>▸ Who authors the map (evac photo / CAD / nothing)?</li>
            </ul>
          </div>
          <div className="border border-border rounded bg-surface p-3">
            <div className="tactical-label">// Shipped in v2</div>
            <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed font-sans text-ink2 list-none">
              <li className="text-pass">✓ Fire-alarm inventory + battery rollup</li>
              <li className="text-pass">✓ Per-system ITC locations + critical notes</li>
              <li className="text-pass">✓ Multi-account monitoring block</li>
              <li className="text-pass">✓ Retail/occupancy spaces</li>
            </ul>
          </div>
        </section>

        <footer className="text-fainter text-[10.5px] tracking-widest2 uppercase pt-2 border-t border-border">
          Ungated · anyone with the link can view · todos live in this browser
        </footer>
      </div>
    </div>
  );
}
