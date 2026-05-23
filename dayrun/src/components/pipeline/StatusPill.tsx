import type { OpportunityStatus } from "@/lib/firebase/collections";

const PILL: Record<OpportunityStatus, string> = {
  // In-progress states: all neutral. Brick (accent) was reading too close to the
  // negative red — kept the accent as a brand color (wordmark period, buttons),
  // but separated it from status signals.
  ongoing:   "dy-pill dy-pill-neutral",
  referral:  "dy-pill dy-pill-neutral",
  applied:   "dy-pill dy-pill-neutral",
  screen:    "dy-pill dy-pill-neutral",
  // Onsite stays prominent (you're at the deepest stage).
  onsite:    "dy-pill dy-pill-ink",
  // Wins
  offer:     "dy-pill dy-pill-positive",
  accepted:  "dy-pill dy-pill-positive",
  // The only red.
  rejected:  "dy-pill dy-pill-negative",
  // Closed-but-not-failed: faded outline.
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
