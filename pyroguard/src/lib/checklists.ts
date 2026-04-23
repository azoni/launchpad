export type SystemKey =
  | "Smoke Detection"
  | "Sprinkler"
  | "Pull Stations"
  | "Suppression"
  | "VESDA"
  | "Full System"
  | "Heat Detectors"
  | "CO Detectors"
  | "Duct Detectors"
  | "Kitchen Hood"
  | "Elevator Recall"
  | "Mass Notification"
  | "Nurse Call Integration"
  | "NFPA 72";

export const CHECKLIST_ITEMS: Record<SystemKey, string[]> = {
  "Smoke Detection": [
    "Visual inspection of all detectors",
    'Sensitivity test (NFPA 72 §14.4.5)',
    "Alarm function test",
    'Check for obstructions within 18"',
    "Verify detector spacing per code",
    "Document serial numbers",
  ],
  Sprinkler: [
    "Inspector test valve operation",
    "Main drain test",
    "Check pressure gauges",
    'Verify head clearance (18" min)',
    "Check for corrosion/damage",
    "Flow switch test",
  ],
  "Pull Stations": [
    "Manual pull test at each station",
    'Verify ADA height compliance (48" max)',
    "Check cover plates & signage",
    "Test remote annunciator",
    "Verify zone labeling",
  ],
  Suppression: [
    "Agent quantity verification",
    "Nozzle inspection & clearance",
    "Abort switch test",
    "Pre-discharge alarm test",
    "Manual release test",
    "Check pressure indicators",
  ],
  VESDA: [
    "Airflow verification at sampling points",
    "Filter inspection & replacement log",
    "Sensitivity calibration check",
    "Test alarm levels (Alert/Action/Fire)",
    "Pipe integrity inspection",
  ],
  "Full System": [
    "Panel self-diagnostic",
    "Battery load test (24hr capacity)",
    "All zone verification",
    "Ground fault check",
    "Communication test to monitoring",
    "As-built drawing review",
  ],
  "Heat Detectors": [
    "Fixed-temperature operation test",
    "Rate-of-rise verification",
    "Mounting clearance check",
    "Manufacturer date / service life audit",
    "Zone mapping confirmed",
  ],
  "CO Detectors": [
    "Sensor expiration date check",
    "Functional test with calibrated CO source",
    "Interconnect verification",
    "End-of-life notification test",
  ],
  "Duct Detectors": [
    "Sample tube integrity",
    "Airflow differential check",
    "Fan shutdown relay test",
    "Remote test station verification",
  ],
  "Kitchen Hood": [
    "Semiannual suppression service (NFPA 17A)",
    "Fusible link replacement log",
    "Nozzle position & cap check",
    "Fuel shutoff interlock test",
    "Manual pull station test",
  ],
  "Elevator Recall": [
    "Primary recall (lobby) test",
    "Alternate recall (adjacent floor) test",
    "Hatway smoke detector test",
    "Machine room heat detector test",
    "Firefighter service Phase II test",
  ],
  "Mass Notification": [
    "Intelligibility test per occupancy",
    "Pre-recorded message playback",
    "Live paging microphone check",
    "Voice alarm amplifier load test",
    "Survivability path verification",
  ],
  "Nurse Call Integration": [
    "Interface supervision test",
    "Code Blue relay confirmation",
    "Silent alarm path verification",
    "Patient area device test (each bed)",
  ],
  "NFPA 72": [
    "Annual record-of-completion review",
    "Sequence-of-operations walkthrough",
    "All supervisory signal test",
    "Trouble signal test",
    "Secondary power 24hr + 5min load test",
  ],
};

export const AI_RESPONSES: Record<string, string> = {
  default:
    "Analyzing inspection data. Ask me about NFPA 72 requirements, deficiency drafting, or report generation.",
  sensitivity:
    "Per NFPA 72 §14.4.5.3, smoke detectors must be tested using listed aerosol or functional testing equipment. Document the sensitivity reading — if it falls outside the manufacturer's listed range (typically 0.5% to 4% per foot), the detector must be replaced. Flag this in your report under 'Deficiencies Requiring Immediate Correction.'",
  battery:
    "Battery systems must maintain full load for 24 hours in standby + 5 minutes in alarm (NFPA 72 §10.6.7). For a typical facility you'll need a load test with a minimum of 7.2Ah capacity. Check the date on the batteries — if they're over 4 years old, replacement is strongly recommended regardless of test results.",
  spacing:
    "Smoke detector spacing in office/commercial buildings defaults to 900 sq ft coverage per detector on a smooth ceiling, per NFPA 72 §17.7.3. For ceilings above 10 ft you must apply the correction factor table from §17.7.4. Want me to calculate the adjusted spacing?",
  report:
    "I can draft the inspection report. Based on a completed checklist I typically surface deficiencies with (a) detector sensitivity failures (30-day correction per IFC §907.8.5), (b) painted pull stations (NFPA 72 §10.3.1), and (c) battery load test failures. Provide the checklist state and I'll format it for AHJ submission.",
  route:
    "I've optimized your route based on building access windows, job durations, and Seattle traffic patterns. Starting with UW Medical Center (scheduled access 8-11am), then Belltown Hotel, Amazon Spheres, Pike Place, Capitol Hill Apartments, SoDo Warehouse. Estimated completion: 5:45pm. Saved 47 minutes vs. default order.",
};

export function keywordResponse(q: string): string {
  const u = q.toLowerCase();
  if (/sensitiv/.test(u)) return AI_RESPONSES.sensitivity;
  if (/batter/.test(u)) return AI_RESPONSES.battery;
  if (/spacing|distance/.test(u)) return AI_RESPONSES.spacing;
  if (/report|generat/.test(u)) return AI_RESPONSES.report;
  if (/route|optim/.test(u)) return AI_RESPONSES.route;
  return AI_RESPONSES.default;
}
