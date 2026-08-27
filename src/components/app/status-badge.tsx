import type { HealthStatus } from "@/features/demo/pulseops-demo-data";

const statusLabels: Record<HealthStatus, string> = {
  healthy: "Healthy",
  watch: "Watch",
  at_risk: "At risk",
  silent: "Silent",
};

const statusClasses: Record<HealthStatus, string> = {
  healthy: "border-[rgba(185,255,74,0.58)] text-[#447000]",
  watch: "border-[rgba(255,183,44,0.6)] text-[#8a5a00]",
  at_risk: "border-[rgba(255,79,123,0.58)] text-[#a01843]",
  silent: "border-[rgba(23,18,26,0.24)] text-[var(--muted)]",
};

const darkStatusClasses: Record<HealthStatus, string> = {
  healthy: "border-[rgba(185,255,74,0.5)] text-[var(--mint)]",
  watch: "border-[rgba(255,183,44,0.58)] text-[var(--amber)]",
  at_risk: "border-[rgba(255,79,123,0.55)] text-[var(--coral)]",
  silent: "border-[rgba(247,248,239,0.24)] text-[rgba(247,248,239,0.72)]",
};

export function StatusBadge({
  status,
  surface = "light",
}: {
  status: HealthStatus;
  surface?: "dark" | "light";
}) {
  const classes = surface === "dark" ? darkStatusClasses : statusClasses;

  return (
    <span
      className={`inline-flex whitespace-nowrap border px-2 py-1 font-mono text-xs uppercase ${classes[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
