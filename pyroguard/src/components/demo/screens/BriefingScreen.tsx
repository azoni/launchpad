"use client";
import { useState } from "react";
import type { Device, DummyData } from "@/lib/demo/types";
import { DeviceHistoryPeek } from "@/components/demo/DeviceHistoryPeek";
import { haptic } from "@/lib/haptics";

const NOTE_STYLE: Record<string, { chip: string; color: string; border: string }> = {
  "on-test": { chip: "ON-TEST", color: "text-warn", border: "border-warn/40" },
  "property-damage": { chip: "PROPERTY", color: "text-fire", border: "border-fire/40" },
  access: { chip: "ACCESS", color: "text-muted", border: "border-border" },
  freeze: { chip: "FREEZE", color: "text-info", border: "border-info/40" },
  safety: { chip: "SAFETY", color: "text-alarm", border: "border-alarm/40" },
};

const SYS_KIND: Record<string, string> = {
  wet: "text-info",
  dry: "text-warn",
  preaction: "text-warn",
  deluge: "text-fire",
  antifreeze: "text-info",
  standpipe: "text-muted",
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded bg-surface p-3">
      <div className="tactical-label">{label}</div>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

export function BriefingScreen({
  data,
  fireAlarmDevices = [],
  onDone,
}: {
  data: DummyData;
  fireAlarmDevices?: Device[];
  onDone: () => void;
}) {
  const [accepted, setAccepted] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const notes = data.criticalNotes ?? [];
  const systems = data.systems ?? [];
  const fa = data.fireAlarm;
  const monitoring = data.monitoring ?? [];
  const spaces = data.spaces ?? [];

  const batteryUnits = fireAlarmDevices.flatMap((d) => d.batteries ?? []);
  const totalCells = batteryUnits.reduce((n, b) => n + b.count, 0);
  const dueCells = batteryUnits.reduce((n, b) => n + (b.status !== "ok" ? b.count : 0), 0);

  return (
    <div className="space-y-4">
      <div className="border border-border rounded bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="tactical-label">// Work order</span>
          <span className="text-fire text-[11px] tracking-widest2">WO-2841</span>
        </div>
        <div className="mt-3 text-ink text-[13px] uppercase tracking-wide">{data.site.name}</div>
        <div className="text-faint text-[12px] mt-1">{data.site.address}</div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] tracking-widest2 uppercase">
          <span className="border border-border rounded-sm px-1.5 py-0.5 text-muted">NFPA 25 annual</span>
          <span className="border border-border rounded-sm px-1.5 py-0.5 text-muted">NFPA 10 round</span>
          <span className="border border-border rounded-sm px-1.5 py-0.5 text-muted">ITM yr 2/3</span>
        </div>
        <div className="mt-3 border-t border-border2 pt-3 text-[12px] text-faint">
          {data.inspector.name} · {data.inspector.certs} · {data.inspector.license}
        </div>
      </div>

      {!accepted ? (
        <button
          onClick={() => {
            haptic();
            setAccepted(true);
            onDone();
          }}
          className="w-full bg-fire hover:bg-fire3 active:scale-[0.98] text-white py-3.5 rounded text-[12px] tracking-widest2 uppercase transition-all"
        >
          Accept work order
        </button>
      ) : (
        <div className="animate-fade-up space-y-3">
          <div className="tactical-label">// Pre-load — everything on the phone before wheels roll</div>

          {/* Critical notes — read me first */}
          {notes.length > 0 && (
            <div className="border border-fire rounded bg-fire/5 p-3">
              <div className="text-fire text-[11px] tracking-widest2 uppercase">⚠ Read me first — critical notes</div>
              <div className="mt-2 space-y-2">
                {notes.map((n) => {
                  const s = NOTE_STYLE[n.category] ?? NOTE_STYLE.safety;
                  return (
                    <div key={n.id} className={`border ${s.border} rounded bg-[#0a0e14] p-2`}>
                      <span className={`${s.color} text-[10px] tracking-widest2 uppercase border ${s.border} rounded-sm px-1.5 py-0.5`}>
                        {s.chip}
                      </span>
                      <p className="mt-1.5 text-ink2 text-[12.5px] leading-relaxed font-sans">{n.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sprinkler systems & inspector's-test locations */}
          {systems.length > 0 && (
            <Section label="// Systems & test points — plan the route">
              {systems.map((sys) => (
                <div key={sys.id} className="border border-border2 rounded bg-[#0a0e14] p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ink text-[12px] uppercase tracking-wide">{sys.label}</span>
                    <span className={`${SYS_KIND[sys.kind] ?? "text-muted"} text-[10px] tracking-widest2 uppercase shrink-0`}>
                      {sys.kind}
                      {sys.itcCrew === "two-person" ? " · 2-person" : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-muted text-[12px] leading-snug font-sans">
                    <span className="text-fainter uppercase tracking-widest2 text-[10px]">Inspector&apos;s test:</span>{" "}
                    {sys.itcLocation}
                  </p>
                  {sys.mainDrainLocation && (
                    <p className="mt-1 text-fainter text-[11.5px] leading-snug font-sans">Main drain: {sys.mainDrainLocation}</p>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* Fire-alarm inventory + batteries */}
          {fa && (
            <Section label="// Fire-alarm inventory (NFPA 72)">
              <div className="text-ink2 text-[12.5px] leading-relaxed font-sans">
                <span className="text-fire tracking-widest2">{fa.panelMake} {fa.panelModel}</span> · {fa.panelClass} ·{" "}
                {fa.panelLocation}
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px] tracking-widest2 uppercase">
                <span className="border border-border rounded-sm px-1.5 py-0.5 text-muted">
                  {fa.annunciators.count} annunciators
                </span>
                <span className="border border-border rounded-sm px-1.5 py-0.5 text-muted">{fa.boosters.count} booster</span>
                <span className="border border-border rounded-sm px-1.5 py-0.5 text-muted">radio: {fa.radio.make}</span>
              </div>
              <p className="text-fainter text-[11px] leading-snug font-sans">
                Annunciators: {fa.annunciators.locations.join(" · ")}
              </p>

              {/* Battery inventory rollup — the "load the truck once" view */}
              <div className={`mt-1 rounded border p-2 ${dueCells > 0 ? "border-warn/40 bg-warn/5" : "border-border2 bg-[#0a0e14]"}`}>
                <div className="text-[11px] tracking-widest2 uppercase text-ink2">
                  Batteries: {totalCells} on site ·{" "}
                  <span className={dueCells > 0 ? "text-warn" : "text-pass"}>
                    {dueCells > 0 ? `${dueCells} due this year — loaded` : "none due"}
                  </span>
                </div>
                <div className="mt-1.5 space-y-2">
                  {fireAlarmDevices.map((d) => (
                    <div key={d.id} className="border-t border-border2/60 pt-2 first:border-t-0 first:pt-0">
                      <div className="text-ink text-[11.5px] leading-snug">{d.label}</div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-fainter text-[11px] leading-snug font-sans min-w-0">{d.location}</div>
                        {d.history && <DeviceHistoryPeek history={d.history} batteries={d.batteries} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}

          {/* Monitoring accounts */}
          {monitoring.length > 0 && (
            <Section label="// Monitoring — who to call">
              {monitoring.map((m) => (
                <div key={m.id} className="border border-border2 rounded bg-[#0a0e14] p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-fire text-[12px] tracking-widest2">{m.account}</span>
                    <span className="text-fainter text-[10px] tracking-widest2 uppercase shrink-0">{m.covers}</span>
                  </div>
                  <div className="mt-1 text-muted text-[12px] font-sans">
                    {m.company}
                    {m.signalFormat ? ` · ${m.signalFormat}` : ""}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[12px] -my-1">
                    <a
                      href={`tel:${m.phone.replace(/[^0-9+]/g, "")}`}
                      className="inline-flex items-center min-h-[44px] py-2 text-info underline underline-offset-2"
                    >
                      ☏ {m.phone}
                    </a>
                    {m.passcode && (
                      <span className="text-fainter font-mono">
                        pass: {showPass ? m.passcode : "••••••"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {monitoring.some((m) => m.passcode) && (
                <button
                  onClick={() => setShowPass((v) => !v)}
                  className="inline-flex items-center min-h-[44px] px-1 py-2 -my-1 text-fainter hover:text-ink text-[10px] tracking-widest2 uppercase underline underline-offset-2"
                >
                  {showPass ? "hide passcodes" : "reveal passcodes"}
                </button>
              )}
            </Section>
          )}

          {/* Retail / occupancy spaces */}
          {spaces.length > 0 && (
            <Section label="// Spaces — retail & occupancy">
              {spaces.map((sp) => (
                <div key={sp.id} className="border border-border2 rounded bg-[#0a0e14] p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ink text-[12px] tracking-wide">{sp.name}</span>
                    <span className="text-fainter text-[10px] tracking-widest2 uppercase shrink-0">{sp.kind}</span>
                  </div>
                  <div className="mt-1 text-muted text-[12px] font-sans">
                    {sp.hours}
                    {sp.contact ? ` · ${sp.contact}` : ""}
                  </div>
                  {sp.access && <p className="mt-1 text-fainter text-[11.5px] leading-snug font-sans">{sp.access}</p>}
                </div>
              ))}
            </Section>
          )}

          <p className="text-fainter text-[11px] leading-relaxed font-sans px-1">
            Any tech, any truck — the panel type, the batteries due, the test-point locations, the monitoring numbers,
            and the property-damage warnings ride to the phone. Nothing printed, nothing re-keyed.
          </p>
        </div>
      )}
    </div>
  );
}
