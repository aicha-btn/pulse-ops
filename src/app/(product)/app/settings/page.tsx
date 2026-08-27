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
import { getProjectSettingsData } from "@/features/settings/get-project-settings-data";
import {
  Clock3,
  ListOrdered,
  Radio,
  Save,
  SlidersHorizontal,
} from "lucide-react";

import {
  updateFunnelStepsAction,
  updateProjectRulesAction,
} from "./actions";

type SettingsSearchParams = Promise<{
  error?: string | string[];
  saved?: string | string[];
}>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SettingsSearchParams;
}) {
  const settings = await getProjectSettingsData();
  const params = await searchParams;
  const saved = readParam(params.saved);
  const error = readParam(params.error);
  const isDisabled = settings.mode === "disabled";
  const steps = padSteps(settings.steps);

  return (
    <main className="px-5 py-8 lg:px-8">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <div className="min-w-0">
          <SystemLabel icon={SlidersHorizontal} tone="signal">
            Settings / detection rules
          </SystemLabel>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal lg:text-5xl">
            Signal rules
          </h1>
          <p className="mt-4 max-w-4xl text-[var(--muted)]">
            Define what counts as activation, how long activity can go quiet,
            and how PulseOps should read account health.
          </p>
        </div>

        <TelemetryPanel className="p-4" surface="dark">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SystemLabel icon={Radio} tone="signal">
                Rule monitor
              </SystemLabel>
              <p className="mt-3 text-2xl font-semibold">
                {settings.projectName}
              </p>
            </div>
            <SignalIndicator
              label={isDisabled ? "demo locked" : "editable"}
              tone={isDisabled ? "warning" : "healthy"}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[rgba(247,248,239,0.14)] pt-4">
            <DarkProbe
              label="silent after"
              value={`${settings.inactivityThresholdDays} days`}
            />
            <DarkProbe
              label="activation"
              value={`${settings.activationWindowDays} days`}
            />
          </div>
        </TelemetryPanel>
      </section>

      <OpenMetricRail className="mt-8 md:grid-cols-3">
        <RuleMetric
          label="Project"
          tone="signal"
          trace="steady"
          value={settings.projectName}
        />
        <RuleMetric
          label="Inactive after"
          tone="warning"
          trace="silent"
          value={`${settings.inactivityThresholdDays} days`}
        />
        <RuleMetric
          label="Activation window"
          tone="healthy"
          trace="rising"
          value={`${settings.activationWindowDays} days`}
        />
      </OpenMetricRail>

      {saved ? (
        <StatusNotice
          message={
            saved === "funnel"
              ? "Activation funnel saved. Scores will reflect this on the next calculation."
              : "Project rules saved. Scores will reflect this on the next calculation."
          }
          tone="healthy"
        />
      ) : null}

      {error ? <StatusNotice message={error} tone="critical" /> : null}

      {isDisabled ? (
        <StatusNotice message={settings.disabledReason} tone="warning" />
      ) : null}

      <section className="mt-8 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <TelemetryPanel className="p-5">
          <div className="border-b border-[var(--border-soft)] pb-5">
            <SystemLabel icon={Clock3} tone="signal">
              Health rules
            </SystemLabel>
            <h2 className="mt-3 text-2xl font-semibold">
              Inactivity and identity
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              These values feed the transparent health score: recent activity,
              activation progress and silence detection.
            </p>
          </div>

          <form action={updateProjectRulesAction} className="mt-5 space-y-4">
            <label className="block">
              <span className="font-mono text-xs uppercase text-[var(--muted)]">
                Project name
              </span>
              <input
                className="mt-2 h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-medium)] bg-white/72 px-3 text-sm outline-none transition focus:border-[var(--signal)] disabled:bg-[rgba(17,20,15,0.04)]"
                defaultValue={settings.projectName}
                disabled={isDisabled}
                maxLength={120}
                name="projectName"
                required
              />
            </label>

            <NumberField
              defaultValue={settings.inactivityThresholdDays}
              disabled={isDisabled}
              label="Inactivity threshold"
              max={90}
              min={1}
              name="inactivityThresholdDays"
            />

            <NumberField
              defaultValue={settings.activationWindowDays}
              disabled={isDisabled}
              label="Activation window"
              max={60}
              min={1}
              name="activationWindowDays"
            />

            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--paper)] transition hover:bg-transparent hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isDisabled}
              type="submit"
            >
              <Save size={16} strokeWidth={1.8} />
              Save rules
            </button>
          </form>
        </TelemetryPanel>

        <TelemetryPanel className="p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-soft)] pb-5">
            <div>
              <SystemLabel icon={ListOrdered} tone="signal">
                Activation funnel
              </SystemLabel>
              <h2 className="mt-3 text-3xl font-semibold">
                Activation path
              </h2>
            </div>
            <PulseBadge tone="signal">{steps.length} steps</PulseBadge>
          </div>

          <form action={updateFunnelStepsAction} className="mt-1">
            {steps.map((step, index) => (
              <FunnelStepRow
                disabled={isDisabled}
                index={index}
                key={index}
                step={step}
              />
            ))}

            <button
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--paper)] transition hover:bg-transparent hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isDisabled}
              type="submit"
            >
              <Save size={16} strokeWidth={1.8} />
              Save funnel
            </button>
          </form>
        </TelemetryPanel>
      </section>
    </main>
  );
}

