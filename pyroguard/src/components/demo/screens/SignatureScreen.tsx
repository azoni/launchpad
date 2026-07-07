"use client";
import { useState } from "react";
import type { DummyData } from "@/lib/demo/types";
import { SignaturePad } from "@/components/demo/SignaturePad";
import { CorrodedHead } from "@/components/demo/screens/CameraScreen";
import { haptic } from "@/lib/haptics";

export function SignatureScreen({ data, onDone }: { data: DummyData; onDone: () => void }) {
  const [signed, setSigned] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="space-y-3">
      <div className="border border-border rounded bg-surface p-3">
        <div className="tactical-label mb-2">// Findings summary — WO-2841</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="border border-border2 rounded-sm py-2">
            <div className="text-ink text-lg tabular-nums">11</div>
            <div className="text-fainter text-[8px] tracking-widest2 uppercase">Devices</div>
          </div>
          <div className="border border-pass/30 rounded-sm py-2">
            <div className="text-pass text-lg tabular-nums">10</div>
            <div className="text-fainter text-[8px] tracking-widest2 uppercase">Passed</div>
          </div>
          <div className="border border-fire/40 rounded-sm py-2">
            <div className="text-fire text-lg tabular-nums">1</div>
            <div className="text-fainter text-[8px] tracking-widest2 uppercase">Critical</div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 border border-border2 rounded-sm p-2">
          <CorrodedHead className="w-10 shrink-0 rounded-sm border border-border" />
          <p className="text-muted text-[10px] leading-relaxed">
            HEAD-B1-C7 — corroded, loaded pendent head (+2 adjacent). Critical deficiency. Replacement recommended.
          </p>
        </div>
      </div>

      <div>
        <div className="tactical-label mb-2">
          // {data.customer.name} — {data.customer.role}
        </div>
        <SignaturePad onSigned={setSigned} disabled={confirmed} />
      </div>

      {!confirmed ? (
        <button
          disabled={!signed}
          onClick={() => {
            haptic();
            setConfirmed(true);
            onDone();
          }}
          className={`w-full py-3.5 rounded text-[12px] tracking-widest2 uppercase transition-all ${
            signed ? "bg-fire hover:bg-fire3 active:scale-[0.98] text-white" : "border border-border2 text-fainter"
          }`}
        >
          Confirm — lock to report
        </button>
      ) : (
        <div className="animate-fade-up border border-pass/40 rounded bg-pass/5 p-3">
          <span className="text-pass text-[10px] tracking-widest2 uppercase">
            ✓ Signed — {data.customer.name}, 1141 · bound to WO-2841
          </span>
        </div>
      )}
    </div>
  );
}
