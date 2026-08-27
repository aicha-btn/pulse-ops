import {
  EventNode,
  MiniTrace,
  OpenMetricRail,
  PulseBadge,
  SignalIndicator,
  SignalMetric,
  SystemLabel,
  TelemetryPanel,
  type SignalTone,
  type TraceVariant,
} from "@/components/app/pulse-primitives";
import { ActivityChart } from "@/components/charts/activity-chart";
import { FunnelChart } from "@/components/charts/funnel-chart";
import {
  buildCompanyLinkIndex,
  getCompanyHref,
} from "@/features/companies/company-links";
import { getDashboardData } from "@/features/dashboard/get-dashboard-data";
import type { CompanySummary } from "@/features/demo/pulseops-demo-data";
import {
  Activity,
  ArrowRight,
  BellOff,
  GitBranch,
  Radar,
  Radio,
  Target,
} from "lucide-react";
import Link from "next/link";

const metricSignalMap: Record<
  string,
  {
    status: string;
    tone: SignalTone;
    trace: TraceVariant;
  }
> = {
  Activation: {
    status: "signal degrading",
    tone: "critical",
    trace: "degrading",
  },
  "Active accounts": {
    status: "live coverage",
    tone: "healthy",
    trace: "steady",
  },
  "Events received": {
    status: "stream online",
    tone: "signal",
    trace: "steady",
  },
  "Healthy accounts": {
    status: "stable signal",
    tone: "healthy",
    trace: "rising",
  },
  "Silent accounts": {
    status: "silence detected",
    tone: "critical",
    trace: "silent",
  },
};

