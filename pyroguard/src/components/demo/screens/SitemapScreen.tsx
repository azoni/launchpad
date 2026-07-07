"use client";
import { useState } from "react";
import type { Floor } from "@/lib/demo/types";
import { haptic } from "@/lib/haptics";

type Pin = { id: string; x: number; y: number; label: string };

/** stylized blueprint per floor — viewBox 0 0 320 210 */
const FLOOR_PLANS: Record<string, { rooms: { x: number; y: number; w: number; h: number; label: string }[]; pins: Pin[] }> = {
  L3: {
    rooms: [
      { x: 12, y: 12, w: 296, h: 60, label: "EAST CORRIDOR" },
      { x: 12, y: 84, w: 212, h: 114, label: "OPEN OFFICE" },
      { x: 236, y: 84, w: 72, h: 114, label: "ELEC / IT" },
    ],
    pins: [
      { id: "HEADS-L3", x: 118, y: 140, label: "HEADS" },
      { id: "FE-L3-04", x: 288, y: 42, label: "FE-L3-04" },
    ],
  },
  L1: {
    rooms: [
      { x: 12, y: 12, w: 60, h: 186, label: "WESTERN AVE" },
      { x: 84, y: 12, w: 224, h: 96, label: "LOBBY" },
      { x: 84, y: 120, w: 130, h: 78, label: "SVC CORRIDOR" },
      { x: 226, y: 120, w: 82, h: 78, label: "RISER ROOM" },
    ],
    pins: [
      { id: "PIV-1", x: 42, y: 60, label: "PIV" },
      { id: "FDC-1", x: 42, y: 150, label: "FDC" },
      { id: "FE-L1-01", x: 120, y: 50, label: "FE-L1-01" },
      { id: "RISER", x: 267, y: 158, label: "RISER RM" },
    ],
  },
  B1: {
    rooms: [
      { x: 12, y: 12, w: 90, h: 186, label: "RAMP" },
      { x: 114, y: 12, w: 194, h: 120, label: "ROW C STALLS" },
      { x: 114, y: 144, w: 194, h: 54, label: "ELEV LOBBY" },
    ],
    pins: [
      { id: "VLV-B1-SECT", x: 57, y: 60, label: "VLV" },
      { id: "HEAD-B1-C7", x: 220, y: 70, label: "C7" },
      { id: "FE-B1-02", x: 270, y: 170, label: "FE-B1-02" },
    ],
  },
};

export function SitemapScreen({
  floors,
  mode,
  onDone,
  onWentOffline,
}: {
  floors: Floor[];
  /** "orient" = tap the riser pin on L1; "descend" = tap B1 tab, lose signal */
  mode: "orient" | "descend";
  onDone: () => void;
  onWentOffline?: () => void;
}) {
  const [floorId, setFloorId] = useState(mode === "orient" ? "L1" : "L3");
  const [offlineBanner, setOfflineBanner] = useState(false);
  const [done, setDone] = useState(false);
  const plan = FLOOR_PLANS[floorId];
  const targetPin = mode === "orient" ? "RISER" : null;

  const pickFloor = (id: string) => {
    haptic(10);
    setFloorId(id);
    if (mode === "descend" && id === "B1" && !done) {
      setDone(true);
      setTimeout(() => {
        setOfflineBanner(true);
        onWentOffline?.();
        haptic(40);
        setTimeout(onDone, 900);
      }, 800);
    }
  };

  const tapPin = (id: string) => {
    if (mode === "orient" && id === targetPin && !done) {
      haptic();
      setDone(true);
      onDone();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {floors.map((f) => {
          const active = f.id === floorId;
          const pulse = mode === "descend" && f.id === "B1" && !done;
          return (
            <button
              key={f.id}
              onClick={() => pickFloor(f.id)}
              className={`flex-1 py-2.5 rounded-sm text-[10px] tracking-widest2 uppercase border transition-colors ${
                active ? "border-fire text-fire bg-fire/5" : "border-border text-faint hover:text-ink"
              } ${pulse ? "animate-soft-pulse border-warn text-warn" : ""}`}
            >
              {f.id}
            </button>
          );
        })}
      </div>

      <div className="relative border border-border rounded bg-[#0a0e14] grid-bg overflow-hidden">
        <svg viewBox="0 0 320 210" className="w-full">
          {plan.rooms.map((r) => (
            <g key={r.label}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="rgba(13,20,32,0.6)" stroke="#1a2535" strokeWidth="1.5" />
              <text x={r.x + 6} y={r.y + 14} fill="#334" fontSize="8" letterSpacing="1.5" fontFamily="inherit">
                {r.label}
              </text>
            </g>
          ))}
          {plan.pins.map((p) => {
            const isTarget = p.id === targetPin;
            return (
              <g key={p.id} onClick={() => tapPin(p.id)} className={isTarget ? "cursor-pointer" : ""}>
                {/* invisible thumb-size hit area — the visible pin alone is ~12px */}
                {isTarget && <circle cx={p.x} cy={p.y} r="24" fill="transparent" />}
                {isTarget && <circle cx={p.x} cy={p.y} r="14" fill="none" stroke="#ff4500" strokeWidth="1" className="animate-soft-pulse" />}
                <circle cx={p.x} cy={p.y} r="5" fill={isTarget ? "#ff4500" : "#0d1420"} stroke={isTarget ? "#ff7a00" : "#556"} strokeWidth="1.5" />
                <text x={p.x} y={p.y - 10} fill={isTarget ? "#ff7a00" : "#556"} fontSize="7" textAnchor="middle" letterSpacing="1" fontFamily="inherit">
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
        {offlineBanner && (
          <div className="absolute inset-x-0 bottom-0 bg-warn/10 border-t border-warn/50 px-3 py-2 animate-fade-up">
            <span className="text-warn text-[10px] tracking-widest2 uppercase">⚠ Offline mode — all work saved locally</span>
          </div>
        )}
      </div>

      {mode === "orient" && !done && (
        <p className="text-faint text-[10px] tracking-widest2 uppercase text-center animate-soft-pulse">▸ Tap the riser room pin on L1</p>
      )}
      {mode === "descend" && !done && (
        <p className="text-faint text-[10px] tracking-widest2 uppercase text-center animate-soft-pulse">▸ Take the elevator — tap B1</p>
      )}
    </div>
  );
}
