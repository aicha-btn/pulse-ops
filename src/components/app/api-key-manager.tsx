"use client";

import {
  MiniTrace,
  PulseBadge,
  SignalIndicator,
  SystemLabel,
  TelemetryPanel,
  type SignalTone,
} from "@/components/app/pulse-primitives";
import type { ApiKeySummary } from "@/features/api-keys/get-api-keys-data";
import { Ban, CheckCircle2, Clipboard, KeyRound } from "lucide-react";
import { useActionState, useState } from "react";

type CreateApiKeyActionState = {
  createdKey?: string;
  createdKeyName?: string;
  message: string;
  status: "idle" | "success" | "error";
};

type ApiKeyManagerProps = {
  createAction: (
    state: CreateApiKeyActionState,
    formData: FormData,
  ) => Promise<CreateApiKeyActionState>;
  disabledReason?: string;
  keys: ApiKeySummary[];
  mode: "ready" | "disabled";
  revokeAction: (formData: FormData) => void | Promise<void>;
};

const initialCreateState: CreateApiKeyActionState = {
  message: "",
  status: "idle",
};

export function ApiKeyManager({
  createAction,
  disabledReason,
  keys,
  mode,
  revokeAction,
}: ApiKeyManagerProps) {
  const [createState, createFormAction, isCreating] = useActionState(
    createAction,
    initialCreateState,
  );
  const [copied, setCopied] = useState(false);
  const activeKeysCount = keys.filter((key) => key.status === "active").length;
  const isDisabled = mode === "disabled";

  async function copyCreatedKey() {
    if (!createState.createdKey) {
      return;
    }

    await navigator.clipboard.writeText(createState.createdKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <TelemetryPanel className="p-5">
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--border-soft)] pb-5 md:flex-row md:items-start">
        <div>
          <SystemLabel icon={KeyRound} tone="signal">
            API key vault
          </SystemLabel>
          <h2 className="mt-3 text-2xl font-semibold">Ingestion keys</h2>
        </div>
        <SignalIndicator
          label={`${activeKeysCount} active`}
          tone={activeKeysCount > 0 ? "healthy" : "warning"}
        />
      </div>

      <form
        action={createFormAction}
        className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
      >
        <label>
          <span className="font-mono text-xs uppercase text-[var(--muted)]">
            Key name
          </span>
          <input
            className="mt-2 h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-medium)] bg-white/72 px-3 text-sm outline-none transition focus:border-[var(--signal)] disabled:bg-[rgba(17,20,15,0.04)]"
            defaultValue="Local ingestion key"
            disabled={isDisabled}
            maxLength={120}
            name="name"
            required
          />
        </label>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--paper)] transition hover:bg-transparent hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50 md:mt-6"
          disabled={isDisabled || isCreating}
          type="submit"
        >
          <KeyRound size={16} strokeWidth={1.8} />
          {isCreating ? "Creating..." : "Create key"}
        </button>
      </form>

      {disabledReason ? (
        <StatusMessage message={disabledReason} tone="warning" />
      ) : null}

      {createState.status !== "idle" ? (
        <StatusMessage
          message={createState.message}
          tone={createState.status === "success" ? "healthy" : "critical"}
        />
      ) : null}

      {createState.createdKey ? (
        <section className="mt-4 rounded-[var(--radius-sm)] border border-[rgba(34,223,197,0.28)] bg-[rgba(34,223,197,0.08)] p-4">
          <div className="flex items-center gap-2 text-[#08776e]">
            <CheckCircle2 size={17} strokeWidth={1.8} />
            <p className="text-sm font-semibold">
              {createState.createdKeyName} is ready
            </p>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
            <input
              className="h-11 min-w-0 rounded-[var(--radius-sm)] border border-[var(--border-medium)] bg-white/72 px-3 font-mono text-xs"
              readOnly
              value={createState.createdKey}
            />
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-medium)] bg-white/60 px-4 text-sm font-semibold transition hover:border-[var(--ink)]"
              onClick={copyCreatedKey}
              type="button"
            >
              <Clipboard size={16} strokeWidth={1.8} />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-[var(--radius-sm)] border border-[rgba(247,248,239,0.14)] bg-[var(--surface-night)] p-4 font-mono text-xs leading-5 text-[var(--paper)]">
            {buildCurlExample(createState.createdKey)}
          </pre>
        </section>
      ) : null}

      <div className="mt-5">
        {keys.map((key) => (
          <KeySignalRow key={key.id} keyData={key} revokeAction={revokeAction} />
        ))}

        {keys.length === 0 ? <EmptyKeysState /> : null}
      </div>
    </TelemetryPanel>
  );
}

