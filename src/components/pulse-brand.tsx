import { Activity } from "lucide-react";
import Link from "next/link";

type PulseBrandTone = "onDark" | "onLight";

type PulseBrandProps = {
  className?: string;
  compact?: boolean;
  href?: string;
  subtitle?: string;
  tone?: PulseBrandTone;
};

const brandToneClasses: Record<
  PulseBrandTone,
  {
    icon: string;
    subtitle: string;
    title: string;
  }
> = {
  onDark: {
    icon: "border-[rgba(34,223,197,0.66)] bg-[rgba(34,223,197,0.08)] text-[var(--signal)] shadow-[0_0_28px_rgba(34,223,197,0.14)]",
    subtitle: "text-[rgba(247,248,239,0.5)]",
    title: "text-[var(--paper)]",
  },
  onLight: {
    icon: "border-[rgba(34,223,197,0.5)] bg-[rgba(34,223,197,0.1)] text-[var(--signal)] shadow-[0_0_22px_rgba(34,223,197,0.1)]",
    subtitle: "text-[var(--muted)]",
    title: "text-[var(--ink)]",
  },
};

export function PulseBrand({
  className = "",
  compact = false,
  href = "/",
  subtitle = "Signal observatory",
  tone = "onDark",
}: PulseBrandProps) {
  const classes = brandToneClasses[tone];
  const iconSize = compact ? 36 : 40;

  return (
    <Link
      aria-label="PulseOps home"
      className={`inline-flex min-w-0 items-center gap-3 ${className}`}
      href={href}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] border ${classes.icon}`}
        style={{ height: iconSize, width: iconSize }}
      >
        <Activity size={compact ? 16 : 18} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 leading-none">
        <span
          className={`block font-mono text-sm font-semibold uppercase tracking-normal ${classes.title}`}
        >
          PulseOps
        </span>
        {subtitle ? (
          <span
            className={`mt-1.5 block truncate font-mono text-[10px] uppercase tracking-normal ${classes.subtitle}`}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
