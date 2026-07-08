export type ScreenKind =
  | "briefing"
  | "route"
  | "ontest"
  | "sitemap"
  | "checklist"
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

export type Device = {
  id: string;
  label: string;
  type: string;
  floor: string;
  location: string;
  checklistItems?: string[];
  /** set when this device has a scripted outcome (the deficiency) */
  scripted?: string;
};

export type Floor = {
  id: string;
  name: string;
  areas: string[];
};

export type DummyData = {
  company: { name: string; city: string };
  inspector: { name: string; certs: string; license: string };
  site: { name: string; address: string; floors: Floor[] };
  customer: { name: string; role: string };
  ahj: { name: string; portal: string; filingFee: string };
  agreement: { type: string; frequencies: string };
};

export type Tally = { label: string; value: string; contrast: string };

export type Scenario = {
  metaInfo: { title: string; tagline: string; estimatedMinutes: number };
  dummyData: DummyData;
  devices: Device[];
  steps: Step[];
  debrief: { tallies: Tally[]; closing: string };
};
