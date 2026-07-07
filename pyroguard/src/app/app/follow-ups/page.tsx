"use client";
import Link from "next/link";
import { useState } from "react";
import { Mail, Send, Copy, Check, ChevronRight, Inbox } from "lucide-react";
import { FOLLOW_UP_DRAFTS, type FollowUpDraft } from "@/lib/deficiencies";

export default function FollowUpsPage() {
  const [items, setItems] = useState<FollowUpDraft[]>(FOLLOW_UP_DRAFTS);
  const [selectedId, setSelectedId] = useState<string>(FOLLOW_UP_DRAFTS[0]?.id ?? "");
  const [editing, setEditing] = useState<string>(FOLLOW_UP_DRAFTS[0]?.body ?? "");
  const [copied, setCopied] = useState(false);

  const selected = items.find((i) => i.id === selectedId);

  function pick(id: string) {
    setSelectedId(id);
    setEditing(items.find((i) => i.id === id)?.body ?? "");
  }
  function approve() {
    setItems((prev) =>
      prev.map((i) => (i.id === selectedId ? { ...i, status: "approved", body: editing } : i))
    );
  }
  function copyBody() {
    navigator.clipboard.writeText(editing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto animate-slide-in">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="eyebrow mb-2">Workflow</div>
          <h1 className="font-display text-3xl text-ink font-semibold tracking-tight">Follow-ups</h1>
          <p className="text-[13.5px] text-muted mt-1.5">
            Drafted customer outreach. Edit, approve, then send from your normal email.
          </p>
        </div>
        <div className="text-[12px] text-muted">
          <span className="text-ink font-medium">
            {items.filter((i) => i.status === "draft").length}
          </span>{" "}
          drafts &middot;{" "}
          <span className="text-pass font-medium">
            {items.filter((i) => i.status === "approved").length}
          </span>{" "}
          approved
        </div>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-5">
        {/* List */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden h-fit">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Inbox className="h-3.5 w-3.5 text-muted" />
            <span className="text-[13px] font-medium text-ink">Inbox</span>
          </div>
          <div className="divide-y divide-border max-h-[640px] overflow-y-auto">
            {items.map((f) => {
              const active = f.id === selectedId;
              return (
                <button
                  key={f.id}
                  onClick={() => pick(f.id)}
                  className={`w-full text-left px-4 py-3.5 transition-colors ${
                    active ? "bg-elevated" : "hover:bg-elevated/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[12.5px] font-medium text-ink truncate">
                      {f.customer}
                    </span>
                    <StatusPill status={f.status} />
                  </div>
                  <div className="text-[12px] text-muted truncate">{f.subject}</div>
                  <div className="text-[10.5px] text-faint mt-1.5 flex items-center gap-2">
                    <span>{f.generatedAt}</span>
                    <span>&middot;</span>
                    <span className="capitalize">{f.kind.replace("_", " ")}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {selected ? (
            <>
              <div className="px-5 py-4 border-b border-border flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-ink">{selected.subject}</div>
                  <div className="text-[12px] text-muted mt-1 flex flex-wrap items-center gap-2">
                    <span>To: {selected.customerEmail}</span>
                    <span>&middot;</span>
                    <span>{selected.customer}</span>
                    {selected.deficiencyId && (
                      <>
                        <span>&middot;</span>
                        <Link
                          href={`/app/deficiencies/${selected.deficiencyId}`}
                          className="text-fire hover:text-fire2 inline-flex items-center gap-0.5"
                        >
                          {selected.deficiencyId}
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={copyBody}
                    className="border border-border hover:border-muted text-ink px-3 py-2 rounded-md text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-pass" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={approve}
                    disabled={selected.status === "approved"}
                    className="bg-fire hover:bg-fire2 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {selected.status === "approved" ? "Approved" : "Approve"}
                  </button>
                </div>
              </div>
              <div className="p-5">
                <textarea
                  value={editing}
                  onChange={(e) => setEditing(e.target.value)}
                  rows={20}
                  className="w-full bg-bg border border-border rounded-md p-4 text-[13.5px] text-ink2 leading-relaxed font-sans focus:border-fire/50 focus:outline-none"
                />
                <div className="mt-3 text-[11.5px] text-faint flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  Demo: approval marks the draft locally. In production this would queue the
                  email for send via your provider.
                </div>
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-muted text-[13px]">
              Select a draft to review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: FollowUpDraft["status"] }) {
  const cfg = {
    draft: { label: "Draft", bg: "rgba(245,158,11,0.12)", text: "#fbbf24" },
    approved: { label: "Approved", bg: "rgba(16,185,129,0.12)", text: "#34d399" },
    sent: { label: "Sent", bg: "rgba(107,114,128,0.15)", text: "#9ca3af" },
  }[status];
  return (
    <span
      className="px-2 py-0.5 rounded text-[10px] tracking-wide font-medium shrink-0"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
}
