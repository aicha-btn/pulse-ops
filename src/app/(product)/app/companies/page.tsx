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
import type {
  CompanySummary,
  HealthStatus,
} from "@/features/demo/pulseops-demo-data";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Filter,
  Gauge,
  Radio,
  RotateCcw,
  Search,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

const statusOptions = ["all", "healthy", "watch", "at_risk", "silent"] as const;
const planOptions = ["all", "starter", "growth", "scale"] as const;

const statusMeta: Record<
  HealthStatus,
  {
    label: string;
    reading: string;
    tone: SignalTone;
    trace: TraceVariant;
  }
> = {
  at_risk: {
    label: "Signal weakening",
    reading: "Activity exists, but the account rhythm is fragile.",
    tone: "critical",
    trace: "degrading",
  },
  healthy: {
    label: "Stable signal",
    reading: "Usage is recent, repeated and tied to useful product events.",
    tone: "healthy",
    trace: "steady",
  },
  silent: {
    label: "Signal lost",
    reading: "No recent activity has been detected for this account.",
    tone: "silent",
    trace: "silent",
  },
  watch: {
    label: "Watch signal",
    reading: "The account is active, but one signal is starting to cool.",
    tone: "warning",
    trace: "degrading",
  },
};

const trendMeta: Record<
  CompanySummary["trend"],
  {
    icon: LucideIcon;
    label: string;
    tone: SignalTone;
    trace: TraceVariant;
  }
> = {
  down: {
    icon: ArrowDownRight,
    label: "cooling",
    tone: "critical",
    trace: "degrading",
  },
  flat: {
    icon: ArrowRight,
    label: "steady",
    tone: "neutral",
    trace: "steady",
  },
  up: {
    icon: ArrowUpRight,
    label: "rising",
    tone: "healthy",
    trace: "rising",
  },
};

