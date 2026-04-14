// Visual pipeline progress indicator. Shows each stage with a progress bar
// and live status text.

const STAGES = [
  { key: "parsing", label: "Parsing CSV", icon: "1" },
  { key: "saving", label: "Saving raw rows", icon: "2" },
  { key: "fetching", label: "Fetching on-chain", icon: "1" },
  { key: "importing", label: "Importing rows", icon: "2" },
  { key: "normalizing", label: "Normalizing", icon: "3" },
  { key: "pricing", label: "Looking up prices", icon: "4" },
  { key: "classifying", label: "Classifying & matching", icon: "5" },
  { key: "fifo", label: "Running FIFO engine", icon: "6" },
  { key: "review", label: "Building review queue", icon: "7" },
  { key: "persisting", label: "Saving results", icon: "8" },
] as const;

export type PipelineStage =
  | "idle"
  | "parsing"
  | "saving"
  | "fetching"
  | "importing"
  | "running_pipeline"
  | "done"
  | "error";

// Map high-level status to which stages are complete
function stageProgress(status: PipelineStage, mode: "csv" | "fetch"): {
  completed: string[];
  active: string | null;
} {
  const csvStages = ["parsing", "saving", "normalizing", "pricing", "classifying", "fifo", "review", "persisting"];
  const fetchStages = ["fetching", "importing", "normalizing", "pricing", "classifying", "fifo", "review", "persisting"];
  const stages = mode === "csv" ? csvStages : fetchStages;

  if (status === "idle") return { completed: [], active: null };
  if (status === "done") return { completed: stages, active: null };
  if (status === "error") return { completed: [], active: null };

  if (status === "parsing") return { completed: [], active: "parsing" };
  if (status === "saving") return { completed: ["parsing"], active: "saving" };
  if (status === "fetching") return { completed: [], active: "fetching" };
  if (status === "importing") return { completed: ["fetching"], active: "importing" };
  if (status === "running_pipeline") {
    const before = mode === "csv" ? ["parsing", "saving"] : ["fetching", "importing"];
    return { completed: before, active: "normalizing" };
  }

  return { completed: [], active: null };
}

export function PipelineProgress({
  status,
  mode,
  detail,
}: {
  status: PipelineStage;
  mode: "csv" | "fetch";
  detail?: string | null;
}) {
  if (status === "idle") return null;

  const { completed, active } = stageProgress(status, mode);
  const relevantStages = STAGES.filter((s) => {
    if (mode === "csv") return !["fetching", "importing"].includes(s.key);
    return !["parsing", "saving"].includes(s.key);
  });

  const totalStages = relevantStages.length;
  const completedCount = completed.length;
  const pct = status === "done"
    ? 100
    : status === "error"
    ? 0
    : Math.round(((completedCount + 0.5) / totalStages) * 100);

  return (
    <div className="mt-3 space-y-2">
      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-sm border border-[color:var(--color-rule)] bg-[color:var(--color-paper)]">
        <div
          className={`h-full transition-all duration-500 ${
            status === "error"
              ? "bg-[color:var(--color-stamp)]"
              : status === "done"
              ? "bg-[color:var(--color-mint)]"
              : "bg-[color:var(--color-ink)]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Stage indicators */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {relevantStages.map((stage) => {
          const isDone = completed.includes(stage.key);
          const isActive = active === stage.key;
          return (
            <div
              key={stage.key}
              className={`flex items-center gap-1 text-[10px] transition-opacity ${
                isDone
                  ? "text-[color:var(--color-mint)] opacity-100"
                  : isActive
                  ? "text-[color:var(--color-ink)] opacity-100 font-semibold"
                  : "text-[color:var(--color-ink-faint)] opacity-40"
              }`}
            >
              {isDone ? "✓" : isActive ? "›" : "○"}
              <span>{stage.label}</span>
              {isActive && (
                <span className="inline-block animate-pulse">…</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail text */}
      {detail && (
        <div className="text-xs text-[color:var(--color-ink-soft)]">{detail}</div>
      )}
    </div>
  );
}
