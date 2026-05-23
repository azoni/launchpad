"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { OPPORTUNITY_STATUSES, type OpportunityStatus } from "@/lib/firebase/collections";
import { useAuthUser } from "@/lib/auth";

export function QuickAdd({ onCreated }: { onCreated?: (id: string) => void }) {
  const { user } = useAuthUser();
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<OpportunityStatus>("referral");
  const [source, setSource] = useState("");
  const [link, setLink] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setCompany("");
    setRole("");
    setStatus("referral");
    setSource("");
    setLink("");
    setNextStep("");
    setIsPublic(false);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setPending(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ company, role, status, source, link, nextStep, isPublic }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      reset();
      setOpen(false);
      onCreated?.(data.opportunity.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-chunky">
        <Plus size={16} /> Add to pipeline
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="chunky p-5 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Company *">
          <input
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="GEICO"
            className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card"
          />
        </Field>
        <Field label="Role *">
          <input
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Staff Engineer, AI Platform"
            className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card"
          />
        </Field>
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OpportunityStatus)}
            className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card"
          >
            {OPPORTUNITY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Source">
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Direct referral from Vinh"
            className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card"
          />
        </Field>
        <Field label="Posting link">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card"
          />
        </Field>
        <Field label="Next step">
          <input
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
            placeholder="phone screen Thu 3pm"
            className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card"
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        Show on my public profile (company, role, status, next step — never the notes)
      </label>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="btn-chunky">
          {pending ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="btn-chunky btn-ghost"
        >
          Cancel
        </button>
        {error && <span className="text-sm font-semibold text-red-700">{error}</span>}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block font-semibold mb-1">{label}</span>
      {children}
    </label>
  );
}
