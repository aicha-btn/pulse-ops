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
import type {
  TrackedUserStatus,
  TrackedUserSummary,
} from "@/features/demo/pulseops-demo-data";
import { getUsersData } from "@/features/users/get-users-data";
import {
  Activity,
  ArrowRight,
  CircleDot,
  Filter,
  Radio,
  RotateCcw,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

const statusOptions = ["all", "active", "new", "cooling", "silent"] as const;

const statusMeta: Record<
  TrackedUserStatus,
  {
    label: string;
    reading: string;
    tone: SignalTone;
    trace: TraceVariant;
  }
> = {
  active: {
    label: "Active signal",
    reading: "The user is sending recent, repeated product events.",
    tone: "healthy",
    trace: "steady",
  },
  cooling: {
    label: "Cooling signal",
    reading: "Recent activity exists, but the rhythm is weakening.",
    tone: "warning",
    trace: "degrading",
  },
  new: {
    label: "New signal",
    reading: "The user just appeared in the stream and needs activation context.",
    tone: "signal",
    trace: "rising",
  },
  silent: {
    label: "Silent signal",
    reading: "No recent user activity has been detected.",
    tone: "silent",
    trace: "silent",
  },
};

type SearchParams = Promise<{
  q?: string | string[];
  status?: string | string[];
}>;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [{ source, users }, dashboardData] = await Promise.all([
    getUsersData(),
    getDashboardData(),
  ]);
  const companyLinkIndex = buildCompanyLinkIndex(dashboardData.companies);
  const filters = await searchParams;
  const selectedStatus = readOption(filters.status, statusOptions, "all");
  const searchQuery = readSearch(filters.q);
  const filteredUsers = filterUsers(users, {
    q: searchQuery,
    status: selectedStatus,
  });
  const sourceLabel =
    source === "postgres" ? "Live telemetry" : "Demo telemetry";
  const visibleCounts = summarizeUsers(filteredUsers);
  const totalCounts = summarizeUsers(users);
  const attentionUsers = visibleCounts.cooling + visibleCounts.silent;
  const monitorTone: SignalTone =
    totalCounts.cooling + totalCounts.silent > 0 ? "warning" : "healthy";

  return (
    <main className="px-5 py-8 lg:px-8">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <div className="min-w-0">
          <SystemLabel icon={UsersRound} tone="signal">
            Users / individual telemetry
          </SystemLabel>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal lg:text-5xl">
            User signal board
          </h1>
          <p className="mt-4 max-w-4xl text-[var(--muted)]">
            Follow the people behind the account health score: who is active,
            who just arrived, and whose product rhythm is fading.
          </p>
        </div>

        <TelemetryPanel className="p-4" surface="dark">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SystemLabel icon={Radio} tone="signal">
                Identity monitor
              </SystemLabel>
              <p className="mt-3 text-2xl font-semibold">{sourceLabel}</p>
            </div>
            <SignalIndicator label="user stream" tone={monitorTone} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[rgba(247,248,239,0.14)] pt-4">
            <DarkProbe label="tracked users" value={String(users.length)} />
            <DarkProbe
              label="attention"
              value={String(totalCounts.cooling + totalCounts.silent)}
            />
          </div>
          <Link
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--signal)] bg-[var(--signal)] px-4 text-sm font-semibold text-[var(--ink)] transition hover:bg-transparent hover:text-[var(--signal)]"
            href="/app/events"
          >
            Inspect event stream
            <ArrowRight size={15} strokeWidth={1.8} />
          </Link>
        </TelemetryPanel>
      </section>

      <TelemetryPanel className="mt-8 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <SystemLabel icon={Filter} tone="neutral">
              User controls
            </SystemLabel>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Filter visible people without changing the underlying event
              stream.
            </p>
          </div>
          <PulseBadge tone={selectedStatus === "all" ? "signal" : "warning"}>
            {selectedStatus === "all" ? "all users" : selectedStatus}
          </PulseBadge>
        </div>

        <form
          action="/app/users"
          className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_170px_auto_auto] md:items-end"
        >
          <label className="block min-w-0">
            <span className="font-mono text-xs uppercase text-[var(--muted)]">
              Search signal
            </span>
            <input
              className="mt-2 h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-medium)] bg-white/72 px-3 text-sm outline-none transition focus:border-[var(--signal)]"
              defaultValue={searchQuery}
              name="q"
              placeholder="Name, email, company, role"
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
                  {status === "all" ? "All users" : status}
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
            href="/app/users"
          >
            <RotateCcw size={15} strokeWidth={1.8} />
            Clear
          </Link>
        </form>
      </TelemetryPanel>

      <OpenMetricRail className="mt-6 md:grid-cols-2 xl:grid-cols-4">
        <UserMetric
          label="Visible"
          tone="signal"
          trace="steady"
          value={filteredUsers.length}
        />
        <UserMetric
          label="Active"
          tone="healthy"
          trace="steady"
          value={visibleCounts.active}
        />
        <UserMetric
          label="Cooling"
          tone="warning"
          trace="degrading"
          value={visibleCounts.cooling}
        />
        <UserMetric
          label="Silent"
          tone="silent"
          trace="silent"
          value={visibleCounts.silent}
        />
      </OpenMetricRail>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TelemetryPanel className="p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-soft)] pb-5">
            <div>
              <SystemLabel icon={Activity} tone="signal">
                User telemetry
              </SystemLabel>
              <h2 className="mt-3 text-3xl font-semibold">
                People inside the stream
              </h2>
            </div>
            <PulseBadge tone={attentionUsers > 0 ? "warning" : "healthy"}>
              {filteredUsers.length} visible
            </PulseBadge>
          </div>

          <div className="mt-1">
            {filteredUsers.map((user) => (
              <UserSignalRow
                companyHref={getCompanyHref(companyLinkIndex, user.company)}
                key={user.id}
                user={user}
              />
            ))}

            {filteredUsers.length === 0 ? <EmptyUserState /> : null}
          </div>
        </TelemetryPanel>

        <div className="grid gap-6">
          <TelemetryPanel className="p-5" surface="dark">
            <SystemLabel icon={CircleDot} tone="signal">
              User states
            </SystemLabel>
            <h2 className="mt-3 text-2xl font-semibold">
              Reading user rhythm
            </h2>
            <div className="mt-5 space-y-4">
              {statusOptions
                .filter((status): status is TrackedUserStatus => status !== "all")
                .map((status) => {
                  const meta = statusMeta[status];

                  return (
                    <StateRule
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
            <SystemLabel icon={UserRound} tone="neutral">
              Activation clues
            </SystemLabel>
            <div className="mt-4 space-y-4">
              <GuideProbe label="First seen" value="When the user entered telemetry." />
              <GuideProbe label="Events 14d" value="Recent intensity of the user signal." />
              <GuideProbe label="Company" value="Account context for each signal." />
            </div>
          </TelemetryPanel>
        </div>
      </section>
    </main>
  );
}

function UserSignalRow({
  companyHref,
  user,
}: {
  companyHref: string | null;
  user: TrackedUserSummary;
}) {
  const status = statusMeta[user.status];

  return (
    <article className="border-t border-[var(--border-soft)] py-5 first:border-t-0">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{user.name}</h2>
            <PulseBadge tone={status.tone}>{status.label}</PulseBadge>
            <span className="whitespace-nowrap rounded-[var(--radius-xs)] border border-[var(--border-soft)] bg-white/50 px-2 py-1 font-mono text-xs uppercase text-[var(--muted)]">
              {user.role}
            </span>
          </div>

          <p className="mt-2 truncate text-sm text-[var(--muted)]">
            {user.email}
          </p>
          <p className="mt-2 truncate font-mono text-xs text-[var(--muted)]">
            {user.externalId} / first seen {user.firstSeen}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <LightProbe label="last signal" value={user.lastActivity} />
            <LightProbe label="events 14d" value={String(user.events14d)} />
            <LightProbe label="total events" value={String(user.totalEvents)} />
          </div>
        </div>

        <div className="rounded-[var(--radius-sm)] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.42)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase text-[var(--muted)]">
                Company node
              </p>
              {companyHref ? (
                <Link
                  className="mt-2 block truncate font-semibold transition hover:text-[var(--signal)]"
                  href={companyHref}
                  title={user.company}
                >
                  {user.company}
                </Link>
              ) : (
                <p className="mt-2 truncate font-semibold" title={user.company}>
                  {user.company}
                </p>
              )}
            </div>
            <SignalIndicator label={user.status} tone={status.tone} />
          </div>

          <MiniTrace tone={status.tone} variant={status.trace} />
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {status.reading}
          </p>
          {companyHref ? (
            <Link
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--paper)] transition hover:bg-transparent hover:text-[var(--ink)]"
              href={companyHref}
            >
              Open company
              <ArrowRight size={15} strokeWidth={1.8} />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function UserMetric({
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

function StateRule({
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

function EmptyUserState() {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto max-w-sm">
        <MiniTrace tone="silent" variant="silent" />
        <SystemLabel className="mt-4 justify-center" tone="silent">
          No user signal matched
        </SystemLabel>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          PulseOps is still listening, but these filters hide every tracked
          user.
        </p>
        <Link
          className="mt-5 inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--paper)]"
          href="/app/users"
        >
          Clear filters
        </Link>
      </div>
    </div>
  );
}

function summarizeUsers(users: TrackedUserSummary[]) {
  return users.reduce(
    (counts, user) => {
      counts[user.status] += 1;

      return counts;
    },
    {
      active: 0,
      cooling: 0,
      new: 0,
      silent: 0,
    },
  );
}

function filterUsers(
  users: TrackedUserSummary[],
  filters: {
    q: string;
    status: TrackedUserStatus | "all";
  },
) {
  const query = filters.q.toLowerCase();

  return users.filter((user) => {
    const matchesStatus =
      filters.status === "all" || user.status === filters.status;
    const searchableText = [
      user.name,
      user.email,
      user.externalId,
      user.company,
      user.role,
      user.status,
    ]
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
