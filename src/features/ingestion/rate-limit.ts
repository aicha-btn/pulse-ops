import { sql } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { ingestionRateLimits } from "@/db/schema";
import type { IngestionApiKeyContext } from "@/features/ingestion/ingestion-log";

const DEFAULT_INGESTION_RATE_LIMIT_PER_MINUTE = 120;
const MAX_INGESTION_RATE_LIMIT_PER_MINUTE = 10_000;
const RATE_LIMIT_WINDOW_MS = 60_000;

type EvaluateIngestionRateLimitInput = {
  limit: number;
  receivedAt: Date;
  requestCount: number;
  windowStart: Date;
};

type EnvLike = Record<string, string | undefined>;

export type IngestionRateLimitResult =
  | {
      allowed: true;
      limit: number;
      remaining: number;
      resetAt: Date;
    }
  | {
      allowed: false;
      limit: number;
      remaining: 0;
      resetAt: Date;
      retryAfterSeconds: number;
    };

export async function checkIngestionRateLimit(
  apiKey: IngestionApiKeyContext,
  receivedAt = new Date(),
): Promise<IngestionRateLimitResult> {
  const limit = getIngestionRateLimitPerMinute();
  const windowStart = getMinuteWindowStart(receivedAt);
  const db = getDatabase();

  const [bucket] = await db
    .insert(ingestionRateLimits)
    .values({
      apiKeyId: apiKey.id,
      projectId: apiKey.projectId,
      requestCount: 1,
      updatedAt: receivedAt,
      windowStart,
    })
    .onConflictDoUpdate({
      target: [
        ingestionRateLimits.apiKeyId,
        ingestionRateLimits.windowStart,
      ],
      set: {
        requestCount: sql`${ingestionRateLimits.requestCount} + 1`,
        updatedAt: receivedAt,
      },
    })
    .returning({
      requestCount: ingestionRateLimits.requestCount,
    });

  const requestCount = bucket?.requestCount ?? limit + 1;

  return evaluateIngestionRateLimit({
    limit,
    receivedAt,
    requestCount,
    windowStart,
  });
}

export function evaluateIngestionRateLimit({
  limit,
  receivedAt,
  requestCount,
  windowStart,
}: EvaluateIngestionRateLimitInput): IngestionRateLimitResult {
  const resetAt = new Date(windowStart.getTime() + RATE_LIMIT_WINDOW_MS);
  const remaining = Math.max(limit - requestCount, 0);

  if (requestCount > limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((resetAt.getTime() - receivedAt.getTime()) / 1000),
      ),
    };
  }

  return {
    allowed: true,
    limit,
    remaining,
    resetAt,
  };
}

export function getIngestionRateLimitPerMinute(env: EnvLike = process.env) {
  const rawLimit = env.INGESTION_RATE_LIMIT_PER_MINUTE?.trim();

  if (!rawLimit) {
    return DEFAULT_INGESTION_RATE_LIMIT_PER_MINUTE;
  }

  const parsedLimit = Number.parseInt(rawLimit, 10);

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    return DEFAULT_INGESTION_RATE_LIMIT_PER_MINUTE;
  }

  return Math.min(parsedLimit, MAX_INGESTION_RATE_LIMIT_PER_MINUTE);
}

function getMinuteWindowStart(date: Date) {
  return new Date(
    Math.floor(date.getTime() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS,
  );
}
