import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import type { RecentEvent } from "@/features/demo/pulseops-demo-data";

export type SignalTone =
  | "critical"
  | "healthy"
  | "neutral"
  | "signal"
  | "silent"
  | "warning";

export type TraceVariant = "degrading" | "rising" | "silent" | "steady";

const toneClasses: Record<
  SignalTone,
  {
    accent: string;
    border: string;
    dot: string;
    soft: string;
    text: string;
    trace: string;
  }
> = {
  critical: {
    accent: "bg-[var(--critical)]",
    border: "border-[rgba(255,79,123,0.28)]",
    dot: "bg-[var(--critical)] shadow-[0_0_0_4px_rgba(255,79,123,0.1)]",
    soft: "bg-[rgba(255,79,123,0.08)]",
    text: "text-[var(--critical-ink)]",
    trace: "var(--critical)",
  },
  healthy: {
    accent: "bg-[var(--healthy)]",
    border: "border-[rgba(185,255,74,0.32)]",
    dot: "bg-[var(--healthy)] shadow-[0_0_0_4px_rgba(185,255,74,0.13)]",
    soft: "bg-[rgba(185,255,74,0.11)]",
    text: "text-[var(--healthy-ink)]",
    trace: "var(--healthy)",
  },
  neutral: {
    accent: "bg-[var(--muted)]",
    border: "border-[var(--border-soft)]",
    dot: "bg-[var(--muted)] shadow-[0_0_0_4px_rgba(98,108,108,0.1)]",
    soft: "bg-white/60",
    text: "text-[var(--muted)]",
    trace: "var(--muted)",
  },
  signal: {
    accent: "bg-[var(--signal)]",
    border: "border-[rgba(34,223,197,0.32)]",
    dot: "bg-[var(--signal)] shadow-[0_0_0_4px_rgba(34,223,197,0.12)]",
    soft: "bg-[rgba(34,223,197,0.09)]",
    text: "text-[#08776e]",
    trace: "var(--signal)",
  },
  silent: {
    accent: "bg-[var(--silent)]",
    border: "border-[rgba(116,123,136,0.32)]",
    dot: "bg-[var(--silent)] shadow-[0_0_0_4px_rgba(116,123,136,0.1)]",
    soft: "bg-[rgba(116,123,136,0.09)]",
    text: "text-[var(--silent)]",
    trace: "var(--silent)",
  },
  warning: {
    accent: "bg-[var(--warning)]",
    border: "border-[rgba(255,183,44,0.36)]",
    dot: "bg-[var(--warning)] shadow-[0_0_0_4px_rgba(255,183,44,0.12)]",
    soft: "bg-[rgba(255,183,44,0.1)]",
    text: "text-[var(--warning-ink)]",
    trace: "var(--warning)",
  },
};

const tracePaths: Record<TraceVariant, string> = {
  degrading: "M2 14 C18 5 28 8 40 14 C52 20 58 25 70 24 C84 24 94 21 118 22",
  rising: "M2 23 C18 22 28 18 40 18 C54 18 60 10 72 9 C88 7 98 10 118 4",
  silent: "M2 11 C18 8 30 9 42 14 C54 20 58 24 70 24 L118 24",
  steady: "M2 16 C20 13 28 13 42 16 C56 19 64 19 78 16 C94 12 104 14 118 16",
};

const eventStatus: Record<
  RecentEvent["status"],
  {
    label: string;
    tone: SignalTone;
  }
> = {
  accepted: {
    label: "accepted",
    tone: "healthy",
  },
  ignored: {
    label: "ignored",
    tone: "warning",
  },
  rejected: {
    label: "rejected",
    tone: "critical",
  },
};

export function TelemetryPanel({
  children,
  className = "",
  surface = "light",
}: {
  children: ReactNode;
  className?: string;
  surface?: "dark" | "light";
}) {
  const surfaceClass = surface === "dark" ? "telemetry-panel-dark" : "";

  return (
    <section className={`telemetry-panel ${surfaceClass} ${className}`}>
      {children}
    </section>
  );
}

