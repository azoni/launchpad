import type { OpportunityStatus } from "@/lib/firebase/collections";

const PILL: Record<OpportunityStatus, string> = {
  ongoing:   "dy-pill dy-pill-accent",
  referral:  "dy-pill dy-pill-accent",
  applied:   "dy-pill dy-pill-neutral",
  screen:    "dy-pill dy-pill-neutral",
  onsite:    "dy-pill dy-pill-ink",
  offer:     "dy-pill dy-pill-positive",
  accepted:  "dy-pill dy-pill-positive",
  rejected:  "dy-pill dy-pill-negative",
  withdrew:  "dy-pill dy-pill-outline",
  ghosted:   "dy-pill dy-pill-outline",
};

const CLOSED: OpportunityStatus[] = ["accepted", "rejected", "withdrew", "ghosted"];

export function StatusPill({
  status,
  size = "md",
}: {
  status: OpportunityStatus;
  size?: "sm" | "md";
}) {
  const sizing = size === "sm" ? "text-[10.5px] px-1.5" : "";
  return <span className={`${PILL[status]} ${sizing}`}>{status}</span>;
}

export function statusIsClosed(status: OpportunityStatus) {
  return CLOSED.includes(status);
}