function FunnelStepRow({
  disabled,
  index,
  step,
}: {
  disabled: boolean;
  index: number;
  step: {
    eventName: string;
    label: string;
    orderIndex: number;
  };
}) {
  return (
    <div className="grid gap-3 border-t border-[var(--border-soft)] py-4 first:border-t-0 md:grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)] md:items-end">
      <div>
        <p className="font-mono text-xs uppercase text-[var(--muted)]">Step</p>
        <p className="mt-2 font-mono text-2xl font-semibold">
          {String(index + 1).padStart(2, "0")}
        </p>
      </div>
      <label className="block min-w-0">
        <span className="font-mono text-xs uppercase text-[var(--muted)]">
          Event name
        </span>
        <input
          className="mt-2 h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-medium)] bg-white/72 px-3 font-mono text-xs outline-none transition focus:border-[var(--signal)] disabled:bg-[rgba(17,20,15,0.04)]"
          defaultValue={step.eventName}
          disabled={disabled}
          maxLength={160}
          name={`eventName_${index}`}
          placeholder="first_event_sent"
        />
      </label>
      <label className="block min-w-0">
        <span className="font-mono text-xs uppercase text-[var(--muted)]">
          Label
        </span>
        <input
          className="mt-2 h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-medium)] bg-white/72 px-3 text-sm outline-none transition focus:border-[var(--signal)] disabled:bg-[rgba(17,20,15,0.04)]"
          defaultValue={step.label}
          disabled={disabled}
          maxLength={160}
          name={`label_${index}`}
          placeholder="First event sent"
        />
      </label>
    </div>
  );
}

function NumberField({
  defaultValue,
  disabled,
  label,
  max,
  min,
  name,
}: {
  defaultValue: number;
  disabled: boolean;
  label: string;
  max: number;
  min: number;
  name: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-xs uppercase text-[var(--muted)]">
        {label}
      </span>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_80px]">
        <input
          className="h-11 rounded-l-[var(--radius-sm)] border border-r-0 border-[var(--border-medium)] bg-white/72 px-3 text-sm outline-none transition focus:border-[var(--signal)] disabled:bg-[rgba(17,20,15,0.04)]"
          defaultValue={defaultValue}
          disabled={disabled}
          max={max}
          min={min}
          name={name}
          required
          type="number"
        />
        <span className="flex h-11 items-center justify-center rounded-r-[var(--radius-sm)] border border-[var(--border-medium)] bg-white/45 font-mono text-xs uppercase text-[var(--muted)]">
          days
        </span>
      </div>
    </label>
  );
}

function RuleMetric({
  label,
  tone,
  trace,
  value,
}: {
  label: string;
  tone: SignalTone;
  trace: TraceVariant;
  value: string;
}) {
  return (
    <div className="min-w-0 border-t border-[var(--border-soft)] py-4">
      <div className="flex items-start justify-between gap-3">
        <SystemLabel tone={tone}>{label}</SystemLabel>
        <MiniTrace className="max-w-[96px]" tone={tone} variant={trace} />
      </div>
      <p className="mt-2 truncate text-2xl font-semibold">{value}</p>
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
        <SignalIndicator
          label={tone === "critical" ? "error" : "status"}
          tone={tone}
        />
        <p className="text-sm font-semibold">{message}</p>
      </div>
    </TelemetryPanel>
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

function padSteps(
  steps: {
    eventName: string;
    label: string;
    orderIndex: number;
  }[],
) {
  const sortedSteps = [...steps].sort(
    (left, right) => left.orderIndex - right.orderIndex,
  );

  return Array.from({ length: 6 }, (_, index) => {
    return (
      sortedSteps[index] ?? {
        eventName: "",
        label: "",
        orderIndex: index,
      }
    );
  });
}

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
