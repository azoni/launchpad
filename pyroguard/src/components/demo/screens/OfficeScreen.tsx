"use client";
import type { DummyData } from "@/lib/demo/types";
import { LiveReport, type ReportFinding } from "@/components/demo/screens/LiveReport";

export function OfficeScreen({ data, onDone }: { data: DummyData; onDone: () => void }) {
  // The two findings the player actually logged this run — fed to the AI to draft the letter.
  const findings: ReportFinding[] = [
    {
      deviceId: "HEAD-B1-C7",
      label: "Pendent sprinkler head, Row C stall 7",
      location: "B1 parking, Row C above stall 7, under the exhaust fan",
      severity: "critical",
      standard: "NFPA 25",
      note: "Heavy frame and deflector corrosion with exhaust loading — detrimental to performance; the head may not fuse and its spray pattern is compromised. Replace the affected heads.",
    },
    {
      deviceId: "RADIO-1",
      label: "Fire-alarm communicator backup battery",
      location: "L1 riser room, above the fire alarm control panel",
      severity: "critical",
      standard: "NFPA 72",
      note: "12V 8Ah standby battery failed its load test, sagging to 10.4 V — it cannot carry the panel on secondary power. Replace the battery.",
    },
  ];

  const meta = {
    site: data.site.name,
    address: data.site.address,
    inspector: data.inspector.name,
    license: data.inspector.license,
    ahj: data.ahj.name,
    portal: data.ahj.portal,
    customer: `${data.customer.name}, ${data.customer.role}`,
  };

  return (
    <div className="space-y-3">
      <p className="text-muted text-[12.5px] leading-relaxed font-sans">
        Two findings, one certified inspector, zero re-keying. Watch the office side draft itself from what you logged in
        the field — read the letter, every citation is checkable.
      </p>
      <LiveReport findings={findings} meta={meta} onDone={onDone} />
    </div>
  );
}