function KeySignalRow({
  keyData,
  revokeAction,
}: {
  keyData: ApiKeySummary;
  revokeAction: (formData: FormData) => void | Promise<void>;
}) {
  const tone: SignalTone = keyData.status === "active" ? "healthy" : "critical";

  return (
    <article className="border-t border-[var(--border-soft)] py-4 first:border-t-0">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{keyData.name}</p>
            <PulseBadge tone={tone}>{keyData.status}</PulseBadge>
          </div>
          <p className="mt-2 truncate font-mono text-xs text-[var(--muted)]">
            {keyData.preview}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <KeyProbe label="created" value={keyData.createdAtLabel} />
            <KeyProbe label="last used" value={keyData.lastUsedAtLabel} />
          </div>
        </div>

        <div className="rounded-[var(--radius-sm)] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.42)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase text-[var(--muted)]">
                Key signal
              </p>
              <p className="mt-2 text-lg font-semibold">
                {keyData.status === "active" ? "accepting events" : "revoked"}
              </p>
            </div>
            <SignalIndicator label={keyData.status} tone={tone} />
          </div>
          <MiniTrace
            tone={tone}
            variant={keyData.status === "active" ? "steady" : "silent"}
          />

          {keyData.status === "active" ? (
            <form action={revokeAction} className="mt-4">
              <input name="keyId" type="hidden" value={keyData.id} />
              <button
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[rgba(255,79,123,0.32)] px-3 text-sm font-semibold text-[#a01843] transition hover:bg-[rgba(255,79,123,0.1)]"
                type="submit"
              >
                <Ban size={15} strokeWidth={1.8} />
                Revoke
              </button>
            </form>
          ) : (
            <p className="mt-4 font-mono text-xs uppercase text-[var(--muted)]">
              Revoked {keyData.revokedAtLabel}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function StatusMessage({
  message,
  tone,
}: {
  message: string;
  tone: SignalTone;
}) {
  return (
    <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--border-soft)] bg-white/50 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <SignalIndicator
          label={tone === "critical" ? "error" : "status"}
          tone={tone}
        />
        <p className="text-sm leading-6 text-[var(--muted)]">{message}</p>
      </div>
    </div>
  );
}

function KeyProbe({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[108px] flex-1 border-t border-[var(--border-soft)] pt-3">
      <p className="whitespace-nowrap font-mono text-xs uppercase text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function EmptyKeysState() {
  return (
    <div className="border-t border-[var(--border-soft)] py-10 text-center">
      <div className="mx-auto max-w-sm">
        <MiniTrace tone="silent" variant="silent" />
        <SystemLabel className="mt-4 justify-center" tone="silent">
          No ingestion key detected
        </SystemLabel>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Create one key before sending production events into PulseOps.
        </p>
      </div>
    </div>
  );
}

function buildCurlExample(apiKey: string) {
  return `curl -X POST http://localhost:3000/api/ingest/track \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "event_id": "evt_demo_001",
    "event": "first_event_sent",
    "occurred_at": "2026-08-23T12:30:00.000Z",
    "user": {
      "external_id": "user_123",
      "email": "founder@example.com"
    },
    "company": {
      "external_id": "company_456",
      "name": "Northstar Labs"
    }
  }'`;
}
