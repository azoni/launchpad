export const DISCLAIMER =
  "PyroGuard supports but does not replace the judgment of a NICET-certified inspector. Every NFPA, IFC, or jurisdictional citation must be verified against the current edition of the applicable standard before it is relied upon in a formal report or filed with an AHJ. The inspector of record remains responsible for the accuracy of all findings, citations, and corrective actions.";

export type NFPAStandard =
  | "NFPA 72"
  | "NFPA 25"
  | "NFPA 10"
  | "NFPA 17"
  | "NFPA 17A"
  | "NFPA 96"
  | "NFPA 101"
  | "IFC Ch 9";

export type Frequency =
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual"
  | "3-year"
  | "5-year"
  | "10-year";

export interface InspectionRequirement {
  standard: NFPAStandard;
  system: string;
  frequency: Frequency;
  /** Only populated when verified against current edition. Otherwise null. */
  section: string | null;
  citationVerified: boolean;
  notes: string;
}

/**
 * Requirements schema for inspection frequencies. Citations deliberately conservative —
 * `section` is set only where we can verify against the current edition. Everything
 * else is left null and flagged `citationVerified: false` so the app never shows a
 * fabricated code reference.
 */
export const REGULATIONS: InspectionRequirement[] = [
  {
    standard: "NFPA 72",
    system: "Fire alarm system — full inspection & test",
    frequency: "annual",
    section: null,
    citationVerified: false,
    notes:
      "Annual inspection and test of initiating devices, notification appliances, and control equipment. Verify against current NFPA 72 Chapter 14.",
  },
  {
    standard: "NFPA 72",
    system: "Supervisory signaling — functional test",
    frequency: "quarterly",
    section: null,
    citationVerified: false,
    notes: "Quarterly functional testing of supervising station signaling.",
  },
  {
    standard: "NFPA 72",
    system: "Central station transmitter — functional test",
    frequency: "monthly",
    section: null,
    citationVerified: false,
    notes: "Monthly transmitter functional test.",
  },
  {
    standard: "NFPA 25",
    system: "Wet sprinkler system — main drain test",
    frequency: "annual",
    section: null,
    citationVerified: false,
    notes: "Annual main drain test at each installation point.",
  },
  {
    standard: "NFPA 25",
    system: "Fire pump — no-flow (churn) test",
    frequency: "monthly",
    section: null,
    citationVerified: false,
    notes: "Monthly no-flow run of electric fire pumps; weekly for diesel.",
  },
  {
    standard: "NFPA 25",
    system: "Fire pump — annual flow test",
    frequency: "annual",
    section: null,
    citationVerified: false,
    notes: "Annual flow test at rated, peak, and 150% capacity.",
  },
  {
    standard: "NFPA 25",
    system: "Sprinkler heads — visual inspection",
    frequency: "quarterly",
    section: null,
    citationVerified: false,
    notes: "Quarterly visual inspection from floor level.",
  },
  {
    standard: "NFPA 25",
    system: "Standpipe hose valves — inspection",
    frequency: "annual",
    section: null,
    citationVerified: false,
    notes: "Annual inspection of hose valves and fire department connections.",
  },
  {
    standard: "NFPA 10",
    system: "Portable fire extinguisher — monthly inspection",
    frequency: "monthly",
    section: null,
    citationVerified: false,
    notes: "Monthly visual inspection by owner or representative.",
  },
  {
    standard: "NFPA 10",
    system: "Portable fire extinguisher — annual maintenance",
    frequency: "annual",
    section: null,
    citationVerified: false,
    notes: "Annual maintenance and verification of service collar or tag.",
  },
  {
    standard: "NFPA 10",
    system: "Portable fire extinguisher — 6-year internal maintenance",
    frequency: "5-year",
    section: null,
    citationVerified: false,
    notes: "Stored-pressure extinguishers require internal exam at defined intervals.",
  },
  {
    standard: "NFPA 10",
    system: "Portable fire extinguisher — hydrostatic test",
    frequency: "5-year",
    section: null,
    citationVerified: false,
    notes: "Hydrostatic test interval varies by extinguisher type (5 or 12 years).",
  },
  {
    standard: "NFPA 17",
    system: "Dry chemical suppression — semiannual inspection",
    frequency: "semiannual",
    section: null,
    citationVerified: false,
    notes: "Semiannual inspection of dry chemical suppression systems.",
  },
  {
    standard: "NFPA 17A",
    system: "Wet chemical kitchen suppression — semiannual inspection",
    frequency: "semiannual",
    section: null,
    citationVerified: false,
    notes: "Semiannual inspection of wet chemical systems protecting cooking equipment.",
  },
  {
    standard: "NFPA 96",
    system: "Commercial kitchen hood — semiannual cleaning",
    frequency: "semiannual",
    section: null,
    citationVerified: false,
    notes: "Cleaning interval depends on cooking volume — moderate-to-heavy use is semiannual or more frequent.",
  },
  {
    standard: "NFPA 101",
    system: "Emergency lighting — 30-second monthly test",
    frequency: "monthly",
    section: null,
    citationVerified: false,
    notes: "Monthly functional test of emergency lighting of at least 30 seconds duration.",
  },
  {
    standard: "NFPA 101",
    system: "Emergency lighting — annual 90-minute test",
    frequency: "annual",
    section: null,
    citationVerified: false,
    notes: "Annual test of emergency lighting for the full 90-minute duration.",
  },
  {
    standard: "IFC Ch 9",
    system: "Means of egress — obstruction & illumination check",
    frequency: "monthly",
    section: null,
    citationVerified: false,
    notes: "Monthly walk-through to verify exits are unobstructed and illuminated.",
  },
];

/**
 * Lifetime / age thresholds used for device-age warnings. Conservative defaults —
 * inspector must verify against current NFPA 72 and manufacturer documentation
 * for the installed device before relying on these.
 */
export const DEVICE_LIFETIME = {
  smoke_photoelectric: { maxYears: 10, notes: "Typical photoelectric smoke detector service life." },
  smoke_ionization: { maxYears: 10, notes: "Typical ionization smoke detector service life." },
  heat_fixed: { maxYears: 15, notes: "Conservative default — confirm against manufacturer." },
  heat_roc: { maxYears: 15, notes: "Conservative default — confirm against manufacturer." },
  horn_strobe: { maxYears: 20, notes: "Confirm against manufacturer." },
  speaker_strobe: { maxYears: 20, notes: "Confirm against manufacturer." },
  control_panel: { maxYears: 15, notes: "Check battery interval separately." },
  annunciator: { maxYears: 15, notes: "Check battery interval separately." },
} as const;
