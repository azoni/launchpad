"use client";
import { useEffect, useRef, useState } from "react";
import type { Device } from "@/lib/demo/types";
import { haptic } from "@/lib/haptics";

/**
 * NFPA 72 beat: the fire-alarm panel is right beside the sprinkler riser, so while the
 * account is already on test we run it — load-test the standby batteries under the panel's
 * load and walk-test a device to the annunciators + central station. The pre-loaded, overdue
 * radio battery sags under load and becomes the run's SECOND deficiency (logged online, so it
 * syncs on the spot — the contrast with the offline garage head).
 */
export function FireAlarmScreen({
  devices,
  onDeficiency,
  onDone,
}: {
  devices: Device[];
  onDeficiency: () => void;
  onDone: () => void;
}) {
  const [tested, setTested] = useState<Record<string, "pass" | "fail">>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);
  const [walk, setWalk] = useState<"idle" | "running" | "done">("idle");
  const finished = useRef(false);

  const failDevice = devices.find((d) => d.batteries?.[0]?.status === "overdue");
  const allTested = devices.length > 0 && devices.every((d) => tested[d.id]);
  const needsLog = !!failDevice;
  const complete = allTested && (!needsLog || logged) && walk === "done";

  useEffect(() => {
    if (complete && !finished.current) {
      finished.current = true;
      setTimeout(onDone, 350);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  const runTest = (d: Device) => {
    if (tested[d.id] || testing) return;
    haptic();
    setTesting(d.id);
    const fail = d.batteries?.[0]?.status === "overdue";
    setTimeout(() => {
      setTesting(null);
      setTested((m) => ({ ...m, [d.id]: fail ? "fail" : "pass" }));
      haptic(fail ? 40 : 15);
    }, 650);
  };

  const startWalk = () => {
    haptic();
    setWalk("running");
    setTimeout(() => {
      setWalk("done");
      haptic(25);
    }, 1400);
  };

  return (
    <div className="space-y-3">
      {/* Panel display */}
      <div className="border border-pass/30 rounded bg-[#0a0e14] p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-ink text-[12px] uppercase tracking-wide">◉ Notifier NFS2-3030</span>
          <span className="text-pass text-[11px] tracking-widest2 uppercase animate-soft-pulse">System normal</span>
        </div>
        <p className="mt-1 text-fainter text-[11.5px] leading-snug font-sans">
          No active alarms · no troubles · AC power good. On test — flow &amp; alarm signals held at central station.
        </p>
      </div>

      {/* Battery load-test */}
      <div>
        <div className="tactical-label mb-1.5">// Standby battery load-test</div>
        <div className="space-y-1.5">
          {devices.map((d) => {
            const b = d.batteries?.[0];
            const result = tested[d.id];
            const isTesting = testing === d.id;
            return (
              <div
                key={d.id}
                className={`border rounded bg-surface p-2.5 ${
                  result === "fail" ? "border-fire/50" : result === "pass" ? "border-pass/40" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-ink text-[12px] leading-snug">{d.label}</div>
                    {b && (
                      <div className="text-fainter text-[11px] leading-snug font-sans">
                        {b.count}× {b.voltage}V {b.ampHours}Ah · in since {b.installed}
                        {b.status === "overdue" ? " · overdue" : b.status === "due-soon" ? " · due" : ""}
                      </div>
                    )}
                  </div>
                  {!result && (
                    <button
                      disabled={isTesting || !!testing}
                      onClick={() => runTest(d)}
                      className="shrink-0 min-h-[44px] border border-fire text-fire text-[11px] tracking-widest2 uppercase rounded px-3 py-1.5 disabled:opacity-40 active:scale-[0.98] transition-transform"
                    >
                      {isTesting ? "Testing…" : "Load-test"}
                    </button>
                  )}
                </div>
                {result === "pass" && (
                  <div className="mt-1.5 text-pass text-[11.5px] tracking-widest2 uppercase">
                    ✓ {b && b.count === 2 ? "24.2 V" : "13.1 V"} holds under load
                  </div>
                )}
                {result === "fail" && (
                  <div className="mt-1.5 text-fire text-[11.5px] tracking-widest2 uppercase">
                    ✕ Sags to 10.4 V — won&apos;t carry the panel
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* The second deficiency — logged online, syncs on the spot */}
      {failDevice && tested[failDevice.id] === "fail" && (
        <div className="border border-fire rounded bg-fire/5 p-3 animate-fade-up">
          {!logged ? (
            <>
              <div className="text-fire text-[11px] tracking-widest2 uppercase">⚠ Deficiency — {failDevice.id} backup battery</div>
              <p className="mt-1.5 text-ink2 text-[12.5px] leading-relaxed font-sans">
                Failed load test — the communicator can&apos;t run on secondary power. A 5-yr-old 12V 8Ah that read fine
                on the gauge and collapsed the moment it was asked to work.
              </p>
              <button
                onClick={() => {
                  haptic(20);
                  onDeficiency();
                  setLogged(true);
                }}
                className="mt-2.5 w-full bg-fire hover:bg-fire3 active:scale-[0.98] text-white py-3 rounded text-[12px] tracking-widest2 uppercase transition-all"
              >
                Log deficiency + order the battery →
              </button>
            </>
          ) : (
            <div className="text-pass text-[12px] tracking-widest2 uppercase leading-snug">
              ✓ Logged · synced to the office on the spot — signal&apos;s good up here, so it&apos;s already a priced
              line item.
            </div>
          )}
        </div>
      )}

      {/* Walk-test — after the batteries are tested AND any failed battery is logged, so the
          step can never reach a walk-test-done-but-not-complete dead state. */}
      {allTested && (!needsLog || logged) && (
        <div className="border border-border2 rounded bg-[#0a0e14] p-3 animate-fade-up">
          <div className="tactical-label">// Walk-test</div>
          {walk === "idle" && (
            <button
              onClick={startWalk}
              className="mt-2 w-full border border-fire bg-fire text-white py-3 rounded text-[12px] tracking-widest2 uppercase active:scale-[0.98]"
            >
              Trigger the lobby pull station
            </button>
          )}
          {walk === "running" && (
            <p className="mt-2 text-warn text-[12px] tracking-widest2 uppercase animate-soft-pulse">
              ▸ Pull station 1 active · annunciating at the panel + lobby &amp; B1 annunciators…
            </p>
          )}
          {walk === "done" && (
            <p className="mt-2 text-pass text-[12px] tracking-widest2 uppercase animate-fade-up">
              ● Central station confirms alarm — acct 4471-ME. Reset &amp; restored.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
