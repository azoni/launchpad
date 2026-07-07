"use client";
import { useState } from "react";
import { haptic } from "@/lib/haptics";

/** stylized corroded pendent sprinkler head, drawn in-theme */
export function CorrodedHead({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-label="Corroded pendent sprinkler head, Row C stall 7">
      {/* ceiling */}
      <rect x="0" y="0" width="200" height="18" fill="#131b28" />
      <rect x="0" y="16" width="200" height="3" fill="#1a2535" />
      {/* escutcheon */}
      <ellipse cx="100" cy="24" rx="26" ry="6" fill="#22303f" stroke="#2c3b4d" />
      {/* drop nipple */}
      <rect x="94" y="24" width="12" height="22" fill="#3a4a5c" />
      <rect x="94" y="30" width="12" height="4" fill="#7a4a28" opacity="0.8" />
      {/* frame arms */}
      <path d="M88 46 L100 96 L112 46 Z" fill="none" stroke="#5a4632" strokeWidth="7" />
      <path d="M88 46 L100 96 L112 46" fill="none" stroke="#8a5a30" strokeWidth="3" opacity="0.7" />
      {/* bulb */}
      <ellipse cx="100" cy="66" rx="5" ry="12" fill="#a03a20" opacity="0.85" />
      {/* deflector — corroded */}
      <rect x="80" y="96" width="40" height="6" rx="2" fill="#6a4a2a" />
      <path d="M80 99 h40" stroke="#8a5a30" strokeWidth="2" strokeDasharray="3 2" />
      {/* corrosion blotches + loading */}
      <circle cx="90" cy="52" r="5" fill="#7a4520" opacity="0.75" />
      <circle cx="109" cy="58" r="4" fill="#8a5028" opacity="0.7" />
      <circle cx="97" cy="88" r="6" fill="#5f3d20" opacity="0.8" />
      <circle cx="112" cy="97" r="4" fill="#7a4520" opacity="0.75" />
      <circle cx="85" cy="99" r="3.5" fill="#8a5028" opacity="0.7" />
      {/* exhaust residue drips */}
      <path d="M84 102 q2 8 0 14 M100 104 q2 10 0 18 M116 102 q2 7 0 12" stroke="#4a3018" strokeWidth="2.5" opacity="0.55" fill="none" />
    </svg>
  );
}

export function CameraScreen({ onCaptured, onDone }: { onCaptured: () => void; onDone: () => void }) {
  const [phase, setPhase] = useState<"framing" | "flash" | "queued">("framing");

  const shoot = () => {
    if (phase !== "framing") return;
    haptic(30);
    setPhase("flash");
    setTimeout(() => {
      setPhase("queued");
      onCaptured();
      onDone();
    }, 450);
  };

  return (
    <div className="space-y-3">
      <div className="relative border border-border rounded overflow-hidden bg-[#05080c]">
        <CorrodedHead className="w-full" />
        {/* viewfinder chrome */}
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-fire" />
          <span className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-fire" />
          <span className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-fire" />
          <span className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-fire" />
          <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[9px] tracking-widest2 text-fire uppercase">
            HEAD-B1-C7 · WO-2841
          </span>
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] tracking-widest2 text-warn uppercase">
            ⚠ No signal — local capture
          </span>
        </div>
        {phase === "flash" && <div className="absolute inset-0 bg-white/80" />}
      </div>

      {phase !== "queued" ? (
        <div className="flex justify-center py-1">
          <button
            onClick={shoot}
            aria-label="Shutter"
            className="w-16 h-16 rounded-full border-4 border-ink bg-surface active:scale-90 transition-transform flex items-center justify-center"
          >
            <span className="w-11 h-11 rounded-full bg-fire" />
          </button>
        </div>
      ) : (
        <div className="animate-fade-up border border-warn/50 rounded bg-warn/5 p-3 flex items-center gap-3">
          <CorrodedHead className="w-12 shrink-0 border border-border rounded-sm" />
          <div>
            <div className="text-warn text-[10px] tracking-widest2 uppercase">⬆ 1 unsynced — committed to local queue</div>
            <p className="text-faint text-[10px] mt-1 leading-relaxed">
              Bound to HEAD-B1-C7 · WO-2841. On disk before any network call. Survives app kill, reboot, and this garage.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
