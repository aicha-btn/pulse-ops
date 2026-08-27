import {
  EventNode,
  MiniTrace,
  OpenMetricRail,
  PulseBadge,
  SignalIndicator,
  SystemLabel,
  TelemetryPanel,
  type SignalTone,
  type TraceVariant,
} from "@/components/app/pulse-primitives";
import { getCompanyDetailData } from "@/features/companies/get-company-detail-data";
import type {
  CompanySummary,
  TrackedUserStatus,
  TrackedUserSummary,
} from "@/features/demo/pulseops-demo-data";
import {
  Activity,
  ArrowLeft,
  Clock3,
  Gauge,
  Radio,
  ShieldAlert,
  Target,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const statusMeta: Record<
  CompanySummary["status"],
  {
    label: string;
    tone: SignalTone;
    trace: TraceVariant;
  }
> = {
  at_risk: {
    label: "signal weakening",
    tone: "critical",
    trace: "degrading",
  },
  healthy: {
    label: "stable signal",
    tone: "healthy",
    trace: "steady",
  },
  silent: {
    label: "signal lost",
    tone: "silent",
    trace: "silent",
  },
  watch: {
    label: "watch signal",
    tone: "warning",
    trace: "degrading",
  },
};

const priorityTone = {
  danger: "critical",
  good: "healthy",
  neutral: "neutral",
  warning: "warning",
} satisfies Record<string, SignalTone>;

const userStatusMeta: Record<
  TrackedUserStatus,
  {
    tone: SignalTone;
    trace: TraceVariant;
  }
> = {
  active: {
    tone: "healthy",
    trace: "steady",
  },
  cooling: {
    tone: "warning",
    trace: "degrading",
  },
  new: {
    tone: "signal",
    trace: "rising",
  },
  silent: {
    tone: "silent",
    trace: "silent",
  },
};

type CompanyPageProps = {
  params: Promise<{
    companyId: string;
  }>;
};

export default async function CompanyDetailPage({ params }: CompanyPageProps) {
  const { companyId } = await params;
  const detail = await getCompanyDetailData(companyId);

  if (!detail) {
    notFound();
  }

  const { company } = detail;
  const sourceLabel =
    detail.source === "postgres" ? "Live telemetry" : "Demo telemetry";
  const health = statusMeta[company.status];
  const recoveryTone = priorityTone[detail.recoveryPriority.tone];

  return (
    <main className="px-5 py-8 lg:px-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"
        href="/app/companies"
      >
        <ArrowLeft size={16} strokeWidth={1.8} />
        Back to companies
      </Link>

      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <div className="min-w-0">
          <SystemLabel icon={ShieldAlert} tone={health.tone}>
            Account inspection / {health.label}
          </SystemLabel>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-semibold tracking-normal lg:text-5xl">
              {company.name}
            </h1>
            <PulseBadge tone={health.tone}>{health.label}</PulseBadge>
            <PulseBadge tone="neutral">{company.plan}</PulseBadge>
          </div>
          <p className="mt-4 max-w-4xl text-[var(--muted)]">
            {detail.activationNarrative}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <LightProbe label="project" value={detail.projectName} />
            <LightProbe label="source" value={sourceLabel} />
            <LightProbe
              label="last calculation"
              value={detail.lastCalculationLabel}
            />
          </div>
        </div>

        <TelemetryPanel className="p-4" surface="dark">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SystemLabel icon={Gauge} tone="signal">
                Account monitor
              </SystemLabel>
              <p className="mt-3 font-mono text-7xl font-semibold leading-none">
                {company.score}
              </p>
            </div>
            <SignalIndicator label={health.label} tone={health.tone} />
          </div>
          <MiniTrace
            className="mt-3 text-[rgba(247,248,239,0.34)]"
            tone={health.tone}
            variant={health.trace}
          />
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[rgba(247,248,239,0.14)] pt-4">
            <DarkProbe
              label="priority"
              value={detail.recoveryPriority.label}
            />
            <DarkProbe label="last signal" value={company.lastActivity} />
          </div>
        </TelemetryPanel>
      </section>

      <OpenMetricRail className="mt-8 md:grid-cols-2 xl:grid-cols-4">
        <AccountMetric
          label="Active users"
          tone="signal"
          trace="steady"
          value={company.activeUsers}
        />
        <AccountMetric
          label="Recent events"
          tone="signal"
          trace={detail.eventSummary.total > 0 ? "rising" : "silent"}
          value={detail.eventSummary.total}
        />
        <AccountMetric
          label="Accepted"
          tone="healthy"
          trace="steady"
          value={detail.eventSummary.accepted}
        />
        <AccountMetric
          label="Rejected"
          tone={detail.eventSummary.rejected > 0 ? "critical" : "neutral"}
          trace={detail.eventSummary.rejected > 0 ? "silent" : "steady"}
          value={detail.eventSummary.rejected}
        />
      </OpenMetricRail>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TelemetryPanel className="p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-soft)] pb-5">
            <div>
              <SystemLabel icon={Target} tone="signal">
                Score explanation
              </SystemLabel>
              <h2 className="mt-3 text-3xl font-semibold">
                Why this account is {company.status.replace("_", " ")}
              </h2>
            </div>
            <PulseBadge tone="neutral">{company.healthScoreSource}</PulseBadge>
          </div>

          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
            {company.reason}
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {detail.healthParts.map((part) => (
              <ScorePartCard part={part} key={part.key} />
            ))}
          </div>
        </TelemetryPanel>

        <div className="grid gap-6">
          <TelemetryPanel className="p-5" surface="dark">
            <SystemLabel icon={Activity} tone={recoveryTone}>
              Recommended next action
            </SystemLabel>
            <h2 className="mt-3 text-2xl font-semibold">What to do next</h2>
            <p className="mt-4 text-sm leading-6 text-[rgba(247,248,239,0.68)]">
              {detail.recommendedAction}
            </p>
            <div className="mt-5 border-t border-[rgba(247,248,239,0.14)] pt-4">
              <SignalIndicator
                label={detail.recoveryPriority.label}
                tone={recoveryTone}
              />
              <p className="mt-2 text-sm leading-6 text-[rgba(247,248,239,0.62)]">
                {detail.recoveryPriority.note}
              </p>
            </div>
          </TelemetryPanel>

          <TelemetryPanel className="p-5">
            <SystemLabel icon={Radio} tone="signal">
              Activation step
            </SystemLabel>
            <p className="mt-3 truncate font-mono text-2xl font-semibold">
              {company.activationStep}
            </p>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              PulseOps ties the account status to concrete product behavior, so
              the score stays explainable.
            </p>
          </TelemetryPanel>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <TelemetryPanel className="p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-soft)] pb-5">
            <div>
              <SystemLabel icon={Radio} tone="signal">
                Recent account events
              </SystemLabel>
              <h2 className="mt-3 text-3xl font-semibold">Signal trail</h2>
            </div>
            <PulseBadge tone="signal">
              {detail.recentEvents.length} events
            </PulseBadge>
          </div>

          <div className="event-timeline mt-5">
            {detail.recentEvents.map((event) => (
              <EventNode
                company={company.name}
                event={event.event}
                key={event.id}
                occurredAt={event.occurredAt}
                status={event.status}
                user={event.user}
              />
            ))}

            {detail.recentEvents.length === 0 ? (
              <EmptyAccountState message="No recent event for this account in the current dashboard window." />
            ) : null}
          </div>
        </TelemetryPanel>

        <TelemetryPanel className="p-5">
          <div className="border-b border-[var(--border-soft)] pb-5">
            <SystemLabel icon={UsersRound} tone="signal">
              Tracked users
            </SystemLabel>
            <h2 className="mt-3 text-2xl font-semibold">
              {detail.trackedUsers.length} people
            </h2>
          </div>
          <div className="mt-1">
            {detail.trackedUsers.map((user) => (
              <TrackedUserCard key={user.id} user={user} />
            ))}

            {detail.trackedUsers.length === 0 ? (
              <EmptyAccountState message="No tracked user is attached to this account yet." />
            ) : null}
          </div>
        </TelemetryPanel>
      </section>
    </main>
  );
}

function ScorePartCard({
  part,
}: {
  part: {
    key: string;
    label: string;
    max: number;
    note: string;
    points: number;
    width: number;
  };
}) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.42)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{part.label}</p>
        <p className="whitespace-nowrap font-mono text-sm">
          {part.points}/{part.max}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(17,20,15,0.08)]">
        <div
          className="h-full rounded-full bg-[var(--signal)]"
          style={{
            width: `${part.width}%`,
          }}
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{part.note}</p>
    </div>
  );
}