type SearchParams = Promise<{
  plan?: string | string[];
  q?: string | string[];
  status?: string | string[];
}>;

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { companies, source } = await getDashboardData();
  const filters = await searchParams;
  const selectedStatus = readOption(filters.status, statusOptions, "all");
  const selectedPlan = readOption(filters.plan, planOptions, "all");
  const searchQuery = readSearch(filters.q);
  const filteredCompanies = filterCompanies(companies, {
    plan: selectedPlan,
    q: searchQuery,
    status: selectedStatus,
  });
  const sourceLabel =
    source === "postgres" ? "Live telemetry" : "Demo telemetry";
  const visibleCounts = summarizeCompanies(filteredCompanies);
  const totalCounts = summarizeCompanies(companies);
  const needsAction = visibleCounts.atRisk + visibleCounts.silent;
  const monitorTone: SignalTone =
    totalCounts.silent > 0 || totalCounts.atRisk > 0 ? "warning" : "healthy";

  return (
    <main className="px-5 py-8 lg:px-8">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <div className="min-w-0">
          <SystemLabel icon={Building2} tone="signal">
            Companies / account signals
          </SystemLabel>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal lg:text-5xl">
            Account signal registry
          </h1>
          <p className="mt-4 max-w-4xl text-[var(--muted)]">
            Read each customer account as a product node: recent signal, health
            score, activation position and trend in one scan.
          </p>
        </div>

        <TelemetryPanel className="p-4" surface="dark">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SystemLabel icon={Radio} tone="signal">
                Account monitor
              </SystemLabel>
              <p className="mt-3 text-2xl font-semibold">{sourceLabel}</p>
            </div>
            <SignalIndicator label="coverage live" tone={monitorTone} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[rgba(247,248,239,0.14)] pt-4">
            <DarkProbe label="tracked" value={String(companies.length)} />
            <DarkProbe label="attention" value={String(totalCounts.atRisk + totalCounts.silent)} />
          </div>
          <Link
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--signal)] bg-[var(--signal)] px-4 text-sm font-semibold text-[var(--ink)] transition hover:bg-transparent hover:text-[var(--signal)]"
            href="/app/inactive"
          >
            Open decay queue
            <ArrowRight size={15} strokeWidth={1.8} />
          </Link>
        </TelemetryPanel>
      </section>

      <TelemetryPanel className="mt-8 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <SystemLabel icon={Filter} tone="neutral">
              Registry controls
            </SystemLabel>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Narrow the visible accounts while keeping the same health
              calculation underneath.
            </p>
          </div>
          <PulseBadge tone={selectedStatus === "all" ? "signal" : "warning"}>
            {selectedStatus === "all" ? "all statuses" : selectedStatus.replace("_", " ")}
          </PulseBadge>
        </div>

        <form
          action="/app/companies"
          className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_170px_170px_auto_auto] md:items-end"
        >
          <label className="block min-w-0">
            <span className="font-mono text-xs uppercase text-[var(--muted)]">
              Search signal
            </span>
            <input
              className="mt-2 h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-medium)] bg-white/72 px-3 text-sm outline-none transition focus:border-[var(--signal)]"
              defaultValue={searchQuery}
              name="q"
              placeholder="Company, reason, activation step"
              type="search"
            />
          </label>
          <label className="block">
            <span className="font-mono text-xs uppercase text-[var(--muted)]">
              Health state
            </span>
            <select
              className="mt-2 h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-medium)] bg-white/72 px-3 text-sm outline-none transition focus:border-[var(--signal)]"
              defaultValue={selectedStatus}
              name="status"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All states" : status.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-mono text-xs uppercase text-[var(--muted)]">
              Plan
            </span>
            <select
              className="mt-2 h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-medium)] bg-white/72 px-3 text-sm outline-none transition focus:border-[var(--signal)]"
              defaultValue={selectedPlan}
              name="plan"
            >
              {planOptions.map((plan) => (
                <option key={plan} value={plan}>
                  {plan === "all" ? "All plans" : plan}
                </option>
              ))}
            </select>
          </label>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--paper)]"
            type="submit"
          >
            <Search size={15} strokeWidth={1.8} />
            Apply
          </button>
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] border border-[var(--border-medium)] bg-white/72 px-4 text-sm font-semibold"
            href="/app/companies"
          >
            <RotateCcw size={15} strokeWidth={1.8} />
            Clear
          </Link>
        </form>
      </TelemetryPanel>

      <OpenMetricRail className="mt-6 md:grid-cols-2 xl:grid-cols-4">
        <RegistryMetric
          label="Visible"
          tone="signal"
          trace="steady"
          value={filteredCompanies.length}
        />
        <RegistryMetric
          label="Stable"
          tone="healthy"
          trace="steady"
          value={visibleCounts.healthy}
        />
        <RegistryMetric
          label="Watch"
          tone="warning"
          trace="degrading"
          value={visibleCounts.watch}
        />
        <RegistryMetric
          label="Needs action"
          tone="critical"
          trace="silent"
          value={needsAction}
        />
      </OpenMetricRail>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TelemetryPanel className="p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-soft)] pb-5">
            <div>
              <SystemLabel icon={Activity} tone="signal">
                Account signal map
              </SystemLabel>
              <h2 className="mt-3 text-3xl font-semibold">
                Accounts by live rhythm
              </h2>
            </div>
            <PulseBadge tone={needsAction > 0 ? "warning" : "healthy"}>
              {filteredCompanies.length} visible
            </PulseBadge>
          </div>

          <div className="mt-1">
            {filteredCompanies.map((company) => (
              <CompanySignalRow company={company} key={company.id} />
            ))}

            {filteredCompanies.length === 0 ? <EmptyCompanyState /> : null}
          </div>
        </TelemetryPanel>

        <div className="grid gap-6">
          <TelemetryPanel className="p-5" surface="dark">
            <SystemLabel icon={Gauge} tone="signal">
              Health language
            </SystemLabel>
            <h2 className="mt-3 text-2xl font-semibold">
              Reading account signals
            </h2>
            <div className="mt-5 space-y-4">
              {statusOptions
                .filter((status): status is HealthStatus => status !== "all")
                .map((status) => {
                  const meta = statusMeta[status];

                  return (
                    <SignalRule
                      key={status}
                      label={meta.label}
                      note={meta.reading}
                      tone={meta.tone}
                    />
                  );
                })}
            </div>
          </TelemetryPanel>

          <TelemetryPanel className="p-5">
            <SystemLabel icon={UsersRound} tone="neutral">
              Registry guide
            </SystemLabel>
            <div className="mt-4 space-y-4">
              <GuideProbe
                label="Score"
                value="Transparent health calculation"
              />
              <GuideProbe
                label="Trace"
                value="Tiny shape of recent activity"
              />
              <GuideProbe
                label="Last signal"
                value="Most recent account activity"
              />
            </div>
          </TelemetryPanel>
        </div>
      </section>
    </main>
  );
}

function CompanySignalRow({ company }: { company: CompanySummary }) {
  const status = statusMeta[company.status];
  const trend = trendMeta[company.trend];
  const TrendIcon = trend.icon;

  return (
    <article className="border-t border-[var(--border-soft)] py-5 first:border-t-0">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="font-semibold transition hover:text-[var(--signal)]"
              href={`/app/companies/${company.id}`}
            >
              {company.name}
            </Link>
            <PulseBadge tone={status.tone}>{status.label}</PulseBadge>
            <span className="whitespace-nowrap rounded-[var(--radius-xs)] border border-[var(--border-soft)] bg-white/50 px-2 py-1 font-mono text-xs uppercase text-[var(--muted)]">
              {company.plan}
            </span>
          </div>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            {company.reason}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <LightProbe label="last signal" value={company.lastActivity} />
            <LightProbe label="active users" value={String(company.activeUsers)} />
            <LightProbe label="activation" value={company.activationStep} />
          </div>
        </div>

        <div className="rounded-[var(--radius-sm)] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.42)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase text-[var(--muted)]">
                Health score
              </p>
              <p className="mt-2 font-mono text-5xl font-semibold">
                {company.score}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-[var(--radius-xs)] border border-[var(--border-soft)] bg-white/60 px-2 py-1 font-mono text-xs uppercase text-[var(--muted)]">
              <TrendIcon size={13} strokeWidth={1.8} />
              {trend.label}
            </span>
          </div>

          <MiniTrace tone={trend.tone} variant={trend.trace} />
          <ScoreSignalStack company={company} />

          <Link
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--paper)] transition hover:bg-transparent hover:text-[var(--ink)]"
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

