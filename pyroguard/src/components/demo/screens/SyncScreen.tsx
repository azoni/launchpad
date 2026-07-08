"use client";
import { useEffect, useState } from "react";
import { haptic } from "@/lib/haptics";

const QUEUE = [
  "PHOTO — HEAD-B1-C7 corrosion",
  "FINDING — critical deficiency, Row C",
  "VLV-B1-SECT — pass record",
  "FE-B1-02 — annual maintenance record",
];

export function SyncScreen({
  onDrain,
  onDone,
}: {
  /** called once per queue item as it syncs, to tick the HUD badge down */
  onDrain: () => void;
  onDone: () => void;
}) {
  const [synced, setSynced] = useState(0);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    if (synced >= QUEUE.length) return;
    const t = setTimeout(() => {
      setSynced((n) => n + 1);
      onDrain();
      haptic(10);
    }, 650);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synced]);

  const allSynced = synced >= QUEUE.length;

  return (
    <div className="space-y-3">
      <div className="border border-border rounded bg-surface p-3">
        <div className="flex items-center justify-between">
          <span className="tactical-label">// Local queue</span>
          <span className={`text-[10px] tracking-widest2 uppercase ${allSynced ? "text-pass" : "text-warn animate-soft-pulse"}`}>
            {allSynced ? "✓ All records synced" : `⬆ Draining ${QUEUE.length - synced} …`}
          </span>
        </div>
        <div className="mt-3 space-y-1.5">
          {QUEUE.map((item, i) => {
            const isSynced = i < synced;
            return (
              <div
                key={item}
                className={`px-2 py-1.5 rounded-sm text-[10px] border transition-colors ${
                  isSynced ? "border-pass/30 text-pass" : "border-border2 text-muted"
                }`}
              >
                {isSynced ? "✓" : "⬆"} {item}
                {isSynced && <span className="text-fainter"> — on office dashboard</span>}
              </div>
            );
          })}
        </div>
      </div>

      {allSynced && !restored && (
        <button
          onClick={() => {
            haptic();
            setRestored(true);
            onDone();
          }}
          className="w-full animate-fade-up bg-fire hover:bg-fire3 active:scale-[0.98] text-white py-3.5 rounded text-[12px] tracking-widest2 uppercase transition-all"
        >
          ☎ Restore account — OFF TEST
        </button>
      )}
      {restored && (
        <div className="animate-fade-up border border-pass/40 rounded bg-pass/5 p-3">
          <span className="text-pass text-[10px] tracking-widest2 uppercase">✓ 4471-ME off test 1132 — dispatcher confirmed</span>
          <p className="text-faint text-[10px] mt-1 leading-relaxed">
            Logged next to the morning&apos;s on-test entry. Window closed — nobody&apos;s real alarms get ignored on your account.
          </p>
        </div>
      )}
    </div>
  );
}
