"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { ArrowLeft, ExternalLink, Eye, EyeOff, Plus, Trash2, X } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useAuthUser } from "@/lib/auth";
import {
  COLLECTIONS,
  OPPORTUNITY_STATUSES,
  type Contact,
  type EventDoc,
  type OpportunityDoc,
  type OpportunityPrivateDoc,
  type OpportunityStatus,
} from "@/lib/firebase/collections";
import { StatusPill } from "@/components/pipeline/StatusPill";
import { BriefCard } from "@/components/pipeline/BriefCard";

type PageProps = { params: Promise<{ id: string }> };

export default function OpportunityDetailPage(props: PageProps) {
  const { id } = use(props.params);
  const router = useRouter();
  const { user, loading } = useAuthUser();
  const [opp, setOpp] = useState<OpportunityDoc | null>(null);
  const [priv, setPriv] = useState<OpportunityPrivateDoc>({ notes: "", feedback: "", contacts: [], brief: null });
  const [linkedEvents, setLinkedEvents] = useState<EventDoc[]>([]);
  const [savingPatch, setSavingPatch] = useState<Record<string, boolean>>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to main doc.
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, COLLECTIONS.opportunities(user.uid), id);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setOpp({ id: snap.id, ...snap.data() } as OpportunityDoc);
      else setOpp(null);
    });
    return () => unsub();
  }, [user, id]);

  // Subscribe to private subdoc.
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, COLLECTIONS.opportunityPrivate(user.uid, id), "data");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data() as Partial<OpportunityPrivateDoc>;
        setPriv({
          notes: d.notes ?? "",
          feedback: d.feedback ?? "",
          contacts: d.contacts ?? [],
          brief: d.brief ?? null,
        });
      }
    });
    return () => unsub();
  }, [user, id]);

  // Subscribe to linked events.
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, COLLECTIONS.events(user.uid)),
      where("opportunityId", "==", id),
    );
    const unsub = onSnapshot(q, (snap) => {
      const evs = snap.docs.map((d) => d.data() as EventDoc);
      evs.sort((a, b) => a.start.localeCompare(b.start));
      setLinkedEvents(evs);
    });
    return () => unsub();
  }, [user, id]);

  const sortedEvents = useMemo(() => linkedEvents, [linkedEvents]);

  async function patch(update: Partial<OpportunityDoc & OpportunityPrivateDoc>, key: string) {
    if (!user) return;
    setSavingPatch((s) => ({ ...s, [key]: true }));
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/pipeline/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error(await res.text());
      setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingPatch((s) => {
        const next = { ...s };
        delete next[key];
        return next;
      });
    }
  }

  async function briefGenerate(contextHint: string) {
    if (!user) return;
    const idToken = await user.getIdToken();
    const res = await fetch(`/api/pipeline/${id}/brief`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ contextHint: contextHint || undefined }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function briefEdit(content: string) {
    if (!user) return;
    const idToken = await user.getIdToken();
    const res = await fetch(`/api/pipeline/${id}/brief`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function briefDelete() {
    if (!user) return;
    const idToken = await user.getIdToken();
    const res = await fetch(`/api/pipeline/${id}/brief`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function remove() {
    if (!user) return;
    if (!confirm("Delete this pipeline item? Linked events will be unlinked, not deleted.")) return;
    setDeleting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/pipeline/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/app/pipeline");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  }

  if (loading) return <div className="chunky p-8">Loading…</div>;
  if (!user)
    return (
      <div className="chunky p-6">
        Please <Link href="/app" className="underline font-semibold">sign in</Link>.
      </div>
    );
  if (opp === null)
    return (
      <div className="chunky p-8 text-center">
        <p className="font-heading text-2xl mb-2">Not found.</p>
        <Link href="/app/pipeline" className="btn-chunky btn-ghost mt-2">
          ← Back to pipeline
        </Link>
      </div>
    );

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/app/pipeline"
        className="text-sm text-muted-foreground hover:text-ink inline-flex items-center gap-1"
      >
        <ArrowLeft size={14} /> all pipeline items
      </Link>

      {/* Header */}
      <header className="chunky p-4 md:p-6 space-y-3">
        <div className="space-y-3">
          <div className="min-w-0">
            <EditableHeading
              value={opp.company}
              placeholder="Company"
              size="lg"
              onSave={(v) => patch({ company: v }, "company")}
            />
            <EditableHeading
              value={opp.role}
              placeholder="Role"
              size="sm"
              onSave={(v) => patch({ role: v }, "role")}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={opp.status}
              onChange={(e) => patch({ status: e.target.value as OpportunityStatus }, "status")}
              className="border-2 border-ink rounded-full px-3 py-2 bg-card font-semibold uppercase text-xs min-h-[36px]"
            >
              {OPPORTUNITY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={() => patch({ isPublic: !opp.isPublic }, "isPublic")}
              className={`min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-ink text-xs font-bold ${
                opp.isPublic ? "bg-sun text-ink" : "bg-card text-muted-foreground"
              }`}
              title={
                opp.isPublic
                  ? "Hide from public profile (also hides linked events)"
                  : "Show on public profile (linked events become public too)"
              }
            >
              {opp.isPublic ? <Eye size={13} /> : <EyeOff size={13} />}
              {opp.isPublic ? "public" : "private"}
            </button>
            {opp.isPublic && (
              <span className="text-[0.7rem] text-muted-foreground italic">
                linked events follow this toggle
              </span>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          <FieldLabel label="Source">
            <InlineInput
              value={opp.source ?? ""}
              placeholder="Direct referral from..."
              onSave={(v) => patch({ source: v }, "source")}
            />
          </FieldLabel>
          <FieldLabel label="Posting link">
            <div className="flex items-center gap-2">
              <InlineInput
                value={opp.link ?? ""}
                placeholder="https://..."
                onSave={(v) => patch({ link: v }, "link")}
              />
              {opp.link && (
                <a
                  href={opp.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-ink"
                  title="Open posting"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </FieldLabel>
          <FieldLabel label="Next step (shown publicly)">
            <InlineInput
              value={opp.nextStep ?? ""}
              placeholder="phone screen Thu 3pm"
              onSave={(v) => patch({ nextStep: v }, "nextStep")}
            />
          </FieldLabel>
          <FieldLabel label="Next-step date">
            <InlineInput
              value={opp.nextStepBy ?? ""}
              placeholder="2026-05-29 · Thu 3pm"
              onSave={(v) => patch({ nextStepBy: v }, "nextStepBy")}
            />
          </FieldLabel>
        </div>

        {savedAt && (
          <p className="text-xs text-muted-foreground">
            Saved {new Date(savedAt).toLocaleTimeString()}.
          </p>
        )}
        {error && <p className="text-xs text-red-700 font-semibold">{error}</p>}
      </header>

      <PrivateBanner />

      {/* Notes + Feedback */}
      <BriefCard
        brief={priv.brief ?? null}
        onGenerate={briefGenerate}
        onEdit={briefEdit}
        onDelete={briefDelete}
      />

      <section className="grid md:grid-cols-2 gap-4">
        <div className="chunky p-4">
          <h2 className="font-heading text-xl font-bold mb-2">Notes</h2>
          <NotesEditor
            initial={priv.notes}
            placeholder={`Process so far, blockers, study plan, take-home brief, anything…`}
            onSave={(v) => patch({ notes: v }, "notes")}
            rows={10}
          />
        </div>
        <div className="chunky p-4">
          <h2 className="font-heading text-xl font-bold mb-2">Feedback / reflection</h2>
          <NotesEditor
            initial={priv.feedback}
            placeholder={`How rounds went, recruiter's feedback, what to try differently…`}
            onSave={(v) => patch({ feedback: v }, "feedback")}
            rows={10}
          />
        </div>
      </section>

      {/* Contacts */}
      <section className="chunky p-4">
        <h2 className="font-heading text-xl font-bold mb-2">Contacts</h2>
        <ContactsEditor
          initial={priv.contacts}
          onSave={(v) => patch({ contacts: v }, "contacts")}
        />
      </section>

      {/* Linked events */}
      <section className="chunky p-4">
        <h2 className="font-heading text-xl font-bold mb-2">Linked calendar events</h2>
        {sortedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No events linked yet. After your next sync, any calendar event whose title contains
            &ldquo;{opp.company}&rdquo; will auto-link here.
          </p>
        ) : (
          <ul className="space-y-2">
            {sortedEvents.map((ev) => (
              <li key={ev.googleEventId} className="text-sm border-2 border-ink rounded-xl p-3 bg-card">
                <p className="font-semibold">{ev.summary}</p>
                <p className="text-muted-foreground text-xs">
                  {new Date(ev.start).toLocaleString()}
                  {ev.location ? ` · ${ev.location}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Danger */}
      <section className="pt-2">
        <button
          onClick={remove}
          disabled={deleting}
          className="text-sm text-red-700 hover:underline inline-flex items-center gap-1"
        >
          <Trash2 size={14} /> {deleting ? "Deleting…" : "Delete this item"}
        </button>
      </section>
    </div>
  );
}

function PrivateBanner() {
  return (
    <div className="text-xs text-muted-foreground inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-dashed border-muted-foreground/40 bg-card">
      <EyeOff size={12} /> notes, feedback, and contacts are always private — never shown on your
      public profile, even if this item is public.
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block font-semibold mb-1">{label}</span>
      {children}
    </label>
  );
}

function EditableHeading({
  value,
  placeholder,
  size,
  onSave,
}: {
  value: string;
  placeholder: string;
  size: "sm" | "lg";
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  // Sync prop changes (e.g. snapshot refresh).
  if (value !== local && document.activeElement?.tagName !== "INPUT") {
    setLocal(value);
  }
  const cls =
    size === "lg"
      ? "font-heading text-3xl md:text-4xl font-bold w-full bg-transparent border-0 outline-none focus:bg-card focus:px-2 focus:rounded-lg"
      : "text-muted-foreground text-lg w-full bg-transparent border-0 outline-none focus:bg-card focus:px-2 focus:rounded-lg";
  return (
    <input
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value && local.trim().length > 0) onSave(local.trim());
      }}
      className={cls}
    />
  );
}

function InlineInput({
  value,
  placeholder,
  onSave,
}: {
  value: string;
  placeholder: string;
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  if (value !== local && document.activeElement?.tagName !== "INPUT") {
    setLocal(value);
  }
  return (
    <input
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onSave(local);
      }}
      className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card"
    />
  );
}

function NotesEditor({
  initial,
  placeholder,
  rows,
  onSave,
}: {
  initial: string;
  placeholder: string;
  rows: number;
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(initial);
  const [savingHint, setSavingHint] = useState(false);

  if (initial !== local && document.activeElement?.tagName !== "TEXTAREA") {
    setLocal(initial);
  }

  // Debounced save: flush 1.2s after typing stops.
  useEffect(() => {
    if (local === initial) return;
    setSavingHint(true);
    const t = setTimeout(() => {
      onSave(local);
      setSavingHint(false);
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <>
      <textarea
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        rows={rows}
        className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card font-mono text-sm"
      />
      <p className="text-[0.7rem] text-muted-foreground mt-1">
        {savingHint ? "saving…" : local === initial ? "saved" : ""}
      </p>
    </>
  );
}

function ContactsEditor({
  initial,
  onSave,
}: {
  initial: Contact[];
  onSave: (v: Contact[]) => void;
}) {
  const [list, setList] = useState<Contact[]>(initial);
  if (initial.length !== list.length) {
    // Trust snapshot when length changes (add/remove server-side)
    setList(initial);
  }

  function update(next: Contact[]) {
    setList(next);
    onSave(next);
  }

  return (
    <div className="space-y-2">
      {list.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Recruiters, hiring managers, referrers — anyone you want to remember.
        </p>
      )}
      {list.map((c, i) => (
        <div key={i} className="grid sm:grid-cols-[1fr_1fr_2fr_auto] gap-2 items-start">
          <input
            value={c.name}
            onChange={(e) => {
              const next = [...list];
              next[i] = { ...c, name: e.target.value };
              setList(next);
            }}
            onBlur={() => onSave(list)}
            placeholder="Name"
            className="border-2 border-ink rounded-xl px-3 py-2 bg-card"
          />
          <input
            value={c.role}
            onChange={(e) => {
              const next = [...list];
              next[i] = { ...c, role: e.target.value };
              setList(next);
            }}
            onBlur={() => onSave(list)}
            placeholder="Role (recruiter, HM, ...)"
            className="border-2 border-ink rounded-xl px-3 py-2 bg-card"
          />
          <input
            value={c.note}
            onChange={(e) => {
              const next = [...list];
              next[i] = { ...c, note: e.target.value };
              setList(next);
            }}
            onBlur={() => onSave(list)}
            placeholder="Note (email, last touch, etc)"
            className="border-2 border-ink rounded-xl px-3 py-2 bg-card"
          />
          <button
            onClick={() => update(list.filter((_, j) => j !== i))}
            className="text-muted-foreground hover:text-red-700 p-2"
            aria-label="Remove contact"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={() => update([...list, { name: "", role: "", note: "" }])}
        className="btn-chunky btn-ghost text-sm"
      >
        <Plus size={14} /> Add contact
      </button>
    </div>
  );
}