export function SystemLabel({
  children,
  className = "",
  icon: Icon,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  icon?: LucideIcon;
  tone?: SignalTone;
}) {
  return (
    <p
      className={`inline-flex items-center gap-2 font-mono text-xs uppercase tracking-normal ${toneClasses[tone].text} ${className}`}
    >
      {Icon ? <Icon size={14} strokeWidth={1.8} /> : null}
      {children}
    </p>
  );
}

export function SignalIndicator({
  label,
  tone = "signal",
}: {
  label: string;
  tone?: SignalTone;
}) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap font-mono text-xs uppercase text-[var(--muted)]">
      <span className={`h-2.5 w-2.5 rounded-full ${toneClasses[tone].dot}`} />
      {label}
    </span>
  );
}

export function PulseBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: SignalTone;
}) {
  return (
    <span
      className={`inline-flex h-8 items-center whitespace-nowrap rounded-[var(--radius-xs)] border px-3 font-mono text-xs uppercase ${toneClasses[tone].border} ${toneClasses[tone].soft} ${toneClasses[tone].text}`}
    >
      {children}
    </span>
  );
}

export function MiniTrace({
  className = "",
  tone = "signal",
  variant = "steady",
}: {
  className?: string;
  tone?: SignalTone;
  variant?: TraceVariant;
}) {
  return (
    <svg
      aria-hidden="true"
      className={`h-9 w-full ${className}`}
      focusable="false"
      viewBox="0 0 120 32"
    >
      <path
        d="M2 24 L118 24"
        fill="none"
        opacity="0.28"
        stroke="currentColor"
        strokeDasharray="3 7"
      />
      <path
        className="mini-trace-path"
        d={tracePaths[variant]}
        fill="none"
        opacity="0.82"
        stroke={toneClasses[tone].trace}
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle cx="118" cy="24" fill={toneClasses[tone].trace} r="2.4" />
    </svg>
  );
}

export function SignalMetric({
  delta,
  label,
  note,
  status,
  tone = "signal",
  trace = "steady",
  value,
}: {
  delta: string;
  label: string;
  note: string;
  status: string;
  tone?: SignalTone;
  trace?: TraceVariant;
  value: string;
}) {
  return (
    <TelemetryPanel className="group min-h-[210px] p-4">
      <div className="flex items-start justify-between gap-3">
        <SystemLabel tone={tone}>{label}</SystemLabel>
        <span className={`font-mono text-xs ${toneClasses[tone].text}`}>
          {delta}
        </span>
      </div>
      <p className="mt-5 text-5xl font-semibold leading-none">{value}</p>
      <div className="mt-5">
        <MiniTrace tone={tone} variant={trace} />
      </div>
      <div className="mt-4 flex items-start gap-3">
        <span className={`mt-1 h-2 w-2 rounded-full ${toneClasses[tone].dot}`} />
        <div>
          <p className={`font-mono text-xs uppercase ${toneClasses[tone].text}`}>
            {status}
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{note}</p>
        </div>
      </div>
    </TelemetryPanel>
  );
}

export function EventNode({
  company,
  event,
  href,
  occurredAt,
  status,
  user,
}: {
  company: string;
  event: string;
  href?: string | null;
  occurredAt: string;
  status: RecentEvent["status"];
  user: string;
}) {
  const statusMeta = eventStatus[status];

  return (
    <div className="grid grid-cols-[70px_20px_minmax(0,1fr)] gap-3 py-3 text-sm">
      <time className="font-mono text-xs text-[var(--muted)]">{occurredAt}</time>
      <span
        className={`mt-1.5 h-2.5 w-2.5 rounded-full ${toneClasses[statusMeta.tone].dot}`}
        aria-label={statusMeta.label}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-mono text-sm">{event}</p>
          <PulseBadge tone={statusMeta.tone}>{statusMeta.label}</PulseBadge>
        </div>
        <p className="mt-1 truncate text-sm text-[var(--muted)]">
          {href ? (
            <Link
              className="font-semibold text-[var(--ink)] hover:text-[var(--signal)]"
              href={href}
            >
              {company}
            </Link>
          ) : (
            company
          )}
          <span> · {user}</span>
        </p>
      </div>
    </div>
  );
}

export function OpenMetricRail({
  children,
  className = "",
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={`grid gap-3 border-y border-[var(--border-soft)] bg-[rgba(247,248,239,0.36)] py-3 ${className}`}
    >
      {children}
    </div>
  );
}