function TrackedUserCard({ user }: { user: TrackedUserSummary }) {
  const status = userStatusMeta[user.status];

  return (
    <article className="border-t border-[var(--border-soft)] py-4 first:border-t-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold" title={user.name}>
            {user.name}
          </p>
          <p className="mt-1 truncate text-sm text-[var(--muted)]" title={user.email}>
            {user.email}
          </p>
        </div>
        <PulseBadge tone={status.tone}>{user.status}</PulseBadge>
      </div>
      <MiniTrace tone={status.tone} variant={status.trace} />
      <div className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
        <p className="flex items-center gap-2 whitespace-nowrap">
          <Clock3 size={15} strokeWidth={1.8} />
          {user.lastActivity}
        </p>
        <p className="flex items-center gap-2 whitespace-nowrap">
          <Radio size={15} strokeWidth={1.8} />
          {user.events14d} events in 14d
        </p>
      </div>
    </article>
  );
}

function AccountMetric({
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

function LightProbe({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[140px] flex-1 border-t border-[var(--border-soft)] pt-3">
      <p className="whitespace-nowrap font-mono text-xs uppercase text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold" title={value}>
        {value}
      </p>
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

function EmptyAccountState({ message }: { message: string }) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto max-w-sm">
        <MiniTrace tone="silent" variant="silent" />
        <SystemLabel className="mt-4 justify-center" tone="silent">
          No signal detected
        </SystemLabel>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{message}</p>
      </div>
    </div>
  );
}
