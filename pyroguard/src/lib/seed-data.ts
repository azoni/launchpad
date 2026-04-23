import type { SystemKey } from "@/lib/checklists";

export type SeedJob = {
  id: string;
  name: string;
  address: string;
  type: "Commercial" | "Corporate" | "Residential" | "Industrial" | "Hospitality" | "Healthcare";
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "pending" | "in-progress" | "completed";
  lat: number;
  lng: number;
  duration: number;
  systems: SystemKey[];
  lastInspected: string;
  squareFeet: number;
  floors: number;
  ahj: string;
};

export const SEATTLE_JOBS: SeedJob[] = [
  {
    id: "pike-place",
    name: "Pike Place Market",
    address: "85 Pike St, Seattle",
    type: "Commercial",
    priority: "High",
    status: "pending",
    lat: 47.6097,
    lng: -122.3422,
    duration: 90,
    systems: ["Sprinkler", "Smoke Detection", "Pull Stations"],
    lastInspected: "2024-01-15",
    squareFeet: 62000,
    floors: 3,
    ahj: "Seattle Fire Department",
  },
  {
    id: "amazon-spheres",
    name: "Amazon Spheres",
    address: "2111 7th Ave, Seattle",
    type: "Corporate",
    priority: "High",
    status: "in-progress",
    lat: 47.6154,
    lng: -122.3396,
    duration: 120,
    systems: ["Suppression", "VESDA", "Duct Detectors"],
    lastInspected: "2024-03-02",
    squareFeet: 65000,
    floors: 4,
    ahj: "Seattle Fire Department",
  },
  {
    id: "capitol-hill",
    name: "Capitol Hill Apartments",
    address: "1410 E Pike St, Seattle",
    type: "Residential",
    priority: "Medium",
    status: "pending",
    lat: 47.6143,
    lng: -122.3155,
    duration: 60,
    systems: ["Smoke Detection", "CO Detectors", "Pull Stations"],
    lastInspected: "2023-11-20",
    squareFeet: 48000,
    floors: 6,
    ahj: "Seattle Fire Department",
  },
  {
    id: "sodo-warehouse",
    name: "SoDo Warehouse",
    address: "2601 Utah Ave S, Seattle",
    type: "Industrial",
    priority: "Low",
    status: "completed",
    lat: 47.576,
    lng: -122.3352,
    duration: 75,
    systems: ["Sprinkler", "Heat Detectors", "Suppression"],
    lastInspected: "2024-04-01",
    squareFeet: 180000,
    floors: 2,
    ahj: "Seattle Fire Department",
  },
  {
    id: "belltown-hotel",
    name: "Belltown Hotel",
    address: "2000 2nd Ave, Seattle",
    type: "Hospitality",
    priority: "High",
    status: "pending",
    lat: 47.6134,
    lng: -122.3446,
    duration: 110,
    systems: ["Full System", "Kitchen Hood", "Elevator Recall"],
    lastInspected: "2024-02-10",
    squareFeet: 420000,
    floors: 18,
    ahj: "Seattle Fire Department",
  },
  {
    id: "uw-medical",
    name: "UW Medical Center",
    address: "1959 NE Pacific St, Seattle",
    type: "Healthcare",
    priority: "Critical",
    status: "pending",
    lat: 47.6496,
    lng: -122.308,
    duration: 180,
    systems: ["NFPA 72", "Mass Notification", "Nurse Call Integration"],
    lastInspected: "2024-01-01",
    squareFeet: 1200000,
    floors: 14,
    ahj: "Seattle Fire Department",
  },
];

export const RECENT_REPORTS = [
  {
    id: "rpt-sodo-0401",
    site: "SoDo Warehouse",
    jobId: "sodo-warehouse",
    date: "2024-04-01",
    type: "Annual",
    status: "PASS" as const,
    deficiencies: 0,
  },
  {
    id: "rpt-spheres-0302",
    site: "Amazon Spheres",
    jobId: "amazon-spheres",
    date: "2024-03-02",
    type: "Semi-Annual",
    status: "PASS" as const,
    deficiencies: 1,
  },
  {
    id: "rpt-pike-0115",
    site: "Pike Place Market",
    jobId: "pike-place",
    date: "2024-01-15",
    type: "Annual",
    status: "FAIL" as const,
    deficiencies: 3,
  },
  {
    id: "rpt-belltown-0210",
    site: "Belltown Hotel",
    jobId: "belltown-hotel",
    date: "2024-02-10",
    type: "Quarterly",
    status: "PASS" as const,
    deficiencies: 0,
  },
];
