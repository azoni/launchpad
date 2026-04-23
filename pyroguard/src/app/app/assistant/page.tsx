"use client";
import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/lib/store/workspace";
import { keywordResponse } from "@/lib/checklists";

type Msg = { role: "user" | "ai"; text: string };

const STARTERS = [
  "Sensitivity testing protocol",
  "Battery backup requirements",
  "Detector spacing question",
  "Generate report",
];

export default function AssistantPage() {
  const { workspaceId } = useWorkspace();
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "ai",
      text:
        "Good morning. I've optimized your route for today — 6 inspections across Seattle. UW Medical Center is flagged Critical and should be your first stop. Ask me about NFPA 72, inspection procedures, or say 'generate report'.",
    },
  ]);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || typing) return;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setTyping(true);

    // Try real Claude API; fall back to canned keyword response if anything fails.
    let responseText: string | null = null;
    try {
      const res = await fetch("/api/claude-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: /draft|deficien/i.test(t) ? "draft_deficiency" : "code_lookup",
          input: t,
          context: { workspaceId: workspaceId ?? undefined },
        }),
      });
      if (res.ok) {
        const j = await res.json();
        responseText =
          j.answer ?? j.structured?.description ?? null;
      }
    } catch {
      /* fall through */
    }

    // Always delay ~1.2s for the tactical feel, matching the artifact
    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        { role: "ai", text: responseText ?? keywordResponse(t) },
      ]);
      setTyping(false);
    }, 1200);
  }

  return (
    <div className="p-4 sm:p-6 animate-slide-in max-w-4xl mx-auto h-[calc(100dvh-106px)] flex flex-col">
      <div className="mb-4 shrink-0">
        <div className="font-display text-3xl sm:text-4xl tracking-widest3 text-white">
          AI ASSISTANT
        </div>
        <div className="text-[11px] tracking-widest2 text-faint uppercase">
          NFPA 72 Expert · Powered by Claude
        </div>
      </div>

      <div className="bg-surface border border-border rounded flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0">
          <span className="animate-soft-pulse text-pass text-[10px]">●</span>
          <span className="text-[10px] tracking-widest2 text-faint uppercase">
            PyroGuard AI // Online
          </span>
        </div>

        <div className="px-4 py-2.5 border-b border-border2 flex gap-2 flex-wrap shrink-0">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={typing}
              className="bg-bg border border-border text-muted text-[10px] tracking-wide px-2.5 py-1 rounded-sm hover:text-ink hover:border-fire transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div className="text-[9px] text-fainter tracking-widest2 mb-1">
                {m.role === "ai" ? "◉ PYROGUARD AI" : "◈ YOU"}
              </div>
              <div
                className={`max-w-[88%] px-4 py-3 text-[12px] leading-relaxed rounded animate-fade-up ${
                  m.role === "ai"
                    ? "bg-[#0d1a2a] border-l-[3px] border-fire text-ink2"
                    : "bg-[#141e10] border-l-[3px] border-pass text-[#d0e8d0]"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex flex-col items-start">
              <div className="text-[9px] text-fainter tracking-widest2 mb-1">◉ PYROGUARD AI</div>
              <div className="bg-[#0d1a2a] px-3 py-2.5 rounded border-l-[3px] border-fire flex gap-1">
                {[0, 200, 400].map((d) => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 rounded-full bg-fire animate-soft-pulse"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="p-3 border-t border-border flex gap-2 shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about NFPA 72, IFC code, inspection procedures..."
            className="flex-1 bg-bg border border-border text-ink text-[12px] px-3.5 py-2.5 rounded-sm outline-none focus:border-fire transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || typing}
            className="bg-fire hover:bg-fire3 text-white px-5 py-2.5 rounded text-[11px] tracking-widest2 uppercase transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
