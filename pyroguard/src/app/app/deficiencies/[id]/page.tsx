"use client";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Mail, FileText, CheckCircle2, Calendar, Camera, Copy, Check } from "lucide-react";
import {
  DEFICIENCIES, STATUS_LABEL, STATUS_COLOR, SEVERITY_COLOR,
  type DeficiencyStatus,
} from "@/lib/deficiencies";

export default function DeficiencyDetail() {
  const params = useParams<{ id: string }>();
  const def = DEFICIENCIES.find((d) => d.id === params.id);
  const [status, setStatus] = useState<DeficiencyStatus | null>(def?.status ?? null);
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!def) return notFound();
  const sc = STATUS_COLOR[status ?? def.status];
  const sev = SEVERITY_COLOR[def.severity];

  function generateEmail() {
    if (!def) return;
    setGenerating(true);
    setTimeout(() => {
      setEmailDraft(
        `Hi ${def.customer} team,\n\n` +
        `During our ${def.inspectionDate} inspection at ${def.property}, our technician noted the following:\n\n` +
        `  ${def.description}\n\n` +
        `Recommended action:\n  ${def.recommendedAction}\n\n` +
        (def.estimatedValue > 0
          ? `We have a quote ready for your review at $${def.estimatedValue.toLocaleString()}. Reply to schedule and we'll get this on the books.\n\n`
          : `Reply to confirm and we'll get this on the schedule.\n\n`) +
        `Best,\nMaya — PyroGuard Service`
      );
      setGenerating(false);
    }, 600);
  }

  function copyEmail() {
    if (!emailDraft) return;
    navigator.clipboard.writeText(emailDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="px-5 sm:px-8 py-8 max-w-5xl mx-auto animate-slide-in">
      <Link
        href="/app/deficiencies"
        className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-ink mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to deficiencies
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-[12px] text-faint">{def.id}</span>
            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sev.dot }} />
              {sev.label}
            </span>
          </div>
          <h1 className="font-display text-3xl text-ink font-semibold tracking-tight">
            {def.customer}
          </h1>
          <p className="text-[14px] text-muted mt-1">{def.property}</p>
        </div>
        <span
          className="inline-flex px-3 py-1.5 rounded-md text-[11px] tracking-wide font-medium"
          style={{ background: sc.bg, color: sc.text, boxShadow: `inset 0 0 0 1px ${sc.ring}` }}
        >
          {STATUS_LABEL[status ?? def.status]}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* Finding */}
          <Card title="Finding">
            <Field label="Description">{def.description}</Field>
            <Field label="Recommended action">{def.recommendedAction}</Field>
            <Field label="Technician notes">{def.technicianNotes}</Field>
          </Card>

          {/* Photos placeholder */}
          <Card title="Evidence">
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-md bg-bg/50 border border-dashed border-border flex items-center justify-center text-faint"
                >
                  <Camera className="h-4 w-4" />
                </div>
              ))}
            </div>
            <p className="text-[11.5px] text-faint mt-3">
              Photo placeholders &mdash; in a live deployment these would link to the inspection's
              uploaded evidence.
            </p>
          </Card>

          {/* Email draft */}
          <Card
            title="Customer follow-up"
            action={
              !emailDraft ? (
                <button
                  onClick={generateEmail}
                  disabled={generating}
                  className="bg-fire hover:bg-fire2 disabled:opacity-60 text-white px-4 py-2 rounded-md text-[12px] font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {generating ? "Drafting..." : "Generate email"}
                </button>
              ) : (
                <button
                  onClick={copyEmail}
                  className="border border-border hover:border-muted text-ink px-4 py-2 rounded-md text-[12px] font-medium inline-flex items-center gap-2 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-pass" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              )
            }
          >
            {!emailDraft ? (
              <p className="text-[13px] text-muted leading-relaxed">
                Draft a customer follow-up referencing this finding. The draft is editable
                and never sends without your approval.
              </p>
            ) : (
              <textarea
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                rows={14}
                className="w-full bg-bg border border-border rounded-md p-3 text-[13px] text-ink2 leading-relaxed font-sans focus:border-fire/50 focus:outline-none"
              />
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card title="Details">
            <DetailRow label="System type">{def.systemType}</DetailRow>
            <DetailRow label="Inspection date">{def.inspectionDate}</DetailRow>
            <DetailRow label="Technician">{def.techName}</DetailRow>
            <DetailRow label="Assigned to">{def.assignedTo}</DetailRow>
            <DetailRow label="Next follow-up">{def.nextFollowUp || "—"}</DetailRow>
            <DetailRow label="Estimated value">
              {def.estimatedValue > 0 ? (
                <span className="text-pass">${def.estimatedValue.toLocaleString()}</span>
              ) : (
                "—"
              )}
            </DetailRow>
          </Card>

          <Card title="Update status">
            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                icon={FileText}
                label="Mark quoted"
                onClick={() => setStatus("quote_sent")}
              />
              <ActionButton
                icon={Calendar}
                label="Schedule"
                onClick={() => setStatus("scheduled")}
              />
              <ActionButton
                icon={CheckCircle2}
                label="Mark repaired"
                onClick={() => setStatus("repaired")}
              />
              <ActionButton
                icon={CheckCircle2}
                label="Resolved"
                onClick={() => setStatus("resolved")}
                accent
              />
            </div>
            {status !== def.status && status && (
              <div className="mt-3 text-[11.5px] text-pass flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                Status updated to {STATUS_LABEL[status]} (demo only)
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="text-[13px] font-medium text-ink">{title}</div>
        {action}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow mb-1.5">{label}</div>
      <div className="text-[13.5px] text-ink2 leading-relaxed">{children}</div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-[12.5px] py-1.5 border-b border-border last:border-0">
      <span className="text-faint">{label}</span>
      <span className="text-ink2 font-medium">{children}</span>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2.5 rounded-md text-[12px] font-medium inline-flex items-center justify-center gap-2 transition-colors ${
        accent
          ? "bg-fire/10 hover:bg-fire/15 text-fire border border-fire/20"
          : "bg-bg hover:bg-elevated text-ink2 border border-border hover:border-muted"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
