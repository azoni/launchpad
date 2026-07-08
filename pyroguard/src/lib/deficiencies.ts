export type DeficiencyStatus =
  | "new"
  | "needs_quote"
  | "quote_sent"
  | "approved"
  | "scheduled"
  | "repaired"
  | "resolved"
  | "declined";

export type Severity = "critical" | "major" | "minor";

export type Deficiency = {
  id: string;
  customer: string;
  property: string;
  systemType: string;
  description: string;
  recommendedAction: string;
  technicianNotes: string;
  inspectionDate: string;
  severity: Severity;
  status: DeficiencyStatus;
  assignedTo: string;
  nextFollowUp: string;
  estimatedValue: number;
  techName: string;
};

export type FollowUpDraft = {
  id: string;
  deficiencyId: string;
  customer: string;
  customerEmail: string;
  property: string;
  subject: string;
  body: string;
  generatedAt: string;
  status: "draft" | "approved" | "sent";
  kind: "deficiency" | "overdue_inspection" | "quote_reminder";
};

export const STATUS_LABEL: Record<DeficiencyStatus, string> = {
  new: "New",
  needs_quote: "Needs quote",
  quote_sent: "Quote sent",
  approved: "Approved",
  scheduled: "Scheduled",
  repaired: "Repaired",
  resolved: "Resolved",
  declined: "Declined",
};

