"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Edit3, RefreshCw, Sparkles, Trash2, X } from "lucide-react";
import type { Brief } from "@/lib/firebase/collections";

type Status = "idle" | "generating" | "saving" | "deleting";

export function BriefCard({
  brief,
  onGenerate,
  onEdit,
  onDelete,
}: {
  brief: Brief | null;
  onGenerate: (contextHint: string) => Promise<void>;
  onEdit: (content: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [contextHint, setContextHint] = useState("");
  const [showRegen, setShowRegen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState("");

  async function handleGenerate() {
    setStatus("generating");
    setError(null);
    try {
      await onGenerate(contextHint.trim());
      setContextHint("");
      setShowRegen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setStatus("idle");
    }
  }

  async function handleSaveEdit() {
    setStatus("saving");
    setError(null);
    try {
      await onEdit(draft);
      setEditMode(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setStatus("idle");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this brief?")) return;
    setStatus("deleting");
    try {
      await onDelete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setStatus("idle");
    }
  }

  // Empty state — no brief yet.
  if (!brief) {
    return (
      <div className="chunky chunky-grape p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} />
          <h2 className="font-heading text-xl font-bold">Prep brief</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate a tailored prep brief with Claude — company snapshot, likely interview topics,
          prep checklist, smart questions. Lives separately from your hand-written notes.
        </p>
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold">
            Add context (optional)
          </summary>
          <textarea
            value={contextHint}
            onChange={(e) => setContextHint(e.target.value)}
            rows={3}
            placeholder={`Example: "This is the insurance branch, not rental car." "Focus on platform infra over product."`}
            className="mt-2 w-full border-2 border-ink rounded-xl px-3 py-2 bg-card text-sm"
          />
        </details>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGenerate}
            disabled={status === "generating"}
            className="btn-chunky"
          >
            <Sparkles size={14} />
            {status === "generating" ? "Generating…" : "Generate prep brief"}
          </button>
          {error && <span className="text-sm font-semibold text-red-700">{error}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="chunky p-5 space-y-3">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-grape" />
          <h2 className="font-heading text-xl font-bold">Prep brief</h2>
          <span className="text-xs text-muted-foreground font-mono">
            {new Date(brief.generatedAt).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {!editMode && (
            <>
              <button
                onClick={() => {
                  setShowRegen((s) => !s);
                  if (!showRegen) setContextHint(brief.contextHint ?? "");
                }}
                className="btn-chunky btn-ghost text-xs py-1.5 px-2.5"
                title="Regenerate with optional extra context"
              >
                <RefreshCw size={12} />
                {showRegen ? "Cancel" : "Regenerate"}
              </button>
              <button
                onClick={() => {
                  setDraft(brief.content);
                  setEditMode(true);
                  setShowRegen(false);
                }}
                className="btn-chunky btn-ghost text-xs py-1.5 px-2.5"
                title="Edit brief content manually"
              >
                <Edit3 size={12} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={status === "deleting"}
                className="text-xs text-red-700 hover:underline px-2 py-1.5 inline-flex items-center gap-1"
                title="Delete brief"
              >
                <Trash2 size={12} />
                {status === "deleting" ? "…" : ""}
              </button>
            </>
          )}
          {editMode && (
            <>
              <button
                onClick={handleSaveEdit}
                disabled={status === "saving"}
                className="btn-chunky text-xs py-1.5 px-2.5"
              >
                {status === "saving" ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="btn-chunky btn-ghost text-xs py-1.5 px-2.5"
              >
                <X size={12} />
                Cancel
              </button>
            </>
          )}
        </div>
      </header>

      {showRegen && !editMode && (
        <div className="border-2 border-dashed border-grape/40 rounded-xl p-3 bg-grape/5 space-y-2">
          <label className="block text-sm font-semibold">Extra context for regeneration</label>
          <p className="text-xs text-muted-foreground">
            Anything Claude got wrong, missing, or context to emphasize. Trust this over the
            company/role fields if they conflict.
          </p>
          <textarea
            value={contextHint}
            onChange={(e) => setContextHint(e.target.value)}
            rows={3}
            placeholder={`Example: "Wrong company description — they actually focus on B2B logistics, not consumer." "This is for the AI Platform team, not the Search team."`}
            className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={status === "generating"}
              className="btn-chunky text-sm py-2 px-3"
            >
              <Sparkles size={13} />
              {status === "generating" ? "Generating…" : "Regenerate"}
            </button>
            {error && <span className="text-sm font-semibold text-red-700">{error}</span>}
          </div>
        </div>
      )}

      {editMode ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={18}
          className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card text-sm font-mono"
        />
      ) : (
        <div className="prose prose-sm max-w-none text-ink prose-headings:font-heading prose-headings:text-ink prose-h3:text-lg prose-h3:font-bold prose-h3:mt-4 prose-h3:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-ink">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {brief.content}
          </ReactMarkdown>
        </div>
      )}
      {brief.contextHint && !editMode && (
        <p className="text-[0.7rem] text-muted-foreground italic">
          Generated with context: &ldquo;{brief.contextHint}&rdquo;
        </p>
      )}
    </div>
  );
}
