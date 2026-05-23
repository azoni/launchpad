import type { OpportunityStatus } from "@/lib/firebase/collections";

const META: Record<
  OpportunityStatus,
  { label: string; bg: string; fg: string; closed?: boolean }
> = {
  ongoing:   { label: "ongoing",   bg: "#FFF7EE", fg: "#0E1B2C" },
  referral:  { label: "referral",  bg: "#6C5CE7", fg: "white" },
  applied:   { label: "applied",   bg: "#FAEBD8", fg: "#0E1B2C" },
  screen:    { label: "screen",    bg: "#FFD166", fg: "#0E1B2C" },
  onsite:    { label: "onsite",    bg: "#FF8A5C", fg: "white" },
  offer:     { label: "offer",     bg: "#3DDC97", fg: "#0E1B2C" },
  accepted:  { label: "accepted",  bg: "#0E1B2C", fg: "white", closed: true },
  rejected:  { label: "rejected",  bg: "#FAEBD8", fg: "#6B5B47", closed: true },
  withdrew:  { label: "withdrew",  bg: "#FAEBD8", fg: "#6B5B47", closed: true },
  ghosted:   { label: "ghosted",   bg: "#FAEBD8", fg: "#6B5B47", closed: true },
};

export function StatusPill({
  status,
  size = "md",
}: {
  status: OpportunityStatus;
  size?: "sm" | "md";
}) {
  const m = META[status];
  const pad = size === "sm" ? "px-2 py-0.5 text-[0.7rem]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 ${pad} rounded-full border-2 border-ink font-bold uppercase tracking-wide`}
      style={{ background: m.bg, color: m.fg }}
    >
      {m.label}
    </span>
  );
}

export function statusIsClosed(status: OpportunityStatus) {
  return !!META[status].closed;
}
