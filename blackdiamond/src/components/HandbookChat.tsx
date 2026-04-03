"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function HandbookChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/handbook/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-6),
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, something went wrong. Try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Couldn't reach the server. Check your connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-teal text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95"
        aria-label={open ? "Close chat" : "Ask a question"}
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed inset-0 z-50 bg-card flex flex-col sm:inset-auto sm:bottom-24 sm:right-6 sm:w-96 sm:max-h-[70vh] sm:rounded-xl sm:border sm:border-border sm:shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-teal" />
            </div>
            <div className="flex-1">
              <p className="font-heading text-sm uppercase tracking-wide">
                Field Assistant
              </p>
              <p className="text-xs text-muted-foreground">
                Ask about procedures, safety, or equipment
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="sm:hidden w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]"
          >
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Ask me anything about our services, safety procedures, or
                  equipment.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {[
                    "What PSI for pavers?",
                    "How to mix roof wash?",
                    "Cedar deck safe?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        inputRef.current?.focus();
                      }}
                      className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-teal hover:text-teal transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-teal text-white rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-4 py-3 rounded-bl-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 py-3 pb-[env(safe-area-inset-bottom,12px)] sm:pb-3 border-t border-border bg-card shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal/30"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-lg bg-teal text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
