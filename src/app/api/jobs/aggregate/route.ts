import { timingSafeEqual } from "crypto";

import { isDatabaseConfigured } from "@/db/config";
import { aggregateAllProjects } from "@/features/aggregations/aggregate-project";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleAggregationRequest(request);
}

export async function POST(request: Request) {
  return handleAggregationRequest(request);
}

async function handleAggregationRequest(request: Request) {
  const authorization = authorizeCronRequest(request);

  if (!authorization.ok) {
    return Response.json(
      {
        error: {
          code: authorization.code,
          message: authorization.message,
        },
      },
      { status: authorization.status },
    );
  }

  if (!isDatabaseConfigured()) {
    return Response.json(
      {
        error: {
          code: "database_not_configured",
          message: "DATABASE_URL is required before aggregation jobs can run.",
        },
      },
      { status: 503 },
    );
  }

  try {
    const result = await aggregateAllProjects();

    return Response.json({
      data: {
        accepted: true,
        ...result,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown aggregation error.";

    return Response.json(
      {
        error: {
          code: "aggregation_failed",
          message,
        },
      },
      { status: 500 },
    );
  }
}

function authorizeCronRequest(request: Request):
  | {
      ok: true;
    }
  | {
      ok: false;
      status: 401 | 503;
      code: "cron_secret_missing" | "unauthorized";
      message: string;
    } {
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return {
      ok: false,
      status: 503,
      code: "cron_secret_missing",
      message: "CRON_SECRET must be configured before this job can run.",
    };
  }

  const authorization = request.headers.get("authorization");
  const receivedSecret = authorization?.replace(/^Bearer\s+/i, "");

  if (!receivedSecret || !secretsMatch(receivedSecret, expectedSecret)) {
    return {
      ok: false,
      status: 401,
      code: "unauthorized",
      message: "Use Authorization: Bearer <CRON_SECRET>.",
    };
  }

  return {
    ok: true,
  };
}

function secretsMatch(receivedSecret: string, expectedSecret: string) {
  const received = Buffer.from(receivedSecret);
  const expected = Buffer.from(expectedSecret);

  if (received.byteLength !== expected.byteLength) {
    return false;
  }

  return timingSafeEqual(received, expected);
}
