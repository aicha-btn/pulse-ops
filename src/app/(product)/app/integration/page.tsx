import { ApiKeyManager } from "@/components/app/api-key-manager";
import { IntegrationDocs } from "@/components/app/integration-docs";
import {
  SignalIndicator,
  SystemLabel,
  TelemetryPanel,
} from "@/components/app/pulse-primitives";
import { TrackEventTester } from "@/components/track-event-tester";
import { getApiKeysData } from "@/features/api-keys/get-api-keys-data";
import { getDashboardData } from "@/features/dashboard/get-dashboard-data";
import { ArrowRight, Code2, Radio, Send } from "lucide-react";
import Link from "next/link";

import { createApiKeyAction, revokeApiKeyAction } from "./actions";

export default async function IntegrationPage() {
  const { integrationCurl, source } = await getDashboardData();
  const apiKeysData = await getApiKeysData();
  const sourceLabel =
    source === "postgres" ? "Live telemetry" : "Demo telemetry";
  const activeKeysCount = apiKeysData.keys.filter(
    (key) => key.status === "active",
  ).length;

  return (
    <main className="px-5 py-8 lg:px-8">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <div className="min-w-0">
          <SystemLabel icon={Code2} tone="signal">
            Integration / ingestion console
          </SystemLabel>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal lg:text-5xl">
            Ingestion control room
          </h1>
          <p className="mt-4 max-w-4xl text-[var(--muted)]">
            Generate an API key, send a test event, then verify the exact
            contract PulseOps expects from a product backend.
          </p>
        </div>

        <TelemetryPanel className="p-4" surface="dark">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SystemLabel icon={Radio} tone="signal">
                Endpoint monitor
              </SystemLabel>
              <p className="mt-3 text-2xl font-semibold">{sourceLabel}</p>
            </div>
            <SignalIndicator
              label={apiKeysData.mode === "ready" ? "ready" : "demo"}
              tone={apiKeysData.mode === "ready" ? "healthy" : "warning"}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[rgba(247,248,239,0.14)] pt-4">
            <DarkProbe label="endpoint" value="/api/ingest/track" />
            <DarkProbe label="active keys" value={String(activeKeysCount)} />
          </div>
          <Link
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--signal)] bg-[var(--signal)] px-4 text-sm font-semibold text-[var(--ink)] transition hover:bg-transparent hover:text-[var(--signal)]"
            href="/app/events"
          >
            View event stream
            <ArrowRight size={15} strokeWidth={1.8} />
          </Link>
        </TelemetryPanel>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <ApiKeyManager
          createAction={createApiKeyAction}
          disabledReason={
            apiKeysData.mode === "disabled"
              ? apiKeysData.disabledReason
              : undefined
          }
          keys={apiKeysData.keys}
          mode={apiKeysData.mode}
          revokeAction={revokeApiKeyAction}
        />

        <TelemetryPanel className="p-5" surface="dark">
          <SystemLabel icon={Send} tone="signal">
            Live tester
          </SystemLabel>
          <h2 className="mt-3 text-2xl font-semibold">
            Validate ingestion
          </h2>
          <p className="mt-3 text-sm leading-6 text-[rgba(244,241,232,0.64)]">
            Without a database, the endpoint accepts valid payloads in
            validation_only mode. With Supabase connected, this same call will
            persist the event.
          </p>
          <TrackEventTester initialApiKey={apiKeysData.testApiKey} />
        </TelemetryPanel>
      </section>

      <IntegrationDocs integrationCurl={integrationCurl} />
    </main>
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
