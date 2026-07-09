export type ScreenKind =
  | "briefing"
  | "route"
  | "ontest"
  | "sitemap"
  | "checklist"
  | "firealarm"
  | "camera"
  | "severity"
  | "extinguishers"
  | "signature"
  | "sync"
  | "office"
  | "debrief";

export type PainPoint = {
  title: string;
  oldWay: string;
  fix: string;
  stat?: string;
};

export type Choice = {
  label: string;
  correct?: boolean;
  feedback: string;
};

export type Step = {
  id: string;
  phase: string;
  screen: ScreenKind;
  title: string;
  narrative: string;
  interaction: string;
  choices?: Choice[];
  painPoint?: PainPoint;
  /** cell signal state while this step plays (default "ok") */
  signal?: "ok" | "none";
};

export type DeviceHistory = {
  lastInspected: string;
  lastReading: string;
  priorNotes: string;
  /** ok = holding, watch = trending, worse = degrading year-over-year */
  trendFlag?: "ok" | "watch" | "worse";
};

/**
 * A backup battery (or matched set) on a device — the yearly inventory an inspector
 * pre-loads for. 12V 8Ah SLA is the default; panels/boosters carry a series pair (24V),
 * the radio a single 12V. Status drives the "what's due this year" pre-load view.
 */
export type Battery = {
  voltage: number;
  ampHours: number;
  /** matched set: 2 in a panel/booster (series → 24V), 1 in a radio */
  count: number;
  installed: string;
  nextDue: string;
  status: "ok" | "due-soon" | "overdue";
  /** annual load/capacity test result, kept next to the date */
  lastLoadTest?: string;
};

export type Device = {
  id: string;
  label: string;
  type: string;
  floor: string;
  location: string;
  checklistItems?: string[];
  /** prior-year record surfaced in the device-history peek */
  history?: DeviceHistory;
  /** backup batteries on this device (fire panel, booster, radio) */
  batteries?: Battery[];
  /** set when this device has a scripted outcome (the deficiency) */
  scripted?: string;
};

/** A sprinkler system = its own riser, waterflow, main drain, and inspector's-test point. */
export type FireSystem = {
  id: string;
  label: string;
  kind: "wet" | "dry" | "preaction" | "deluge" | "antifreeze" | "standpipe";
  floor: string;
  /** where the inspector's test connection lives — the biggest route-planning note */
  itcLocation: string;
  /** one-person "at riser" vs a two-person remote trip test */
  itcCrew?: "one-person" | "two-person";
  mainDrainLocation?: string;
};

/** Tribal knowledge a tech needs BEFORE arriving / before flowing water. */
export type CriticalNote = {
  id: string;
  category: "on-test" | "property-damage" | "access" | "freeze" | "safety";
  text: string;
  severity?: "high" | "med";
};

/** One monitoring/central-station account. A site routinely carries several. */
export type MonitoringAccount = {
  id: string;
  account: string;
  covers: string;
  company: string;
  phone: string;
  signalFormat?: string;
  /** masked in the UI, never surfaced in plain history */
  passcode?: string;
};

/** An occupancy/space — reframed from generic "tenant" toward retail suites. */
export type Space = {
  id: string;
  kind: "retail" | "residential" | "office";
  name: string;
  hours: string;
  contact?: string;
  access?: string;
};

/** Fire-alarm equipment roster (NFPA 72) surfaced for pre-load, not a full test flow here. */
export type FireAlarmInventory = {
  panelMake: string;
  panelModel: string;
  panelClass: "conventional" | "addressable" | "releasing" | "voice";
  panelLocation: string;
  annunciators: { count: number; locations: string[] };
  boosters: { count: number; locations: string[] };
  radio: { tech: "cellular" | "IP" | "radio-mesh" | "POTS"; make: string };
};

export type Floor = {
  id: string;
  name: string;
  areas: string[];
};

export type DummyData = {
  company: { name: string; city: string };
  inspector: { name: string; certs: string; license: string };
  site: {
    name: string;
    address: string;
    floors: Floor[];
    /** secure/restricted facility → suppress map/photos/GPS (jails, SCIFs, data centers) */
    restricted?: { reason: string; suppress: string[] };
  };
  customer: { name: string; role: string };
  ahj: { name: string; portal: string; filingFee: string };
  agreement: { type: string; frequencies: string };
  /** NFPA 72 fire-alarm equipment roster, pre-loaded before the truck rolls */
  fireAlarm?: FireAlarmInventory;
  /** sprinkler systems with their inspector's-test locations (route planning) */
  systems?: FireSystem[];
  /** read-me-first notes surfaced at job start + re-triggered in context */
  criticalNotes?: CriticalNote[];
  /** every monitoring account on the site (fire / elevator / burglar …) */
  monitoring?: MonitoringAccount[];
  /** retail / occupancy spaces (hours + contact feed impairment notification) */
  spaces?: Space[];
};

export type Tally = { label: string; value: string; contrast: string };

export type Scenario = {
  metaInfo: { title: string; tagline: string; estimatedMinutes: number };
  dummyData: DummyData;
  devices: Device[];
  steps: Step[];
  debrief: { tallies: Tally[]; closing: string };
};
