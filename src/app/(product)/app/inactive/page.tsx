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
import { getDashboardData } from "@/features/dashboard/get-dashboard-data";
import type { CompanySummary } from "@/features/demo/pulseops-demo-data";
import {
  ArrowRight,
  BellOff,
  Clock3,
  Radio,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

const statusRank = {
  silent: 0,
  at_risk: 1,
  watch: 2,
  healthy: 3,
};

export default async function InactiveAccountsPage() {
  const { companies, source } = await getDashboardData();
  const inactiveCompanies = companies
    .filter((company) => ["at_risk", "silent"].includes(company.status))
    .sort(
      (left, right) =>
        statusRank[left.status] - statusRank[right.status] ||
        left.score - right.score,
    );
  const silentCompanies = inactiveCompanies.filter(
    (company) => company.status === "silent",
  );
  const atRiskCompanies = inactiveCompanies.filter(
    (company) => company.status === "at_risk",
  );
  const lowestScore = inactiveCompanies[0]?.score ?? 0;
  const sourceLabel =
    source === "postgres" ? "Live telemetry" : "Demo telemetry";

  return (
    <main className="px-5 py-8 lg:px-8">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <div className="min-w-0">
          <SystemLabel icon={BellOff} tone="critical">
            Inactive accounts / signal decay
          </SystemLabel>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal lg:text-5xl">
            Recovery queue
          </h1>
          <p className="mt-4 max-w-4xl text-[var(--muted)]">
            Detect accounts whose product rhythm has faded, flattened or gone
            silent before the relationship is fully lost.
          </p>
        </div>

        <TelemetryPanel className="p-4" surface="dark">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SystemLabel icon={Radio} tone="signal">
                Decay monitor
              </SystemLabel>
              <p className="mt-3 text-2xl font-semibold">{sourceLabel}</p>
            </div>
            <SignalIndicator
              label={inactiveCompanies.length > 0 ? "attention" : "stable"}
              tone={inactiveCompanies.length > 0 ? "critical" : "healthy"}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[rgba(247,248,239,0.14)] pt-4">
            <DarkProbe label="lowest health" value={String(lowestScore)} />
            <DarkProbe label="silent" value={String(silentCompanies.length)} />
          </div>
          <Link
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--signal)] bg-[var(--signal)] px-4 text-sm font-semibold text-[var(--ink)] transition hover:bg-transparent hover:text-[var(--signal)]"
            href="/app/companies?status=silent"
          >
            View silent only
            <ArrowRight size={15} strokeWidth={1.8} />
          </Link>
        </TelemetryPanel>
      </section>

      <OpenMetricRail className="mt-8 md:grid-cols-3">
        <RecoveryMetric
          label="Needs action"
          tone="critical"
          trace="degrading"
          value={inactiveCompanies.length}
        />
        <RecoveryMetric
          label="Signal lost"
          tone="silent"
          trace="silent"
          value={silentCompanies.length}
        />
        <RecoveryMetric
          label="Weakening"
          tone="warning"
          trace="degrading"
          value={atRiskCompanies.length}
        />
      </OpenMetricRail>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TelemetryPanel className="p-5" surface="dark">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[rgba(247,248,239,0.14)] pb-5">
            <div>
              <SystemLabel icon={ShieldAlert} tone="signal">
                Lowest signal first
              </SystemLabel>
              <h2 className="mt-3 text-3xl font-semibold">
                Accounts losing rhythm
              </h2>
            </div>
            <PulseBadge tone="critical">{inactiveCompanies.length} alerts</PulseBadge>
          </div>

          <div className="mt-5 space-y-4">
            {inactiveCompanies.map((company) => (
              <DecayAccountCard company={company} key={company.id} />
            ))}

            {inactiveCompanies.length === 0 ? (
              <EmptyRecoveryState />
            ) : null}
          </div>
        </TelemetryPanel>

        <div className="grid gap-6">
          <TelemetryPanel className="p-5">
            <SystemLabel icon={Clock3} tone="critical">
              Recovery logic
            </SystemLabel>
            <h2 className="mt-3 text-2xl font-semibold">How to read decay</h2>
            <div className="mt-5 space-y-4">
              <RecoveryRule
                label="Signal weakening"
                note="Recent activity exists, but usage is too weak or activation is incomplete."
                tone="warning"
              />
              <RecoveryRule
                label="Signal lost"
                note="The account has gone quiet enough that recovery matters more than optimization."
                tone="silent"
              />
              <RecoveryRule
                label="Open account"
                note="Use the account detail page to see the score components and recent event trail."
                tone="signal"
              />
            </div>
          </TelemetryPanel>

          <TelemetryPanel className="p-5">
            <SystemLabel tone="neutral">Suggested workflow</SystemLabel>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
              <li>1. Start with the lowest health score.</li>
              <li>2. Check the last signal and active users.</li>
              <li>3. Open the account detail before deciding the action.</li>
            </ol>
          </TelemetryPanel>
        </div>
      </section>
    </main>
  );
}

