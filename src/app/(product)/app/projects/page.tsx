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
  getProjectsData,
  type ProjectSummary,
} from "@/features/projects/get-projects-data";
import {
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  Plus,
  Radio,
  Settings2,
  Waves,
} from "lucide-react";
import Link from "next/link";

import { createProjectAction, selectProjectAction } from "./actions";

type ProjectsSearchParams = Promise<{
  error?: string | string[];
  saved?: string | string[];
}>;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: ProjectsSearchParams;
}) {
  const projectsData = await getProjectsData();
  const params = await searchParams;
  const saved = readParam(params.saved);
  const error = readParam(params.error);
  const isDisabled = projectsData.mode === "disabled";
  const currentProject = projectsData.projects.find(
    (project) => project.isCurrent,
  );
  const sourceLabel =
    projectsData.source === "postgres" ? "Live telemetry" : "Demo telemetry";
  const totalEvents = projectsData.projects.reduce(
    (sum, project) => sum + project.eventsCount,
    0,
  );
  const totalKeys = projectsData.projects.reduce(
    (sum, project) => sum + project.activeApiKeysCount,
    0,
  );
  const monitorTone: SignalTone = currentProject ? "signal" : "warning";

  return (
    <main className="px-5 py-8 lg:px-8">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <div className="min-w-0">
          <SystemLabel icon={FolderKanban} tone="signal">
            Projects / telemetry sources
          </SystemLabel>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal lg:text-5xl">
            Project stream control
          </h1>
          <p className="mt-4 max-w-4xl text-[var(--muted)]">
            Each project is an isolated product stream with its own API keys,
            activity volume and inactivity rules.
          </p>
        </div>

        <TelemetryPanel className="p-4" surface="dark">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SystemLabel icon={Radio} tone="signal">
                Workspace monitor
              </SystemLabel>
              <p className="mt-3 text-2xl font-semibold">{sourceLabel}</p>
            </div>
            <SignalIndicator
              label={currentProject ? "project locked" : "needs setup"}
              tone={monitorTone}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[rgba(247,248,239,0.14)] pt-4">
            <DarkProbe
              label="current"
              value={currentProject?.name ?? "no project"}
            />
            <DarkProbe
              label="projects"
              value={String(projectsData.projects.length)}
            />
          </div>
          {currentProject ? (
            <Link
              className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--signal)] bg-[var(--signal)] px-4 text-sm font-semibold text-[var(--ink)] transition hover:bg-transparent hover:text-[var(--signal)]"
              href="/app/settings"
            >
              Edit current rules
              <Settings2 size={15} strokeWidth={1.8} />
            </Link>
          ) : null}
        </TelemetryPanel>
      </section>

      {saved ? (
        <StatusNotice
          message={
            saved === "created"
              ? "Project created and selected."
              : "Current project updated."
          }
          tone="healthy"
        />
      ) : null}

      {error ? <StatusNotice message={error} tone="critical" /> : null}

      {isDisabled ? (
        <StatusNotice message={projectsData.disabledReason} tone="warning" />
      ) : null}

      <OpenMetricRail className="mt-8 md:grid-cols-2 xl:grid-cols-4">
        <ProjectMetric
          label="Projects"
          tone="signal"
          trace="steady"
          value={projectsData.projects.length}
        />
        <ProjectMetric
          label="Current"
          tone={currentProject ? "healthy" : "warning"}
          trace={currentProject ? "steady" : "silent"}
          value={currentProject ? 1 : 0}
        />
        <ProjectMetric
          label="Events"
          tone="signal"
          trace={totalEvents > 0 ? "rising" : "silent"}
          value={totalEvents}
        />
        <ProjectMetric
          label="Active keys"
          tone={totalKeys > 0 ? "healthy" : "warning"}
          trace={totalKeys > 0 ? "steady" : "silent"}
          value={totalKeys}
        />
      </OpenMetricRail>

      <section className="mt-8 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <TelemetryPanel className="p-5" surface="dark">
          <div className="border-b border-[rgba(247,248,239,0.14)] pb-5">
            <SystemLabel icon={Plus} tone="signal">
              New source
            </SystemLabel>
            <h2 className="mt-3 text-2xl font-semibold">Create project</h2>
            <p className="mt-3 text-sm leading-6 text-[rgba(247,248,239,0.66)]">
              A project gives one product its own stream, keys, funnel and
              health threshold.
            </p>
          </div>

          <form action={createProjectAction} className="mt-5 space-y-4">
            <label className="block">
              <span className="font-mono text-xs uppercase text-[rgba(247,248,239,0.58)]">
                Project name
              </span>
              <input
                className="mt-2 h-11 w-full rounded-[var(--radius-sm)] border border-[rgba(244,241,232,0.18)] bg-[rgba(244,241,232,0.06)] px-3 text-sm text-[var(--paper)] outline-none placeholder:text-[rgba(244,241,232,0.42)] focus:border-[var(--signal)] disabled:bg-[rgba(244,241,232,0.04)]"
                disabled={isDisabled}
                maxLength={120}
                name="name"
                placeholder="Production app"
                required
              />
            </label>

            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--signal)] bg-[var(--signal)] px-4 text-sm font-semibold text-[var(--ink)] transition hover:bg-transparent hover:text-[var(--signal)] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isDisabled}
              type="submit"
            >
              <Plus size={16} strokeWidth={1.8} />
              Create project
            </button>
          </form>

          <div className="mt-5 border-t border-[rgba(247,248,239,0.14)] pt-4">
            <SignalIndicator
              label={isDisabled ? "creation disabled" : "ready for stream"}
              tone={isDisabled ? "warning" : "healthy"}
            />
            <p className="mt-3 text-sm leading-6 text-[rgba(247,248,239,0.62)]">
              New projects start with the standard activation funnel and a
              14-day inactivity threshold.
            </p>
          </div>
        </TelemetryPanel>

        <TelemetryPanel className="p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-soft)] pb-5">
            <div>
              <SystemLabel icon={Waves} tone="signal">
                Project source map
              </SystemLabel>
              <h2 className="mt-3 text-3xl font-semibold">
                Products connected to PulseOps
              </h2>
            </div>
            <PulseBadge tone="signal">
              {projectsData.projects.length} projects
            </PulseBadge>
          </div>

          <div className="mt-1">
            {projectsData.projects.map((project) => (
              <ProjectSourceCard project={project} key={project.id} />
            ))}

            {projectsData.projects.length === 0 ? <EmptyProjectState /> : null}
          </div>
        </TelemetryPanel>
      </section>
    </main>
  );
}

