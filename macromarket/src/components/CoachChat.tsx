"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Best high-protein snacks for backpacking",
  "Office-friendly protein snacks (no fridge)",
  "Cheapest post-workout protein",
  "High-protein road-trip snacks",
  "Budget protein for bulking",
  "Best vegan protein snacks",
];

const linkClass =
  "font-semibold text-primary underline underline-offset-2";

/** Lightweight markdown renderer: **bold**, [text](url), and bare URLs. */
function Rich({ text }: { text: string }) {
  const TOKEN =
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(\*\*)([^*]+)\*\*|(https?:\/\/[^\s)]+)/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] && m[2]) {
      nodes.push(
        <a key={key++} href={m[2]} target="_blank" rel="sponsored nofollow noopener" className={linkClass}>
          {m[1]}
        </a>,
      );
    } else if (m[4]) {
      nodes.push(<strong key={key++}>{m[4]}</strong>);
    } else if (m[5]) {
      nodes.push(
        <a key={key++} href={m[5]} target="_blank" rel="sponsored nofollow noopener" className={linkClass}>
          Buy on Amazon
        </a>,
      );
    }
    last = TOKEN.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

export function CoachChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    setStatus(null);

    const convo: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...convo, { role: "assistant", content: "" }]);

    const setAssistant = (fn: (prev: string) => string) =>
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") copy[copy.length - 1] = { ...last, content: fn(last.content) };
        return copy;
      });

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: convo }),
      });
      if (!res.ok) {
        let msg = "The coach is unavailable right now. Please try again.";
        try {
          const j = await res.json();
          if (j?.error) msg = j.error as string;
        } catch {
          /* keep default */
        }
        setAssistant((c) => c || msg);
        return;
      }
      if (!res.body) throw new Error("no body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let evt: { type: string; text?: string };
          try {
            evt = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (evt.type === "content") {
            setStatus(null);
            setAssistant((c) => c + (evt.text ?? ""));
          } else if (evt.type === "tool") {
            setStatus(evt.text ?? "Thinking…");
          } else if (evt.type === "error") {
            setAssistant((c) => c || evt.text || "Something went wrong.");
          }
        }
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }
    } catch {
      setAssistant((c) => c || "The coach is unavailable right now. Please try again.");
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  // Auto-send a themed question when arriving via /coach?q=…
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) send(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col">
      <div
        ref={scrollRef}
        className="min-h-[340px] max-h-[60vh] overflow-y-auto rounded-xl border border-line bg-white p-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
            <p className="max-w-sm text-muted-foreground">
              Ask me anything about hitting your protein goal cheaply. I&apos;ll
              recommend the best-value foods from the MacroMarket catalog.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-line bg-secondary px-3 py-1.5 text-xs font-semibold text-ink hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm border border-line bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                      : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-line bg-secondary px-4 py-2 text-sm text-ink"
                  }
                >
                  {m.role === "assistant" ? (
                    m.content ? (
                      <Rich text={m.content} />
                    ) : (
                      <span className="text-muted-foreground">
                        {status ?? "Thinking…"}
                      </span>
                    )
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the protein coach…"
          className="h-11 flex-1 rounded-md border border-line bg-white px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="btn-tag bg-primary px-4 text-primary-foreground disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="size-4" />
        </button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        General guidance only, not medical advice. Recommendations link to Amazon;
        we may earn a commission.
      </p>
    </div>
  );
}
