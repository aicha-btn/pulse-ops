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
  buildCompanyLinkIndex,
  getCompanyHref,
} from "@/features/companies/company-links";
import { getDashboardData } from "@/features/dashboard/get-dashboard-data";
import type { RecentEvent } from "@/features/demo/pulseops-demo-data";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Filter,
  Radio,
  RotateCcw,
  Search,
  Server,
} from "lucide-react";
import Link from "next/link";

const eventStatusMeta: Record<
  RecentEvent["status"],
  {
    description: string;
    icon: typeof CheckCircle2;
    label: string;
    telemetry: string;
    tone: SignalTone;
    trace: TraceVariant;
  }
> = {
  accepted: {
    description: "Payload validated and counted in the product stream.",
    icon: CheckCircle2,
    label: "Accepted",
    telemetry: "stored signal",
    tone: "healthy",
    trace: "steady",
  },
  ignored: {
    description: "Known duplicate or non-counting event kept out of metrics.",
    icon: CircleDashed,
    label: "Ignored",
    telemetry: "duplicate held",
    tone: "warning",
    trace: "degrading",
  },
  rejected: {
    description: "Invalid payload or ingestion contract issue to fix.",
    icon: AlertTriangle,
    label: "Rejected",
    telemetry: "contract break",
    tone: "critical",
    trace: "silent",
  },
};

const statusOptions = ["all", "accepted", "ignored", "rejected"] as const;