function ProjectSourceCard({ project }: { project: ProjectSummary }) {
  const tone: SignalTone = project.isCurrent ? "signal" : "neutral";
  const trace: TraceVariant = project.eventsCount > 0 ? "steady" : "silent";

  return (
    <article
      className={`border-t border-[var(--border-soft)] py-5 first:border-t-0 ${
        project.isCurrent ? "bg-[rgba(34,223,197,0.045)] px-4" : ""
      }`}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{project.name}</h2>
            {project.isCurrent ? (
              <PulseBadge tone="healthy">
                <CheckCircle2 className="mr-1" size={12} strokeWidth={1.8} />
                Current
              </PulseBadge>
            ) : null}
            <span className="whitespace-nowrap rounded-[var(--radius-xs)] border border-[var(--border-soft)] bg-white/50 px-2 py-1 font-mono text-xs uppercase text-[var(--muted)]">
              {project.slug}
            </span>
          </div>

          <p className="mt-3 truncate font-mono text-xs text-[var(--muted)]">
            {project.workspaceName} / created {project.createdAtLabel}
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Signal is considered silent after{" "}
            {project.inactivityThresholdDays} days without activity.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <LightProbe
              label="companies"
              value={String(project.companiesCount)}
            />
            <LightProbe label="events" value={String(project.eventsCount)} />
            <LightProbe
              label="api keys"
              value={String(project.activeApiKeysCount)}
            />
          </div>
        </div>

        <div className="rounded-[var(--radius-sm)] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.42)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase text-[var(--muted)]">
                Stream state
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {project.eventsCount > 0 ? "receiving" : "quiet"}
              </p>
            </div>
            <SignalIndicator
              label={project.isCurrent ? "selected" : "available"}
              tone={tone}
            />
          </div>
          <MiniTrace tone={tone} variant={trace} />

          {project.isCurrent ? (
            <Link
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--paper)] transition hover:bg-transparent hover:text-[var(--ink)]"
              href="/app"
            >
              Open project
              <ArrowRight size={15} strokeWidth={1.8} />
            </Link>
          ) : (
            <form action={selectProjectAction} className="mt-4">
              <input name="projectId" type="hidden" value={project.id} />
              <button
                className="inline-flex h-10 w-full items-center justify-center rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--paper)] transition hover:bg-transparent hover:text-[var(--ink)]"
                type="submit"
              >
                Use project
              </button>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}

function ProjectMetric({
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
      <p className="mt-2 font-mono text-4xl font-semibold">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function StatusNotice({
  message,
  tone,
}: {
  message: string;
  tone: SignalTone;
}) {
  return (
    <TelemetryPanel className="mt-6 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <SignalIndicator label={tone === "critical" ? "error" : "status"} tone={tone} />
        <p className="text-sm font-semibold">{message}</p>
      </div>
    </TelemetryPanel>
  );
}

function LightProbe({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[96px] flex-1 border-t border-[var(--border-soft)] pt-3">
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

function EmptyProjectState() {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto max-w-sm">
        <MiniTrace tone="silent" variant="silent" />
        <SystemLabel className="mt-4 justify-center" tone="silent">
          No project stream detected
        </SystemLabel>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Create a project to give PulseOps a product stream to observe.
        </p>
      </div>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: value >= 1000 ? "compact" : "standard",
  }).format(value);
}

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