export const STATUS_COLOR: Record<DeficiencyStatus, { bg: string; text: string; ring: string }> = {
  new:          { bg: "rgba(220,38,38,0.12)",  text: "#f87171", ring: "rgba(220,38,38,0.3)" },
  needs_quote:  { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", ring: "rgba(245,158,11,0.3)" },
  quote_sent:   { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", ring: "rgba(59,130,246,0.3)" },
  approved:     { bg: "rgba(16,185,129,0.12)", text: "#34d399", ring: "rgba(16,185,129,0.3)" },
  scheduled:    { bg: "rgba(139,92,246,0.12)", text: "#a78bfa", ring: "rgba(139,92,246,0.3)" },
  repaired:     { bg: "rgba(16,185,129,0.12)", text: "#34d399", ring: "rgba(16,185,129,0.3)" },
  resolved:     { bg: "rgba(107,114,128,0.15)", text: "#9ca3af", ring: "rgba(107,114,128,0.3)" },
  declined:     { bg: "rgba(107,114,128,0.15)", text: "#9ca3af", ring: "rgba(107,114,128,0.3)" },
};

/**
 * Single source of truth for how severity maps to the shared badge/banner visual language.
 * `tone` keys into the SeverityBadge token styles (alarm/warn/info). Job priority maps to the
 * same tones (see PRIORITY_TONE in lib/jobs.ts) so "Critical" reads identically everywhere.
 */
export const SEVERITY_TONE: Record<Severity, { label: string; tone: "alarm" | "warn" | "info" }> = {
  critical: { label: "Critical", tone: "alarm" },
  major:    { label: "Major", tone: "warn" },
  minor:    { label: "Minor", tone: "info" },
};

export const STATUS_ORDER: DeficiencyStatus[] = [
  "new",
  "needs_quote",
  "quote_sent",
  "approved",
  "scheduled",
  "repaired",
  "resolved",
  "declined",
];

export const DEFICIENCIES: Deficiency[] = [
  {
    id: "DEF-1042",
    customer: "Pike Place Market",
    property: "85 Pike St — Main Arcade",
    systemType: "Sprinkler",
    description: "Branch line sprinkler head obstructed by ceiling tile retrofit in dry goods storage.",
    recommendedAction:
      "Relocate or replace 2 sprinkler heads. Verify clearance per NFPA 13 §8.5.5.3 (verify against current edition).",
    technicianNotes: "Found during walk of east wall. Photo evidence captured. Owner aware.",
    inspectionDate: "2026-04-22",
    severity: "critical",
    status: "needs_quote",
    assignedTo: "Maya Chen",
    nextFollowUp: "2026-05-05",
    estimatedValue: 1850,
    techName: "T. Reyes",
  },
  {
    id: "DEF-1041",
    customer: "Belltown Hotel",
    property: "2000 2nd Ave — Kitchen",
    systemType: "Kitchen Hood",
    description: "Wet chemical agent due for hydrostatic testing — last test 2020.",
    recommendedAction: "Schedule UL-300 system service and recharge. NFPA 17A §7 (verify edition).",
    technicianNotes: "Tag missing. Confirmed with kitchen manager service is overdue.",
    inspectionDate: "2026-04-19",
    severity: "critical",
    status: "quote_sent",
    assignedTo: "Maya Chen",
    nextFollowUp: "2026-05-06",
    estimatedValue: 3200,
    techName: "T. Reyes",
  },
  {
    id: "DEF-1039",
    customer: "Amazon Spheres",
    property: "2111 7th Ave — Sphere 2 mezzanine",
    systemType: "VESDA",
    description: "Aspiration filter showing 73% loaded — replacement window approaching.",
    recommendedAction: "Replace primary aspiration filter, recalibrate sensitivity per Xtralis spec.",
    technicianNotes: "Replacement filter on truck for next visit. Customer comp'd this visit.",
    inspectionDate: "2026-04-18",
    severity: "minor",
    status: "scheduled",
    assignedTo: "James Okafor",
    nextFollowUp: "2026-05-12",
    estimatedValue: 425,
    techName: "J. Okafor",
  },
  {
    id: "DEF-1037",
    customer: "Capitol Hill Apartments",
    property: "1410 E Pike St — Unit 304",
    systemType: "Smoke Detection",
    description: "Battery-backup smoke alarm chirping; battery exhausted; no hardwired interconnect.",
    recommendedAction: "Replace battery; inspector recommends hardwired interconnect retrofit (advisory).",
    technicianNotes: "Tenant reports alarm has chirped for 3 weeks.",
    inspectionDate: "2026-04-15",
    severity: "major",
    status: "new",
    assignedTo: "Unassigned",
    nextFollowUp: "2026-05-04",
    estimatedValue: 220,
    techName: "T. Reyes",
  },
  {
    id: "DEF-1036",
    customer: "Pike Place Market",
    property: "85 Pike St — Lower Pike Place",
    systemType: "Pull Stations",
    description: "Pull station #PS-04 missing protective cover; cover broken from prior incident.",
    recommendedAction: "Replace STI-1100 protective cover. Verify station functionality post-replacement.",
    technicianNotes: "Functionality confirmed — only cover missing.",
    inspectionDate: "2026-04-22",
    severity: "minor",
    status: "approved",
    assignedTo: "Maya Chen",
    nextFollowUp: "2026-05-08",
    estimatedValue: 145,
    techName: "T. Reyes",
  },
  {
    id: "DEF-1034",
    customer: "Belltown Hotel",
    property: "2000 2nd Ave — Floors 12-14",
    systemType: "Smoke Detection",
    description: "Six smoke detectors past 10-year sensitivity test window.",
    recommendedAction: "Sensitivity-test or replace. Recommend phased replacement per NFPA 72 §14.4.5 (verify).",
    technicianNotes: "Provided phased replacement plan. Property manager reviewing.",
    inspectionDate: "2026-04-19",
    severity: "major",
    status: "needs_quote",
    assignedTo: "James Okafor",
    nextFollowUp: "2026-05-04",
    estimatedValue: 2850,
    techName: "T. Reyes",
  },
  {
    id: "DEF-1031",
    customer: "SoDo Warehouse",
    property: "2601 Utah Ave S — Bay 4",
    systemType: "Sprinkler",
    description: "ESFR sprinkler obstruction — pallet rack stacked above design clearance.",
    recommendedAction: "Reorganize storage to maintain 18\" minimum clearance below deflectors.",
    technicianNotes: "Manager committed to reorg this week. No hardware change required.",
    inspectionDate: "2026-04-10",
    severity: "major",
    status: "approved",
    assignedTo: "James Okafor",
    nextFollowUp: "2026-05-04",
    estimatedValue: 0,
    techName: "J. Okafor",
  },
  {
    id: "DEF-1029",
    customer: "Amazon Spheres",
    property: "2111 7th Ave — Loading dock",
    systemType: "Suppression",
    description: "Clean agent system — manual pull station signage faded, not legible from 5 ft.",
    recommendedAction: "Replace signage per NFPA 2001 §5.4 (verify edition).",
    technicianNotes: "Quick fix. Estimate is materials only.",
    inspectionDate: "2026-04-18",
    severity: "minor",
    status: "resolved",
    assignedTo: "James Okafor",
    nextFollowUp: "",
    estimatedValue: 95,
    techName: "J. Okafor",
  },
  {
    id: "DEF-1028",
    customer: "Capitol Hill Apartments",
    property: "1410 E Pike St — Garage level",
    systemType: "CO Detectors",
    description: "Two CO detectors non-responsive on functional test.",
    recommendedAction: "Replace both detectors; verify supervisory loop on FACP.",
    technicianNotes: "Pulled from service pending replacement.",
    inspectionDate: "2026-04-15",
    severity: "critical",
    status: "quote_sent",
    assignedTo: "Maya Chen",
    nextFollowUp: "2026-05-05",
    estimatedValue: 480,
    techName: "T. Reyes",
  },
  {
    id: "DEF-1025",
    customer: "Pike Place Market",
    property: "85 Pike St — Sanitary Market",
    systemType: "Sprinkler",
    description: "Wet pipe gauge reading high — 195 PSI, design max 175 PSI.",
    recommendedAction: "Investigate pressure source; install/verify pressure-reducing valve.",
    technicianNotes: "Possible city pressure spike. Asked owner to schedule plumber/sprinkler contractor.",
    inspectionDate: "2026-04-04",
    severity: "major",
    status: "scheduled",
    assignedTo: "Maya Chen",
    nextFollowUp: "2026-05-09",
    estimatedValue: 1100,
    techName: "T. Reyes",
  },
  {
    id: "DEF-1023",
    customer: "Belltown Hotel",
    property: "2000 2nd Ave — Elevator lobby 6",
    systemType: "Pull Stations",
    description: "Pull station mounted at 56\" — exceeds ADA reach range.",
    recommendedAction: "Lower mounting per ADA §308 (operable parts) — 48\" max.",
    technicianNotes: "Installer error from 2019 retrofit. Not urgent but should be fixed.",
    inspectionDate: "2026-04-19",
    severity: "minor",
    status: "new",
    assignedTo: "Unassigned",
    nextFollowUp: "2026-05-07",
    estimatedValue: 320,
    techName: "T. Reyes",
  },
  {
    id: "DEF-1019",
    customer: "Amazon Spheres",
    property: "2111 7th Ave — Sphere 1 floor 2",
    systemType: "Smoke Detection",
    description: "Photoelectric detector D-218 in alarm state during functional test, no clear cause.",
    recommendedAction: "Clean head, retest; if persists replace and review for environmental contamination.",
    technicianNotes: "May be dust-related; high foliage area.",
    inspectionDate: "2026-04-18",
    severity: "major",
    status: "repaired",
    assignedTo: "James Okafor",
    nextFollowUp: "",
    estimatedValue: 165,
    techName: "J. Okafor",
  },
  {
    id: "DEF-1015",
    customer: "Capitol Hill Apartments",
    property: "1410 E Pike St — Stair B",
    systemType: "Smoke Detection",
    description: "Stair pressurization tied to smoke detection not actuating during test.",
    recommendedAction: "Coordinate with mechanical contractor; verify smoke-control sequence per NFPA 92.",
    technicianNotes: "Coordinating with building mechanical. Out of scope of fire alarm contract directly.",
    inspectionDate: "2026-04-15",
    severity: "critical",
    status: "needs_quote",
    assignedTo: "Maya Chen",
    nextFollowUp: "2026-05-04",
    estimatedValue: 4200,
    techName: "T. Reyes",
  },
  {
    id: "DEF-1011",
    customer: "SoDo Warehouse",
    property: "2601 Utah Ave S — Office mezzanine",
    systemType: "Heat Detectors",
    description: "ROR heat detector showing low supervisory voltage.",
    recommendedAction: "Megger circuit, replace conductor if degraded.",
    technicianNotes: "Likely conduit damage from forklift in 2025. Truck stocked with replacement wire.",
    inspectionDate: "2026-04-10",
    severity: "major",
    status: "scheduled",
    assignedTo: "James Okafor",
    nextFollowUp: "2026-05-11",
    estimatedValue: 540,
    techName: "J. Okafor",
  },
];

export const FOLLOW_UP_DRAFTS: FollowUpDraft[] = [
  {
    id: "FU-205",
    deficiencyId: "DEF-1042",
    customer: "Pike Place Market",
    customerEmail: "facilities@pikeplacemarket.org",
    property: "85 Pike St — Main Arcade",
    subject: "Quote — sprinkler head relocation, Main Arcade",
    body: `Hi Pike Place Facilities team,

During our April 22 inspection at the Main Arcade, our technician noted two sprinkler heads obstructed by the recent ceiling-tile retrofit in dry-goods storage. To stay within NFPA 13 clearance requirements we recommend relocating the affected heads.

We have a quote ready for your review:
  • Relocate / replace 2 sprinkler heads
  • Includes labor, fittings, post-work inspection
  • Estimated total: $1,850

Reply to this email or give us a call and we'll schedule the work. Happy to walk through the photos from the inspection if useful.

Best,
Maya — PyroGuard Service`,
    generatedAt: "2026-05-04",
    status: "draft",
    kind: "deficiency",
  },
  {
    id: "FU-204",
    deficiencyId: "DEF-1041",
    customer: "Belltown Hotel",
    customerEmail: "engineering@belltownhotel.com",
    property: "2000 2nd Ave — Kitchen",
    subject: "Reminder — UL-300 hydrostatic testing overdue",
    body: `Hi Belltown Engineering,

Following up on the kitchen suppression system. The wet-chemical agent is past its hydrostatic testing window (last test 2020) and should be serviced before the next AHJ visit to avoid a citation.

We sent the quote on April 24 — let us know if anything needs updating, or reply with a date that works and we'll get it on the schedule.

Best,
Maya — PyroGuard Service`,
    generatedAt: "2026-05-04",
    status: "draft",
    kind: "quote_reminder",
  },
  {
    id: "FU-203",
    deficiencyId: "DEF-1037",
    customer: "Capitol Hill Apartments",
    customerEmail: "manager@capitolhillapts.com",
    property: "1410 E Pike St — Unit 304",
    subject: "Smoke alarm — Unit 304 follow-up",
    body: `Hi Capitol Hill management,

Quick note from our April 15 inspection — the tenant in unit 304 reported the smoke alarm has been chirping for ~3 weeks. The battery is exhausted. We can swing by to swap it on our next service run.

Also worth flagging (not urgent): the unit doesn't have a hardwired interconnected alarm. We can scope a retrofit if that's something you'd like to plan into next year's budget.

Let us know how you'd like to proceed.

Best,
Maya — PyroGuard Service`,
    generatedAt: "2026-05-03",
    status: "draft",
    kind: "deficiency",
  },
  {
    id: "FU-202",
    deficiencyId: "DEF-1034",
    customer: "Belltown Hotel",
    customerEmail: "engineering@belltownhotel.com",
    property: "2000 2nd Ave — Floors 12-14",
    subject: "Phased smoke-detector replacement plan",
    body: `Hi Belltown Engineering,

Per our April 19 walk-through, six smoke detectors on floors 12-14 are outside the 10-year sensitivity window. We've drafted a phased replacement plan to spread the work and the cost across two visits:

  • Phase 1 (this month): floors 12 + 13 — $1,425
  • Phase 2 (next month): floor 14 + spare stock — $1,425

This avoids a single shutdown of guest floors. Reply when you're ready and we'll schedule Phase 1.

Best,
Maya — PyroGuard Service`,
    generatedAt: "2026-05-02",
    status: "draft",
    kind: "deficiency",
  },
  {
    id: "FU-201",
    deficiencyId: "DEF-1015",
    customer: "Capitol Hill Apartments",
    customerEmail: "manager@capitolhillapts.com",
    property: "1410 E Pike St — Stair B",
    subject: "Stair B smoke-control — follow-up needed",
    body: `Hi Capitol Hill management,

The stair-pressurization sequence in Stair B did not actuate during our April 15 functional test. This crosses the line between fire-alarm and mechanical (it's a smoke-control sequence), so we need to coordinate with your mechanical contractor.

Two paths:
  1. We can lead the coordination on your behalf — single point of contact, single invoice.
  2. We hand off to your mechanical and stay available for the alarm-side work only.

Estimated total scope: $4,200 (option 1).

Let us know which path you'd prefer and we'll move on it.

Best,
Maya — PyroGuard Service`,
    generatedAt: "2026-05-01",
    status: "draft",
    kind: "deficiency",
  },
  {
    id: "FU-200",
    deficiencyId: "",
    customer: "SoDo Warehouse",
    customerEmail: "ops@sodowarehouse.com",
    property: "2601 Utah Ave S",
    subject: "Annual inspection — overdue",
    body: `Hi SoDo Operations,

Quick check-in — your annual fire-alarm inspection is now 18 days past its renewal date. We'd like to get this on the books before any AHJ activity flags it.

Reply with a few dates that work and we'll send confirmation.

Best,
Maya — PyroGuard Service`,
    generatedAt: "2026-05-04",
    status: "draft",
    kind: "overdue_inspection",
  },
];

export const DASHBOARD_KPIS = {
  openDeficiencies: DEFICIENCIES.filter((d) => !["resolved", "declined", "repaired"].includes(d.status)).length,
  overdueInspections: 8,
  quotesWaiting: DEFICIENCIES.filter((d) => d.status === "quote_sent").length,
  estFollowUpRevenue: DEFICIENCIES.filter((d) => !["resolved", "declined"].includes(d.status))
    .reduce((s, d) => s + d.estimatedValue, 0),
  followUpsToday: FOLLOW_UP_DRAFTS.filter((f) => f.status === "draft").length,
  resolvedThisMonth: DEFICIENCIES.filter((d) => ["resolved", "repaired"].includes(d.status)).length,
};