function ScoreSignalStack({ company }: { company: CompanySummary }) {
  const parts = [
    {
      label: "recency",
      max: 40,
      tone: "bg-[var(--signal)]",
      value: company.healthBreakdown.recentActivityPoints,
    },
    {
      label: "frequency",
      max: 25,
      tone: "bg-[var(--healthy)]",
      value: company.healthBreakdown.frequencyPoints,
    },
    {
      label: "funnel",
      max: 20,
      tone: "bg-[var(--warning)]",
      value: company.healthBreakdown.funnelPoints,
    },
    {
      label: "key events",
      max: 15,
      tone: "bg-[var(--critical)]",
      value: company.healthBreakdown.keyEventPoints,
    },
  ];

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase text-[var(--muted)]">
          Score components
        </p>
        <p className="font-mono text-xs uppercase text-[var(--muted)]">
          {company.healthScoreSource}
        </p>
      </div>

      {parts.map((part) => {
        const width = Math.round((Math.min(part.value, part.max) / part.max) * 100);

        return (
          <div className="grid grid-cols-[76px_1fr_42px] items-center gap-2" key={part.label}>
            <span className="whitespace-nowrap text-xs text-[var(--muted)]">
              {part.label}
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-[rgba(17,20,15,0.08)]">
              <span
                className={`block h-full rounded-full ${part.tone}`}
                style={{
                  width: `${width}%`,
                }}
              />
            </span>
            <span className="text-right font-mono text-xs">
              {part.value}/{part.max}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RegistryMetric({
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

function SignalRule({
  label,
  note,
  tone,
}: {
  label: string;
  note: string;
  tone: SignalTone;
}) {
  return (
    <div className="border-t border-[rgba(247,248,239,0.14)] pt-4 first:border-t-0 first:pt-0">
      <SignalIndicator label={label} tone={tone} />
      <p className="mt-2 text-sm leading-6 text-[rgba(247,248,239,0.64)]">
        {note}
      </p>
    </div>
  );
}

function LightProbe({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[108px] flex-1 border-t border-[var(--border-soft)] pt-3">
      <p className="whitespace-nowrap font-mono text-xs uppercase text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
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

function GuideProbe({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-[var(--border-soft)] pt-4 first:border-t-0 first:pt-0">
      <p className="font-mono text-xs uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{value}</p>
    </div>
  );
}

function EmptyCompanyState() {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto max-w-sm">
        <MiniTrace tone="silent" variant="silent" />
        <SystemLabel className="mt-4 justify-center" tone="silent">
          No account signal matched
        </SystemLabel>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          The registry is listening, but these filters hide every tracked
          account.
        </p>
        <Link
          className="mt-5 inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--paper)]"
          href="/app/companies"
        >
          Clear filters
        </Link>
      </div>
    </div>
  );
}

function summarizeCompanies(companies: CompanySummary[]) {
  return companies.reduce(
    (counts, company) => {
      if (company.status === "healthy") {
        counts.healthy += 1;
      }

      if (company.status === "watch") {
        counts.watch += 1;
      }

      if (company.status === "at_risk") {
        counts.atRisk += 1;
      }

      if (company.status === "silent") {
        counts.silent += 1;
      }

      return counts;
    },
    {
      atRisk: 0,
      healthy: 0,
      silent: 0,
      watch: 0,
    },
  );
}

function filterCompanies(
  companies: CompanySummary[],
  filters: {
    plan: CompanySummary["plan"] | "all";
    q: string;
    status: HealthStatus | "all";
  },
) {
  const query = filters.q.toLowerCase();

  return companies.filter((company) => {
    const matchesStatus =
      filters.status === "all" || company.status === filters.status;
    const matchesPlan = filters.plan === "all" || company.plan === filters.plan;
    const searchableText = [
      company.name,
      company.reason,
      company.activationStep,
      company.lastActivity,
      company.plan,
      company.status,
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = !query || searchableText.includes(query);

    return matchesStatus && matchesPlan && matchesSearch;
  });
}

function readSearch(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0]?.trim() ?? "" : value?.trim() ?? "";
}

function readOption<const T extends readonly string[]>(
  value: string | string[] | undefined,
  options: T,
  fallback: T[number],
): T[number] {
  const firstValue = Array.isArray(value) ? value[0] : value;

  return firstValue && options.includes(firstValue) ? firstValue : fallback;
}
