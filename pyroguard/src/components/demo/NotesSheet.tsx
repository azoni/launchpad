"use client";
import { useState } from "react";
import type { FieldNote } from "@/lib/demo/useFieldNotes";
import { haptic } from "@/lib/haptics";

/** Bottom-sheet field-notes log — jot anything, it persists, it comes back at the debrief. */
export function NotesSheet({
  open,
  onClose,
  contextId,
  notes,
  onAdd,
  onRemove,
}: {
  open: boolean;
  onClose: () => void;
  contextId?: string;
  notes: FieldNote[];
  onAdd: (text: string, tag?: string) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");
  if (!open) return null;

  const submit = () => {
    if (!draft.trim()) return;
    haptic();
    onAdd(draft, contextId);
    setDraft("");
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-label="Field notes">
      <button className="absolute inset-0 bg-black/60" aria-label="Close notes" onClick={onClose} />
      <div className="relative bg-surface border-t border-border rounded-t-lg max-h-[78%] flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border2">
          <span className="tactical-label">// Field notes ({notes.length})</span>
          <button onClick={onClose} className="text-muted hover:text-ink text-[13px] tracking-wide">Done</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {notes.length === 0 && (
            <p className="text-fainter text-[12.5px] text-center py-6 leading-relaxed font-sans">
              No notes yet. Jot anything — it survives reload and comes back at the debrief.
            </p>
          )}
          {notes.map((n) => (
            <div key={n.id} className="border border-border2 rounded bg-[#0a0e14] p-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-ink2 text-[13px] leading-relaxed font-sans">{n.text}</p>
                <button
                  onClick={() => onRemove(n.id)}
                  className="text-fainter hover:text-fire text-[14px] leading-none shrink-0"
                  aria-label="Delete note"
                >
                  ✕
                </button>
              </div>
              {n.tag && <span className="mt-1.5 inline-block text-fire text-[10px] tracking-widest2 uppercase">· {n.tag}</span>}
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-border2 flex gap-2 safe-bottom">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder={contextId ? `Note on ${contextId}…` : "Add a note…"}
            className="flex-1 bg-bg border border-border rounded px-3 py-2 text-[13px] text-ink placeholder:text-fainter outline-none focus:border-fire font-sans"
            aria-label="New field note"
          />
          <button
            onClick={submit}
            disabled={!draft.trim()}
            className="bg-fire text-white px-4 rounded text-[12px] tracking-widest2 uppercase disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
