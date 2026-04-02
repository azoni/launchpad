"use client";

interface SwipeControlsProps {
  onLeft: () => void;
  onRight: () => void;
  onSuperlike: () => void;
}

export function SwipeControls({
  onLeft,
  onRight,
  onSuperlike,
}: SwipeControlsProps) {
  return (
    <div className="flex justify-center gap-5 py-4">
      <button
        onClick={onLeft}
        className="w-16 h-16 rounded-full bg-white border-3 border-destructive text-destructive flex items-center justify-center text-2xl font-heading shadow-[3px_3px_0px_#EF4444] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#EF4444] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
        aria-label="Dislike"
      >
        ✕
      </button>
      <button
        onClick={onSuperlike}
        className="w-16 h-16 rounded-full bg-white border-3 border-candy-purple text-candy-purple flex items-center justify-center text-2xl font-heading shadow-[3px_3px_0px_#A78BFA] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#A78BFA] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
        aria-label="Super like"
      >
        ★
      </button>
      <button
        onClick={onRight}
        className="w-16 h-16 rounded-full bg-white border-3 border-candy-green text-candy-green flex items-center justify-center text-2xl font-heading shadow-[3px_3px_0px_#6BCB77] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#6BCB77] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
        aria-label="Like"
      >
        ♥
      </button>
    </div>
  );
}