export default async function AppOverviewPage() {
  const {
    activationFunnel,
    activitySeries,
    companies,
    overviewMetrics,
    recentEvents,
    source,
  } = await getDashboardData();
  const atRiskCompanies = companies
    .filter((company) => ["at_risk", "silent"].includes(company.status))
    .sort((left, right) => left.score - right.score);
  const companyLinkIndex = buildCompanyLinkIndex(companies);
  const rejectedEvents = recentEvents.filter(
    (event) => event.status === "rejected",
  );
  const sourceLabel =
    source === "postgres" ? "Live telemetry" : "Demo telemetry";
  const systemState = source === "postgres" ? "live stream" : "demo stream";

  return (
    <main className="observatory-grid min-h-[calc(100vh-var(--app-header-height))] px-4 py-5 sm:px-5 sm:py-8 lg:px-8">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <div className="min-w-0">
          <SystemLabel icon={Radar} tone="signal">
            Overview / signal observatory
          </SystemLabel>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-normal sm:text-4xl lg:text-5xl">
            Product telemetry control room
          </h1>
          <p className="mt-4 max-w-4xl text-[var(--muted)]">
            PulseOps listens to product events, turns them into account health
            signals, then shows where rhythm, activation or silence changed.
          </p>
        </div>

        <TelemetryPanel className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SystemLabel icon={Radio} tone="signal">
                System pulse
              </SystemLabel>
              <p className="mt-3 text-2xl font-semibold">{sourceLabel}</p>
            </div>
            <SignalIndicator label={systemState} tone="signal" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--border-soft)] pt-4">
            <SystemStat label="event rate" value="32/min" />
            <SystemStat label="window" value="90 days" />
          </div>
          <Link
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--paper)] transition hover:bg-transparent hover:text-[var(--ink)]"
            href="/app/integration"
          >
            Test ingestion
            <ArrowRight size={15} strokeWidth={1.8} />
          </Link>
        </TelemetryPanel>
      </section>

      <OpenMetricRail className="mt-6 grid-cols-2 sm:mt-8 md:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric) => {
          const signal = getMetricSignal(metric.label);

          return (
            <SignalMetric
              delta={metric.delta}
              key={metric.label}
              label={metric.label}
              note={metric.note}
              status={signal.status}
              tone={signal.tone}
              trace={signal.trace}
              value={metric.value}
            />
          );
        })}
      </OpenMetricRail>

      <section className="mt-6 grid gap-6 sm:mt-8 xl:grid-cols-[minmax(0,1.18fr)_minmax(340px,0.82fr)]">
        <TelemetryPanel className="p-5 lg:p-6">
          <div className="grid gap-4 border-b border-[var(--border-soft)] pb-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
            <div>
              <SystemLabel icon={Activity} tone="signal">
                Main signal
              </SystemLabel>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
                Usage cools after mid-July
              </h2>
            </div>
            <p className="text-sm leading-6 text-[var(--muted)]">
              The chart marks the strongest cooling point so the curve tells a
              product story, not just a statistic.
            </p>
          </div>
          <div className="mt-6">
            <ActivityChart data={activitySeries} />
          </div>
          <div className="mt-5 grid gap-3 border-t border-[var(--border-soft)] pt-4 md:grid-cols-3">
            <SignalFact label="signal type" value="event volume" />
            <SignalFact label="paired trace" value="active accounts" />
            <SignalFact label="detection" value="cooling marker" />
          </div>
        </TelemetryPanel>

        <TelemetryPanel className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-soft)] pb-5">
            <div>
              <SystemLabel icon={GitBranch} tone="warning">
                Activation detection
              </SystemLabel>
              <h2 className="mt-3 text-2xl font-semibold">
                Break before first_event_sent
              </h2>
            </div>
            <PulseBadge tone="warning">drop-off</PulseBadge>
          </div>
          <div className="mt-5">
            <FunnelChart data={activationFunnel} />
          </div>
          <div className="mt-4 border-t border-[var(--border-soft)] pt-4">
            <p className="text-sm leading-6 text-[var(--muted)]">
              The funnel is treated as a signal path: each step should carry
              momentum into the next product action.
            </p>
          </div>
        </TelemetryPanel>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <TelemetryPanel className="p-5" surface="dark">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[rgba(247,248,239,0.14)] pb-5">
            <div>
              <SystemLabel icon={BellOff} tone="signal">
                Signal decay
              </SystemLabel>
              <h2 className="mt-3 text-2xl font-semibold">
                Accounts losing rhythm
              </h2>
            </div>
            <PulseBadge tone="critical">{atRiskCompanies.length} alerts</PulseBadge>
          </div>
          <div className="mt-5 space-y-3">
            {atRiskCompanies.slice(0, 4).map((company) => (
              <DecayAccountRow company={company} key={company.id} />
            ))}
            {atRiskCompanies.length === 0 ? (
              <div className="py-8 text-sm text-[rgba(247,248,239,0.66)]">
                No signal decay detected in the current calculation window.
              </div>
            ) : null}
          </div>
          <Link
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--signal)]"
            href="/app/inactive"
          >
            Open recovery queue
            <ArrowRight size={15} strokeWidth={1.8} />
          </Link>
        </TelemetryPanel>

        <TelemetryPanel className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-soft)] pb-5">
            <div>
              <SystemLabel icon={Target} tone="signal">
                Recent signals
              </SystemLabel>
              <h2 className="mt-3 text-2xl font-semibold">
                Event stream timeline
              </h2>
            </div>
            <PulseBadge tone={rejectedEvents.length > 0 ? "critical" : "healthy"}>
              {rejectedEvents.length} rejected
            </PulseBadge>
          </div>
          <div className="event-timeline mt-4">
            {recentEvents.slice(0, 5).map((event) => (
              <EventNode
                company={event.company}
                event={event.event}
                href={getCompanyHref(companyLinkIndex, event.company)}
                key={event.id}
                occurredAt={event.occurredAt}
                status={event.status}
                user={event.user}
              />
            ))}
            {recentEvents.length === 0 ? (
              <div className="py-8 text-sm text-[var(--muted)]">
                No signal detected. PulseOps is listening for the first event.
              </div>
            ) : null}
          </div>
          <Link
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
            href="/app/events"
          >
            View full stream
            <ArrowRight size={15} strokeWidth={1.8} />
          </Link>
        </TelemetryPanel>
      </section>
    </main>
  );
}

function SystemStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-xs uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-1 truncate font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}

function SignalFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-xs uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function DecayAccountRow({ company }: { company: CompanySummary }) {
  const isSilent = company.status === "silent";
  const tone = isSilent ? "silent" : "critical";
  const statusLabel = isSilent ? "signal lost" : "signal weakening";
  const trace = isSilent ? "silent" : "degrading";

  return (
    <Link
      className="block rounded-[var(--radius-sm)] border-t border-[rgba(247,248,239,0.14)] bg-[rgba(247,248,239,0.045)] p-4 transition hover:bg-[rgba(34,223,197,0.08)]"
      href={`/app/companies/${company.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{company.name}</p>
          <p className="mt-1 whitespace-nowrap font-mono text-xs uppercase text-[rgba(247,248,239,0.58)]">
            Last signal {company.lastActivity}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl text-[var(--critical)]">
            {company.score}
          </p>
          <p className="mt-1 whitespace-nowrap font-mono text-xs uppercase text-[rgba(247,248,239,0.58)]">
            {statusLabel}
          </p>
        </div>
      </div>
      <MiniTrace
        className="mt-4 text-[rgba(247,248,239,0.3)]"
        tone={tone}
        variant={trace}
      />
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[rgba(247,248,239,0.66)]">
        {company.reason}
      </p>
    </Link>
  );
}

function getMetricSignal(label: string) {
  return (
    metricSignalMap[label] ?? {
      status: "signal observed",
      tone: "neutral" as const,
      trace: "steady" as const,
    }
  );
}
