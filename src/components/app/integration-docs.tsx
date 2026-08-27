import {
  PulseBadge,
  SignalIndicator,
  SystemLabel,
  TelemetryPanel,
  type SignalTone,
} from "@/components/app/pulse-primitives";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, Code2, FileJson2 } from "lucide-react";

const requiredFields = [
  {
    field: "event_id",
    type: "string",
    note: "Unique event id for idempotency.",
  },
  {
    field: "event",
    type: "string",
    note: "Stable name like signed_up or first_event_sent.",
  },
  {
    field: "occurred_at",
    type: "ISO datetime",
    note: "When the event happened in the customer product.",
  },
  {
    field: "user.external_id",
    type: "string",
    note: "Stable user id from the customer product.",
  },
];

const optionalFields = [
  {
    field: "user.email",
    type: "email",
    note: "Used to make the user stream readable.",
  },
  {
    field: "user.name",
    type: "string",
    note: "Display name for tracked users.",
  },
  {
    field: "company.external_id",
    type: "string",
    note: "Stable account id for B2B health scoring.",
  },
  {
    field: "company.traits",
    type: "object",
    note: "Plan, industry, seats or any account metadata.",
  },
  {
    field: "properties",
    type: "object",
    note: "Event-specific metadata, under 64 KB total payload.",
  },
];

const responseRows = [
  {
    tone: "healthy",
    status: "202 accepted",
    label: "stored",
    note: "The event is valid and persisted.",
  },
  {
    tone: "warning",
    status: "202 accepted",
    label: "duplicate_ignored",
    note: "The event_id already exists, so metrics are not counted twice.",
  },
  {
    tone: "critical",
    status: "400 bad request",
    label: "invalid_payload",
    note: "The JSON shape or field format must be fixed.",
  },
  {
    tone: "critical",
    status: "401 unauthorized",
    label: "invalid_api_key",
    note: "The key is missing, unknown or revoked.",
  },
  {
    tone: "warning",
    status: "429 too many",
    label: "rate_limit_exceeded",
    note: "The key sent too many requests in the current minute.",
  },
];

const validPayload = `{
  "event_id": "evt_20260824_001",
  "event": "first_event_sent",
  "occurred_at": "2026-08-24T12:30:00.000Z",
  "user": {
    "external_id": "user_123",
    "email": "founder@example.com",
    "name": "Mara Chen",
    "traits": {
      "role": "founder"
    }
  },
  "company": {
    "external_id": "company_456",
    "name": "Northstar Labs",
    "traits": {
      "plan": "growth",
      "seats": 24
    }
  },
  "properties": {
    "source": "backend"
  }
}`;

const acceptedResponse = `{
  "data": {
    "accepted": true,
    "mode": "persisted",
    "status": "stored",
    "event_id": "evt_20260824_001",
    "event": "first_event_sent"
  }
}`;

const invalidResponse = `{
  "error": {
    "code": "invalid_payload",
    "message": "The event payload does not match the PulseOps track contract.",
    "issues": [
      {
        "path": "event_id",
        "message": "Invalid input: expected string, received undefined"
      }
    ]
  }
}`;

export function IntegrationDocs({ integrationCurl }: { integrationCurl: string }) {
  return (
    <section className="mt-8 space-y-6">
      <TelemetryPanel className="p-5">
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--border-soft)] pb-5 md:flex-row md:items-start">
          <div>
            <SystemLabel icon={Code2} tone="signal">
              Track API
            </SystemLabel>
            <h2 className="mt-3 text-2xl font-semibold">
              Event ingestion contract
            </h2>
          </div>
          <PulseBadge tone="signal">
            POST /api/ingest/track
          </PulseBadge>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="min-w-0">
            <SectionTitle icon={CheckCircle2} label="Required fields" />
            <FieldTable rows={requiredFields} />
          </div>
          <div className="min-w-0">
            <SectionTitle icon={FileJson2} label="Optional context" />
            <FieldTable rows={optionalFields} />
          </div>
        </div>
      </TelemetryPanel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <TelemetryPanel className="min-w-0 p-5" surface="dark">
          <SectionTitle icon={Code2} label="cURL example" />
          <pre className="mt-4 overflow-x-auto rounded-[var(--radius-sm)] border border-[rgba(247,248,239,0.14)] bg-black/20 p-4 font-mono text-xs leading-5 text-[rgba(247,248,239,0.76)]">
            {integrationCurl}
          </pre>
        </TelemetryPanel>

        <TelemetryPanel className="min-w-0 p-5" surface="dark">
          <SectionTitle
            icon={AlertTriangle}
            label="Validation rules"
            surface="dark"
          />
          <ul className="mt-4 space-y-3 text-sm leading-6 text-[rgba(244,241,232,0.68)]">
            <li>Event names must start with a letter and use lowercase characters.</li>
            <li>Payloads must stay under 64 KB.</li>
            <li>Nested metadata can go up to 4 levels deep.</li>
            <li>Reserved fields cannot be repeated inside properties or traits.</li>
            <li>Persisted ingestion is limited per API key each minute.</li>
          </ul>
        </TelemetryPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <CodePanel title="Valid payload" code={validPayload} />
        <CodePanel title="Accepted response" code={acceptedResponse} />
        <CodePanel title="Invalid response" code={invalidResponse} />

        <TelemetryPanel className="min-w-0 p-5">
          <SystemLabel tone="signal">
            Response states
          </SystemLabel>
          <div className="mt-4 divide-y divide-[var(--border-soft)] border-t border-[var(--border-soft)]">
            {responseRows.map((row) => (
              <div
                className="grid gap-2 py-3 text-sm md:grid-cols-[128px_190px_1fr] md:items-center"
                key={`${row.status}-${row.label}`}
              >
                <span className="font-mono text-xs uppercase text-[var(--muted)]">
                  {row.status}
                </span>
                <SignalIndicator
                  label={row.label}
                  tone={row.tone as SignalTone}
                />
                <span className="text-[var(--muted)]">{row.note}</span>
              </div>
            ))}
          </div>
        </TelemetryPanel>
      </div>
    </section>
  );
}

function SectionTitle({
  icon: Icon,
  label,
  surface = "light",
}: {
  icon: LucideIcon;
  label: string;
  surface?: "dark" | "light";
}) {
  return <SystemLabel icon={Icon} tone={surface === "dark" ? "signal" : "neutral"}>{label}</SystemLabel>;
}

function FieldTable({
  rows,
}: {
  rows: {
    field: string;
    note: string;
    type: string;
  }[];
}) {
  return (
    <div className="mt-4 divide-y divide-[var(--border-soft)] border-t border-[var(--border-soft)]">
      {rows.map((row) => (
        <div
          className="grid gap-2 py-3 text-sm md:grid-cols-[170px_120px_1fr]"
          key={row.field}
        >
          <span className="font-mono text-xs">{row.field}</span>
          <span className="font-mono text-xs uppercase text-[var(--muted)]">
            {row.type}
          </span>
          <span className="text-[var(--muted)]">{row.note}</span>
        </div>
      ))}
    </div>
  );
}

function CodePanel({ code, title }: { code: string; title: string }) {
  return (
    <TelemetryPanel className="min-w-0 p-5">
      <SystemLabel tone="neutral">{title}</SystemLabel>
      <pre className="mt-4 overflow-x-auto rounded-[var(--radius-sm)] border border-[rgba(17,20,15,0.12)] bg-[var(--surface-night)] p-4 font-mono text-xs leading-5 text-[var(--paper)]">
        {code}
      </pre>
    </TelemetryPanel>
  );
}
