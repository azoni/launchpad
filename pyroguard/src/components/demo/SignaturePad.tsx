"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/haptics";

export function SignaturePad({ onSigned, disabled = false }: { onSigned: (signed: boolean) => void; disabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#e0e8f0";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drawing.current = true;
      const ctx = e.currentTarget.getContext("2d");
      if (!ctx) return;
      const { x, y } = pos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      // A single tap counts as ink — lay down a dot so Confirm enables without a full stroke.
      ctx.lineTo(x + 0.1, y + 0.1);
      ctx.stroke();
      if (!hasInk.current) {
        hasInk.current = true;
        setSigned(true);
        onSigned(true);
      }
    },
    [disabled, onSigned]
  );

  const move = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawing.current) return;
      const ctx = e.currentTarget.getContext("2d");
      if (!ctx) return;
      const { x, y } = pos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
      if (!hasInk.current) {
        hasInk.current = true;
        setSigned(true);
        onSigned(true);
      }
    },
    [onSigned]
  );

  const end = useCallback(() => {
    drawing.current = false;
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    setSigned(false);
    onSigned(false);
    haptic(10);
  }, [onSigned]);

  return (
    <div>
      <div className="relative border border-border rounded bg-surface">
        <canvas
          ref={canvasRef}
          className="w-full h-40 touch-none rounded"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
        />
        {!signed && (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none text-fainter text-[11px] tracking-widest2 uppercase">
            Sign here
          </span>
        )}
        <span className="absolute bottom-2 left-3 right-3 border-t border-border2 pointer-events-none" />
      </div>
      {!disabled && (
        <div className="mt-2 flex justify-end">
          <button onClick={clear} className="text-faint hover:text-ink text-[12px] tracking-widest2 uppercase">
            ✕ Clear
          </button>
        </div>
      )}
    </div>
  );
}