type SearchParams = Promise<{
  q?: string | string[];
  status?: string | string[];
}>;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { companies, recentEvents, source } = await getDashboardData();
  const companyLinkIndex = buildCompanyLinkIndex(companies);
  const filters = await searchParams;
  const selectedStatus = readOption(filters.status, statusOptions, "all");
  const searchQuery = readSearch(filters.q);
  const filteredEvents = filterEvents(recentEvents, {
    q: searchQuery,
    status: selectedStatus,
  });
  const visibleCounts = summarizeEvents(filteredEvents);
  const totalCounts = summarizeEvents(recentEvents);
  const latestEvent = recentEvents[0] ?? null;
  const sourceLabel =
    source === "postgres" ? "Live telemetry" : "Demo telemetry";
  const streamTone = totalCounts.rejected > 0 ? "critical" : "healthy";
  const streamState =
    totalCounts.rejected > 0 ? "contract attention" : "stream stable";

  return (
    <main className="px-5 py-8 lg:px-8">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <div className="min-w-0">
          <SystemLabel icon={Radio} tone="signal">
            Events / telemetry stream
          </SystemLabel>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal lg:text-5xl">
            Event stream
          </h1>
          <p className="mt-4 max-w-4xl text-[var(--muted)]">
            Follow each incoming product signal, verify the ingestion contract,
            and jump back to the account that generated the event.
          </p>
        </div>

        <TelemetryPanel className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SystemLabel icon={Server} tone="signal">
                Stream state
              </SystemLabel>
              <p className="mt-3 text-2xl font-semibold">{sourceLabel}</p>
            </div>
            <SignalIndicator label={streamState} tone={streamTone} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--border-soft)] pt-4">
            <StreamProbe label="latest signal" value={latestEvent?.occurredAt ?? "none"} />
            <StreamProbe label="window" value={`${recentEvents.length} events`} />
          </div>
          <Link
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--paper)] transition hover:bg-transparent hover:text-[var(--ink)]"
            href="/app/integration"
          >
            Inspect integration
            <ArrowRight size={15} strokeWidth={1.8} />
          </Link>
        </TelemetryPanel>
      </section>

      <TelemetryPanel className="mt-8 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <SystemLabel icon={Filter} tone="neutral">
              Stream controls
            </SystemLabel>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Filter the visible stream without changing the underlying event
              source.
            </p>
          </div>
          <PulseBadge tone={selectedStatus === "all" ? "signal" : "warning"}>
            {selectedStatus === "all" ? "all statuses" : selectedStatus}
          </PulseBadge>
        </div>

        <form
          action="/app/events"
          className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto_auto] md:items-end"
        >
          <label className="block min-w-0">
            <span className="font-mono text-xs uppercase text-[var(--muted)]">
              Search signal
            </span>
            <input
              className="mt-2 h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-medium)] bg-white/72 px-3 text-sm outline-none transition focus:border-[var(--signal)]"
              defaultValue={searchQuery}
              name="q"
              placeholder="Event, company, user, message"
              type="search"
            />
          </label>
          <label className="block">
            <span className="font-mono text-xs uppercase text-[var(--muted)]">
              Status
            </span>
            <select
              className="mt-2 h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-medium)] bg-white/72 px-3 text-sm outline-none transition focus:border-[var(--signal)]"
              defaultValue={selectedStatus}
              name="status"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All statuses" : status}
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
            href="/app/events"
          >
            <RotateCcw size={15} strokeWidth={1.8} />
            Clear
          </Link>
        </form>
      </TelemetryPanel>

      <OpenMetricRail className="mt-6 md:grid-cols-2 xl:grid-cols-4">
        <StreamMetric
          label="Visible"
          tone="signal"
          trace="steady"
          value={filteredEvents.length}
        />
        <StreamMetric
          label="Accepted"
          tone="healthy"
          trace="steady"
          value={visibleCounts.accepted}
        />
        <StreamMetric
          label="Ignored"
          tone="warning"
          trace="degrading"
          value={visibleCounts.ignored}
        />
        <StreamMetric
          label="Rejected"
          tone="critical"
          trace="silent"
          value={visibleCounts.rejected}
        />
      </OpenMetricRail>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TelemetryPanel className="p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-soft)] pb-5">
            <div>
              <SystemLabel icon={Radio} tone="signal">
                Chronological telemetry
              </SystemLabel>
              <h2 className="mt-3 text-3xl font-semibold">
                Signal timeline
              </h2>
            </div>
            <PulseBadge tone={streamTone}>{filteredEvents.length} visible</PulseBadge>
          </div>

          <div className="event-timeline mt-5">
            {filteredEvents.map((event) => (
              <EventStreamRow
                companyHref={getCompanyHref(companyLinkIndex, event.company)}
                event={event}
                key={event.id}
              />
            ))}

            {filteredEvents.length === 0 ? (
              <EmptyEventState hasFilters={Boolean(searchQuery || selectedStatus !== "all")} />
            ) : null}
          </div>
        </TelemetryPanel>

        <div className="grid gap-6">
          <TelemetryPanel className="p-5" surface="dark">
            <div className="border-b border-[rgba(247,248,239,0.14)] pb-5">
              <SystemLabel icon={AlertTriangle} tone="signal">
                Ingestion diagnostics
              </SystemLabel>
              <h2 className="mt-3 text-2xl font-semibold">Contract watch</h2>
              <p className="mt-3 text-sm leading-6 text-[rgba(247,248,239,0.66)]">
                PulseOps keeps accepted, ignored and rejected events visible so
                product metrics stay explainable.
              </p>
            </div>
            <div className="mt-5 space-y-4">
              <DiagnosticRow
                label="Accepted"
                status="stored signal"
                tone="healthy"
                value={totalCounts.accepted}
              />
              <DiagnosticRow
                label="Ignored"
                status="not counted"
                tone="warning"
                value={totalCounts.ignored}
              />
              <DiagnosticRow
                label="Rejected"
                status="needs fix"
                tone="critical"
                value={totalCounts.rejected}
              />
            </div>
          </TelemetryPanel>

          <TelemetryPanel className="p-5">
            <SystemLabel tone="neutral">Latest packet</SystemLabel>
            {latestEvent ? (
              <div className="mt-4">
                <p className="truncate font-mono text-lg font-semibold">
                  {latestEvent.event}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {latestEvent.company} sent a {latestEvent.status} event at{" "}
                  <span className="font-mono">{latestEvent.occurredAt}</span>.
                </p>
                <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--border-soft)] bg-white/64 p-3">
                  <p className="font-mono text-xs uppercase text-[var(--muted)]">
                    packet id
                  </p>
                  <p className="mt-1 truncate font-mono text-sm">
                    {latestEvent.id}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                No packet captured in the current stream window.
              </p>
            )}
          </TelemetryPanel>
        </div>
      </section>
    </main>
  );
}

