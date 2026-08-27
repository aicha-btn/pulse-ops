import {
  MiniTrace,
  OpenMetricRail,
  PulseBadge,
  SignalIndicator,
  SystemLabel,
  TelemetryPanel,
  type SignalTone,
  type TraceVariant,
} from "@/components/app/pulse-primitives";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Database,
  KeyRound,
  Radio,
  ShieldCheck,
  Timer,
} from "lucide-react";

import {
  getSystemStatusData,
  type SystemCheck,
  type SystemCheckStatus,
} from "@/features/system/get-system-status-data";

const statusMeta: Record<
  SystemCheckStatus,
  {
    icon: typeof CheckCircle2;
    label: string;
    tone: SignalTone;
    trace: TraceVariant;
  }
> = {
  missing: {
    icon: AlertTriangle,
    label: "missing",
    tone: "critical",
    trace: "silent",
  },
  optional: {
    icon: CircleDashed,
    label: "optional",
    tone: "warning",
    trace: "degrading",
  },
  ready: {
    icon: CheckCircle2,
    label: "ready",
    tone: "healthy",
    trace: "steady",
  },
};

const setupSteps = [
  {
    icon: Database,
    label: "1. Database",
    text: "Fill DATABASE_URL, run migrations, seed the demo dataset.",
  },
  {
    icon: ShieldCheck,
    label: "2. Auth",
    text: "Fill Supabase URL and publishable key, then create a test account.",
  },
  {
    icon: KeyRound,
    label: "3. Ingestion",
    text: "Create a project API key and send a test event from Integration.",
  },
  {
    icon: Timer,
    label: "4. Cron",
    text: "Set CRON_SECRET, then connect the aggregation endpoint to the chosen scheduler.",
  },
];

export default function SystemPage() {
  const statusData = getSystemStatusData();
  const missingCount = statusData.missingRequiredCount;
  const readinessTone: SignalTone = missingCount > 0 ? "warning" : "healthy";

  return (
    <main className="px-5 py-8 lg:px-8">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <div className="min-w-0">
          <SystemLabel icon={Radio} tone="signal">
            System / launch readiness
          </SystemLabel>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal lg:text-5xl">
            Setup signal
          </h1>
          <p className="mt-4 max-w-4xl text-[var(--muted)]">
            Verify the services PulseOps needs before switching from demo data
            to a real Supabase-backed product stream.
          </p>
        </div>

        <TelemetryPanel className="p-4" surface="dark">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SystemLabel icon={ShieldCheck} tone="signal">
                Readiness monitor
              </SystemLabel>
              <p className="mt-3 font-mono text-6xl font-semibold leading-none">
                {statusData.completionRate}%
              </p>
            </div>
            <SignalIndicator
              label={missingCount > 0 ? "handoff pending" : "ready"}
              tone={readinessTone}
            />
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[rgba(247,248,239,0.12)]">
            <div
              className="h-full rounded-full bg-[var(--signal)]"
              style={{ width: `${statusData.completionRate}%` }}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[rgba(247,248,239,0.14)] pt-4">
            <DarkProbe
              label="ready"
              value={`${statusData.readyCount}/${statusData.requiredCount}`}
            />
            <DarkProbe label="missing" value={String(missingCount)} />
          </div>
        </TelemetryPanel>
      </section>

      <OpenMetricRail className="mt-8 md:grid-cols-3">
        <SystemMetric
          label="Required"
          tone="signal"
          trace="steady"
          value={statusData.requiredCount}
        />
        <SystemMetric
          label="Ready"
          tone="healthy"
          trace="steady"
          value={statusData.readyCount}
        />
        <SystemMetric
          label="Missing"
          tone={missingCount > 0 ? "critical" : "healthy"}
          trace={missingCount > 0 ? "silent" : "steady"}
          value={missingCount}
        />
      </OpenMetricRail>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statusData.checks.map((check) => (
          <StatusCard check={check} key={check.label} />
        ))}
      </section>

      <TelemetryPanel className="mt-8 p-5" surface="dark">
        <div className="border-b border-[rgba(247,248,239,0.14)] pb-5">
          <SystemLabel icon={Timer} tone="signal">
            Supabase handoff
          </SystemLabel>
          <h2 className="mt-3 text-2xl font-semibold">
            Real-data launch path
          </h2>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          {setupSteps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                className="rounded-[var(--radius-sm)] border border-[rgba(247,248,239,0.14)] bg-[rgba(247,248,239,0.045)] p-4"
                key={step.label}
              >
                <Icon
                  className="text-[var(--signal)]"
                  size={18}
                  strokeWidth={1.8}
                />
                <p className="mt-4 font-mono text-xs uppercase text-[rgba(247,248,239,0.58)]">
                  {step.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgba(247,248,239,0.74)]">
                  {step.text}
                </p>
              </article>
            );
          })}
        </div>
      </TelemetryPanel>
    </main>
  );
}

function StatusCard({ check }: { check: SystemCheck }) {
  const status = statusMeta[check.status];
  const Icon = status.icon;

  return (
    <TelemetryPanel className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <SystemLabel tone={status.tone}>{check.label}</SystemLabel>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {check.description}
          </p>
        </div>
        <PulseBadge tone={status.tone}>
          <Icon className="mr-1" size={13} strokeWidth={1.8} />
          {status.label}
        </PulseBadge>
      </div>
      <MiniTrace tone={status.tone} variant={status.trace} />
      <div className="mt-5 border-t border-[var(--border-soft)] pt-4">
        <p className="font-mono text-xs uppercase text-[var(--muted)]">
          Next step
        </p>
        <p className="mt-2 break-words text-sm leading-6">{check.nextStep}</p>
      </div>
    </TelemetryPanel>
  );
}

function SystemMetric({
  label,
  tone,
  trace,
  value,
}: {
  label: string;
  tone: SignalTone;
  trace: TraceVariant;
  value: number;
}) {
  return (
    <div className="min-w-0 border-t border-[var(--border-soft)] py-4">
      <div className="flex items-start justify-between gap-3">
        <SystemLabel tone={tone}>{label}</SystemLabel>
        <MiniTrace className="max-w-[96px]" tone={tone} variant={trace} />
      </div>
      <p className="mt-2 font-mono text-4xl font-semibold">{value}</p>
    </div>
  );
}

function DarkProbe({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-xs uppercase text-[rgba(247,248,239,0.52)]">
        {label}
      </p>
      <p className="mt-1 truncate text-lg font-semibold text-[var(--paper)]">
        {value}
      </p>
    </div>
  );
}