function DecayAccountCard({ company }: { company: CompanySummary }) {
  const isSilent = company.status === "silent";
  const tone: SignalTone = isSilent ? "silent" : "critical";
  const trace: TraceVariant = isSilent ? "silent" : "degrading";
  const statusLabel = isSilent ? "signal lost" : "signal weakening";
  const daysWithoutSignal = readDaysFromActivity(company.lastActivity);

  return (
    <article className="rounded-[var(--radius-sm)] border-t border-[rgba(247,248,239,0.14)] bg-[rgba(247,248,239,0.045)] p-4 transition hover:bg-[rgba(34,223,197,0.075)]">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_140px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="font-semibold text-[var(--paper)] transition hover:text-[var(--signal)]"
              href={`/app/companies/${company.id}`}
            >
              {company.name}
            </Link>
            <PulseBadge tone={tone}>{statusLabel}</PulseBadge>
            <span className="whitespace-nowrap font-mono text-xs uppercase text-[rgba(247,248,239,0.58)]">
              {company.plan}
            </span>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[rgba(247,248,239,0.66)]">
            {company.reason}
          </p>
        </div>

        <div className="lg:text-right">
          <p className="font-mono text-5xl font-semibold text-[var(--critical)]">
            {company.score}
          </p>
          <p className="mt-1 font-mono text-xs uppercase text-[rgba(247,248,239,0.58)]">
            health score
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
        <div>
          <MiniTrace
            className="text-[rgba(247,248,239,0.32)]"
            tone={tone}
            variant={trace}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <DarkProbe label="last signal" value={company.lastActivity} />
            <DarkProbe
              label="active users"
              value={String(company.activeUsers)}
            />
            <DarkProbe label="decay age" value={daysWithoutSignal} />
          </div>
        </div>

        <div className="grid gap-3">
          <SignalStack company={company} />
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[rgba(247,248,239,0.16)] px-4 text-sm font-semibold text-[var(--signal)] transition hover:border-[var(--signal)]"
            href={`/app/companies/${company.id}`}
          >
            Open account
            <ArrowRight size={15} strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function SignalStack({ company }: { company: CompanySummary }) {
  const parts = [
    {
      label: "recency",
      max: 40,
      value: company.healthBreakdown.recentActivityPoints,
    },
    {
      label: "frequency",
      max: 25,
      value: company.healthBreakdown.frequencyPoints,
    },
    {
      label: "funnel",
      max: 20,
      value: company.healthBreakdown.funnelPoints,
    },
    {
      label: "key event",
      max: 15,
      value: company.healthBreakdown.keyEventPoints,
    },
  ];

  return (
    <div className="rounded-[var(--radius-sm)] border border-[rgba(247,248,239,0.12)] bg-[rgba(247,248,239,0.035)] p-3">
      <p className="font-mono text-xs uppercase text-[rgba(247,248,239,0.5)]">
        score signal
      </p>
      <div className="mt-3 grid gap-2">
        {parts.map((part) => {
          const width = Math.round((part.value / part.max) * 100);

          return (
            <div key={part.label}>
              <div className="flex items-center justify-between gap-3">
                <span className="whitespace-nowrap text-xs text-[rgba(247,248,239,0.62)]">
                  {part.label}
                </span>
                <span className="font-mono text-xs">
                  {part.value}/{part.max}
                </span>
              </div>
              <div className="mt-1 h-1.5 bg-[rgba(247,248,239,0.1)]">
                <div
                  className="h-full bg-[var(--signal)]"
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

function RecoveryMetric({
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
    <TelemetryPanel className="p-4">
      <div className="flex items-center justify-between gap-3">
        <SystemLabel tone={tone}>{label}</SystemLabel>
        <span className="signal-node" aria-hidden="true" />
      </div>
      <p className="mt-4 font-mono text-4xl font-semibold">{value}</p>
      <MiniTrace className="mt-4" tone={tone} variant={trace} />
    </TelemetryPanel>
  );
}

function RecoveryRule({
  label,
  note,
  tone,
}: {
  label: string;
  note: string;
  tone: SignalTone;
}) {
  return (
    <div className="border-t border-[var(--border-soft)] pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{label}</p>
        <PulseBadge tone={tone}>{tone}</PulseBadge>
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{note}</p>
    </div>
  );
}

function DarkProbe({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-xs uppercase text-[rgba(247,248,239,0.5)]">
        {label}
      </p>
      <p className="mt-1 truncate font-mono text-sm font-semibold text-[var(--paper)]">
        {value}
      </p>
    </div>
  );
}

function EmptyRecoveryState() {
  return (
    <div className="py-10">
      <p className="font-mono text-xs uppercase text-[rgba(247,248,239,0.58)]">
        No signal decay detected
      </p>
      <MiniTrace
        className="mt-4 max-w-sm text-[rgba(247,248,239,0.3)]"
        tone="healthy"
        variant="steady"
      />
      <p className="mt-4 max-w-lg text-sm leading-6 text-[rgba(247,248,239,0.66)]">
        The current calculation does not show any account with a broken product
        rhythm.
      </p>
    </div>
  );
}

function readDaysFromActivity(value: string) {
  const match = value.match(/\d+/);

  if (!match) {
    return value;
  }

  return `${match[0]}d`;
}
