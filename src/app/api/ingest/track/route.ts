import { isDatabaseConfigured } from "@/db/config";
import { maskApiKey, readBearerApiKey } from "@/features/ingestion/api-key";
import {
  normalizeTrackPayload,
  parseTrackPayload,
} from "@/features/ingestion/track-payload";
import { recordIngestionLog } from "@/features/ingestion/ingestion-log";
import {
  checkIngestionRateLimit,
  type IngestionRateLimitResult,
} from "@/features/ingestion/rate-limit";
import {
  resolveActiveApiKey,
  storeTrackEvent,
} from "@/features/ingestion/store-track-event";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    endpoint: "POST /api/ingest/track",
    mode: isDatabaseConfigured() ? "persisted" : "validation_only",
    required_header: "Authorization: Bearer po_live_...",
    required_fields: ["event_id", "event", "occurred_at", "user.external_id"],
    example: {
      event_id: "evt_demo_001",
      event: "first_event_sent",
      occurred_at: "2026-08-23T12:30:00.000Z",
      user: {
        external_id: "user_123",
        email: "founder@example.com",
      },
      company: {
        external_id: "company_456",
        name: "Northstar Labs",
      },
      properties: {
        source: "integration_docs",
      },
    },
  });
}

export async function POST(request: Request) {
  const receivedAt = new Date();
  const databaseConfigured = isDatabaseConfigured();
  const apiKeyResult = readBearerApiKey(request.headers.get("authorization"));

  if (!apiKeyResult.ok) {
    return Response.json(
      {
        error: {
          code: apiKeyResult.code,
          message: apiKeyResult.message,
        },
      },
      { status: 401 },
    );
  }

  const activeApiKey = databaseConfigured
    ? await resolveActiveApiKey(apiKeyResult.apiKey)
    : null;

  if (databaseConfigured && !activeApiKey) {
    return Response.json(
      {
        error: {
          code: "invalid_api_key",
          message: "API key was not found or has been revoked.",
        },
      },
      { status: 401 },
    );
  }

  let rateLimitHeaders: HeadersInit | undefined;

  if (activeApiKey) {
    const rateLimit = await checkIngestionRateLimit(activeApiKey, receivedAt);
    rateLimitHeaders = buildRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      await recordIngestionLog({
        apiKey: activeApiKey,
        status: "rejected",
        code: "rate_limit_exceeded",
        message: `This API key reached ${rateLimit.limit} requests per minute.`,
        payload: {
          limit: rateLimit.limit,
          reset_at: rateLimit.resetAt,
        },
        receivedAt,
      });

      return Response.json(
        {
          error: {
            code: "rate_limit_exceeded",
            message: `This API key reached ${rateLimit.limit} requests per minute. Try again after ${rateLimit.retryAfterSeconds} seconds.`,
            retry_after_seconds: rateLimit.retryAfterSeconds,
          },
        },
        { headers: rateLimitHeaders, status: 429 },
      );
    }
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    if (activeApiKey) {
      await recordIngestionLog({
        apiKey: activeApiKey,
        status: "rejected",
        code: "invalid_json",
        message: body.message,
        payload: {
          error: body.message,
        },
        receivedAt,
      });
    }

    return Response.json(
      {
        error: {
          code: "invalid_json",
          message: body.message,
        },
      },
      { headers: rateLimitHeaders, status: 400 },
    );
  }

  const parsed = parseTrackPayload(body.data);

  if (!parsed.ok) {
    if (activeApiKey) {
      await recordIngestionLog({
        apiKey: activeApiKey,
        status: "rejected",
        code: "invalid_payload",
        message: "The event payload does not match the PulseOps track contract.",
        payload: body.data,
        receivedAt,
      });
    }

    return Response.json(
      {
        error: {
          code: "invalid_payload",
          message: "The event payload does not match the PulseOps track contract.",
          issues: parsed.issues,
        },
      },
      { headers: rateLimitHeaders, status: 400 },
    );
  }

  const event = normalizeTrackPayload(parsed.data, receivedAt);

  if (!databaseConfigured) {
    return Response.json(
      {
        data: {
          accepted: true,
          mode: "validation_only",
          event_id: event.eventId,
          event: event.eventName,
          occurred_at: event.occurredAt.toISOString(),
          received_at: event.receivedAt.toISOString(),
          api_key_preview: maskApiKey(apiKeyResult.apiKey),
          next_step: "Set DATABASE_URL to persist events in PostgreSQL.",
        },
      },
      { status: 202 },
    );
  }

  const stored = await storeTrackEvent(
    apiKeyResult.apiKey,
    event,
    activeApiKey ?? undefined,
  );

  if (!stored.ok) {
    return Response.json(
      {
        error: {
          code: stored.code,
          message: stored.message,
        },
      },
      { headers: rateLimitHeaders, status: 401 },
    );
  }

  return Response.json(
    {
      data: {
        accepted: true,
        mode: "persisted",
        status: stored.status,
        project_id: stored.projectId,
        event_id: stored.eventId,
        stored_event_id: stored.storedEventId,
        event: event.eventName,
        occurred_at: event.occurredAt.toISOString(),
        received_at: event.receivedAt.toISOString(),
        api_key_preview: maskApiKey(apiKeyResult.apiKey),
      },
    },
    { headers: rateLimitHeaders, status: 202 },
  );
}

function buildRateLimitHeaders(
  rateLimit: IngestionRateLimitResult,
): HeadersInit {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(rateLimit.limit),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
  };

  if (!rateLimit.allowed) {
    headers["Retry-After"] = String(rateLimit.retryAfterSeconds);
  }

  return headers;
}

async function readJsonBody(
  request: Request,
): Promise<{ ok: true; data: unknown } | { ok: false; message: string }> {
  try {
    return {
      ok: true,
      data: await request.json(),
    };
  } catch {
    return {
      ok: false,
      message: "Request body must be valid JSON.",
    };
  }
}
