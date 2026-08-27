"use client";

import {
  MiniTrace,
  PulseBadge,
  SignalIndicator,
} from "@/components/app/pulse-primitives";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const fallbackApiKey = process.env.NEXT_PUBLIC_INGESTION_TEST_KEY ?? "";

type SubmitState = "idle" | "sending" | "success" | "error";

type ApiResponse = {
  status: number;
  body: unknown;
};

export function TrackEventTester({ initialApiKey = fallbackApiKey }: { initialApiKey?: string }) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const responseTone =
    submitState === "success"
      ? "healthy"
      : submitState === "error"
        ? "critical"
        : submitState === "sending"
          ? "signal"
          : "neutral";

  async function sendDemoEvent() {
    const trimmedApiKey = apiKey.trim();

    if (!trimmedApiKey) {
      setSubmitState("error");
      setResponse({
        status: 401,
        body: {
          error: {
            code: "missing_api_key",
            message: "Paste an API key before sending a demo event.",
          },
        },
      });
      return;
    }

    setSubmitState("sending");
    setResponse(null);

    const result = await fetch("/api/ingest/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${trimmedApiKey}`,
      },
      body: JSON.stringify({
        event_id: `evt_demo_${Date.now()}`,
        event: "first_event_sent",
        occurred_at: new Date().toISOString(),
        user: {
          external_id: "user_demo_founder",
          email: "founder@northstar.example",
        },
        company: {
          external_id: "company_northstar",
          name: "Northstar Labs",
          traits: {
            plan: "growth",
          },
        },
        properties: {
          source: "landing_preview",
        },
      }),
    });

    const body: unknown = await result.json();

    setResponse({
      status: result.status,
      body,
    });
    setSubmitState(result.ok ? "success" : "error");
  }

  return (
    <div className="mt-7">
      <label className="mb-3 block">
        <span className="font-mono text-xs uppercase text-[rgba(244,241,232,0.62)]">
          API key
        </span>
        <span className="relative mt-2 block">
          <input
            className="h-11 w-full rounded-[var(--radius-sm)] border border-[rgba(244,241,232,0.2)] bg-[rgba(244,241,232,0.06)] px-3 pr-12 font-mono text-xs text-[var(--paper)] outline-none placeholder:text-[rgba(244,241,232,0.34)] focus:border-[var(--signal)]"
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="po_live_..."
            type={isApiKeyVisible ? "text" : "password"}
            value={apiKey}
          />
          <button
            aria-label={isApiKeyVisible ? "Hide API key" : "Reveal API key"}
            className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-[var(--radius-sm)] border border-[rgba(244,241,232,0.16)] text-[rgba(244,241,232,0.62)] transition hover:border-[var(--signal)] hover:text-[var(--signal)]"
            onClick={() => setIsApiKeyVisible((current) => !current)}
            type="button"
          >
            {isApiKeyVisible ? (
              <EyeOff size={15} strokeWidth={1.8} />
            ) : (
              <Eye size={15} strokeWidth={1.8} />
            )}
          </button>
        </span>
      </label>
      <button
        className="inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-sm)] border border-[var(--signal)] bg-[var(--signal)] px-4 text-sm font-semibold text-[var(--ink)] transition hover:bg-transparent hover:text-[var(--signal)] disabled:cursor-wait disabled:opacity-70"
        disabled={submitState === "sending"}
        onClick={sendDemoEvent}
        type="button"
      >
        {submitState === "sending" ? "Sending event..." : "Send demo event"}
      </button>

      <div
        aria-live="polite"
        className="mt-4 min-h-36 rounded-[var(--radius-sm)] border border-[rgba(244,241,232,0.14)] bg-black/20 p-3 font-mono text-xs leading-5 text-[rgba(244,241,232,0.74)]"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <SignalIndicator label="test packet" tone={responseTone} />
          <PulseBadge tone={responseTone}>
            {submitState === "idle" ? "waiting" : submitState}
          </PulseBadge>
        </div>
        {response ? (
          <pre className="overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(response, null, 2)}
          </pre>
        ) : (
          <div className="space-y-3">
            <MiniTrace
              className="text-[rgba(247,248,239,0.34)]"
              tone="signal"
              variant="steady"
            />
            <p>POST /api/ingest/track</p>
            <p className="text-[var(--mint)]">accepted: first_event_sent</p>
            <p className="text-[var(--amber)]">duplicate ignored: evt_48A</p>
            <p className="text-[var(--coral)]">rejected: missing event_id</p>
          </div>
        )}
      </div>
    </div>
  );
}