function EventStreamRow({
  companyHref,
  event,
}: {
  companyHref: string | null;
  event: RecentEvent;
}) {
  const status = eventStatusMeta[event.status];
  const StatusIcon = status.icon;

  return (
    <article className="grid grid-cols-[72px_22px_minmax(0,1fr)] gap-3 border-t border-[var(--border-soft)] py-5 text-sm first:border-t-0">
      <time className="pt-1 font-mono text-xs text-[var(--muted)]">
        {event.occurredAt}
      </time>
      <span className="pt-1.5">
        <span className="signal-node" aria-label={status.label} />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-mono text-base font-semibold">
            {event.event}
          </p>
          <PulseBadge tone={status.tone}>
            <StatusIcon size={13} strokeWidth={1.8} />
            <span className="ml-1">{status.label}</span>
          </PulseBadge>
          <span className="font-mono text-xs uppercase text-[var(--muted)]">
            {event.id}
          </span>
        </div>
        <p className="mt-2 min-w-0 truncate text-[var(--muted)]">
          <CompanyCell company={event.company} href={companyHref} />
          <span> · {event.user}</span>
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px] md:items-end">
          <p className="text-sm leading-6 text-[var(--muted)]">
            {status.description}
          </p>
          <div>
            <p className="font-mono text-xs uppercase text-[var(--muted)]">
              {status.telemetry}
            </p>
            <MiniTrace tone={status.tone} variant={status.trace} />
          </div>
        </div>
      </div>
    </article>
  );
}

function CompanyCell({
  company,
  href,
}: {
  company: string;
  href: string | null;
}) {
  if (!href) {
    return <span>{company}</span>;
  }

  return (
    <Link
      className="font-semibold text-[var(--ink)] transition hover:text-[var(--signal)]"
      href={href}
      title={company}
    >
      {company}
    </Link>
  );
}

function StreamMetric({
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

function StreamProbe({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-xs uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-1 truncate font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}

function DiagnosticRow({
  label,
  status,
  tone,
  value,
}: {
  label: string;
  status: string;
  tone: SignalTone;
  value: number;
}) {
  return (
    <div className="rounded-[var(--radius-sm)] border-t border-[rgba(247,248,239,0.14)] bg-[rgba(247,248,239,0.045)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{label}</p>
          <p className="mt-1 font-mono text-xs uppercase text-[rgba(247,248,239,0.58)]">
            {status}
          </p>
        </div>
        <p className="font-mono text-3xl font-semibold">{value}</p>
      </div>
      <MiniTrace
        className="mt-4 text-[rgba(247,248,239,0.28)]"
        tone={tone}
        variant={tone === "healthy" ? "steady" : "degrading"}
      />
    </div>
  );
}

function EmptyEventState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="py-10">
      <p className="font-mono text-xs uppercase text-[var(--muted)]">
        No signal detected
      </p>
      <MiniTrace className="mt-4 max-w-sm" tone="silent" variant="silent" />
      <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--muted)]">
        {hasFilters
          ? "No event matches the current stream filters."
          : "PulseOps is listening for the first event in this stream."}
      </p>
      <Link
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
        href="/app/integration"
      >
        View integration
        <ArrowRight size={15} strokeWidth={1.8} />
      </Link>
    </div>
  );
}

function summarizeEvents(events: RecentEvent[]) {
  return {
    accepted: events.filter((event) => event.status === "accepted").length,
    ignored: events.filter((event) => event.status === "ignored").length,
    rejected: events.filter((event) => event.status === "rejected").length,
  };
}

function filterEvents(
  events: RecentEvent[],
  filters: {
    q: string;
    status: RecentEvent["status"] | "all";
  },
) {
  const query = filters.q.toLowerCase();

  return events.filter((event) => {
    const matchesStatus =
      filters.status === "all" || event.status === filters.status;
    const searchableText = [event.event, event.company, event.user, event.status]
      .join(" ")
      .toLowerCase();
    const matchesSearch = !query || searchableText.includes(query);

    return matchesStatus && matchesSearch;
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
