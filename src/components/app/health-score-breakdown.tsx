import type {
  CompanySummary,
  HealthScoreBreakdown as HealthScoreBreakdownData,
} from "@/features/demo/pulseops-demo-data";

type HealthScoreBreakdownProps = {
  breakdown: HealthScoreBreakdownData;
  scoreSource: CompanySummary["healthScoreSource"];
  surface?: "dark" | "light";
};

const scoreParts = [
  {
    key: "recentActivityPoints",
    label: "Recency",
    max: 40,
    tone: "bg-[var(--cyan)]",
  },
  {
    key: "frequencyPoints",
    label: "Frequency",
    max: 25,
    tone: "bg-[var(--mint)]",
  },
  {
    key: "funnelPoints",
    label: "Funnel",
    max: 20,
    tone: "bg-[var(--amber)]",
  },
  {
    key: "keyEventPoints",
    label: "Key events",
    max: 15,
    tone: "bg-[var(--coral)]",
  },
] as const;

export function HealthScoreBreakdown({
  breakdown,
  scoreSource,
  surface = "light",
}: HealthScoreBreakdownProps) {
  const isDark = surface === "dark";
  const borderClass = isDark
    ? "border-[rgba(244,241,232,0.14)]"
    : "border-[rgba(17,20,15,0.12)]";
  const mutedClass = isDark
    ? "text-[rgba(244,241,232,0.58)]"
    : "text-[var(--muted)]";
  const railClass = isDark ? "bg-[rgba(244,241,232,0.1)]" : "bg-[rgba(17,20,15,0.08)]";

  return (
    <div className={`mt-4 border ${borderClass} p-3`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`font-mono text-xs uppercase ${mutedClass}`}>
          Score components
        </p>
        <p className={`font-mono text-xs uppercase ${mutedClass}`}>
          {scoreSource}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(112px,1fr))] gap-3">
        {scoreParts.map((part) => {
          const points = breakdown[part.key];
          const width = Math.round((Math.min(points, part.max) / part.max) * 100);

          return (
            <div key={part.key}>
              <div className="flex items-center justify-between gap-2">
                <span className={`whitespace-nowrap text-xs ${mutedClass}`}>
                  {part.label}
                </span>
                <span className="font-mono text-xs">
                  {points}/{part.max}
                </span>
              </div>
              <div className={`mt-2 h-1.5 ${railClass}`}>
                <div
                  className={`h-full ${part.tone}`}
                  style={{
                    width: `${width}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
