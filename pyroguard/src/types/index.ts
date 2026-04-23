export type DeviceType =
  | "smoke_photoelectric"
  | "smoke_ionization"
  | "heat_fixed"
  | "heat_roc"
  | "pull_station"
  | "horn_strobe"
  | "speaker_strobe"
  | "duct_detector"
  | "control_panel"
  | "annunciator"
  | "sprinkler_head"
  | "sprinkler_valve"
  | "fdc"
  | "kitchen_hood"
  | "extinguisher_abc"
  | "extinguisher_k"
  | "extinguisher_co2"
  | "emergency_light"
  | "exit_sign";

export type Result = "pass" | "fail" | "na";
export type Severity = "critical" | "high" | "medium" | "low";
export type CompliantStatus = "compliant" | "upcoming" | "overdue" | "open_def";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Customer {
  id: string;
  name: string;
  contact: { name: string; email: string; phone: string };
  createdAt: number;
}

export interface Building {
  id: string;
  customerId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  geo: GeoPoint;
  ahj: string;
  jurisdiction: string;
  occupancyType: string;
  squareFeet: number;
  floors: number;
  createdAt: number;
}

export interface Device {
  id: string;
  customerId: string;
  buildingId: string;
  type: DeviceType;
  manufacturer: string;
  model: string;
  serial: string;
  location: string;
  installDate: number;
  lastTestDate?: number;
  nextDueDate?: number;
  qrCode: string;
  status: CompliantStatus;
}

export interface TestRecord {
  id: string;
  deviceId: string;
  date: number;
  result: Result;
  technicianName: string;
  notes?: string;
  photoRefs?: string[];
}

export interface Job {
  id: string;
  customerId: string;
  buildingIds: string[];
  scheduledStart: number;
  scheduledEnd: number;
  assignedTech: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  notes?: string;
}

export interface Inspection {
  id: string;
  jobId?: string;
  customerId: string;
  buildingId: string;
  technicianName: string;
  startedAt: number;
  completedAt?: number;
  signatureRef?: string;
  geo?: GeoPoint;
  reportId?: string;
  totalDevices: number;
  passed: number;
  failed: number;
  na: number;
}

export interface InspectionEvent {
  id: string;
  deviceId: string;
  result: Result;
  notes?: string;
  photoRefs?: string[];
  geo?: GeoPoint;
  timestamp: number;
  deficiencyId?: string;
}

export interface Deficiency {
  id: string;
  customerId: string;
  buildingId: string;
  deviceId?: string;
  severity: Severity;
  description: string;
  codeCitation: string | null;
  codeCitationVerified: boolean;
  correctiveAction: string;
  reinspectDue: number;
  status: "open" | "closed";
  createdAt: number;
  closedAt?: number;
}

export interface Report {
  id: string;
  inspectionId: string;
  customerId: string;
  buildingId: string;
  storageRef: string;
  type: "inspection" | "deficiency_notice";
  generatedAt: number;
  sizeBytes: number;
}
