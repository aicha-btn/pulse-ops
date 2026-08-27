import { z } from "zod";

import type { JsonObject, JsonValue } from "@/db/schema";

const MAX_PAYLOAD_BYTES = 64 * 1024;
const MAX_JSON_DEPTH = 4;
const MAX_ARRAY_LENGTH = 100;
const MAX_OBJECT_KEYS = 50;
const RESERVED_PROPERTY_KEYS = new Set([
  "event_id",
  "event",
  "occurred_at",
  "received_at",
  "user",
  "company",
]);

const traitsSchema = z.record(z.string().min(1).max(64), z.unknown()).default({});

const userSchema = z
  .object({
    external_id: z.string().min(1).max(160),
    email: z.string().email().max(254).optional(),
    name: z.string().min(1).max(160).optional(),
    traits: traitsSchema.optional(),
  })
  .strict();

const companySchema = z
  .object({
    external_id: z.string().min(1).max(160),
    name: z.string().min(1).max(160).optional(),
    traits: traitsSchema.optional(),
  })
  .strict();

const rawTrackPayloadSchema = z
  .object({
    event_id: z.string().min(1).max(160),
    event: z
      .string()
      .min(1)
      .max(160)
      .regex(/^[a-z][a-z0-9_:.]*$/, {
        message:
          "Use a stable event name like signed_up or first_event_sent.",
      }),
    occurred_at: z.string().datetime({ offset: true }),
    user: userSchema,
    company: companySchema.optional(),
    properties: z
      .record(z.string().min(1).max(64), z.unknown())
      .default({}),
  })
  .strict();

export type TrackPayload = z.infer<typeof rawTrackPayloadSchema> & {
  user: z.infer<typeof userSchema> & { traits?: JsonObject };
  company?: z.infer<typeof companySchema> & { traits?: JsonObject };
  properties: JsonObject;
};

export type NormalizedTrackEvent = {
  eventId: string;
  eventName: string;
  occurredAt: Date;
  receivedAt: Date;
  user: {
    externalId: string;
    email?: string;
    name?: string;
    traits: JsonObject;
  };
  company?: {
    externalId: string;
    name?: string;
    traits: JsonObject;
  };
  properties: JsonObject;
};

export type TrackValidationIssue = {
  path: string;
  code: string;
  message: string;
};

export type TrackParseResult =
  | {
      ok: true;
      data: TrackPayload;
    }
  | {
      ok: false;
      issues: TrackValidationIssue[];
    };

export function parseTrackPayload(payload: unknown): TrackParseResult {
  const sizeIssue = validatePayloadSize(payload);

  if (sizeIssue) {
    return {
      ok: false,
      issues: [sizeIssue],
    };
  }

  const parsed = rawTrackPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        path: formatPath(issue.path),
        code: issue.code,
        message: issue.message,
      })),
    };
  }

  const jsonIssues = [
    ...inspectJsonObject(parsed.data.properties, "properties"),
    ...inspectJsonObject(parsed.data.user.traits ?? {}, "user.traits"),
    ...inspectJsonObject(parsed.data.company?.traits ?? {}, "company.traits"),
  ];

  if (jsonIssues.length > 0) {
    return {
      ok: false,
      issues: jsonIssues,
    };
  }

  return {
    ok: true,
    data: {
      ...parsed.data,
      properties: parsed.data.properties as JsonObject,
      user: {
        ...parsed.data.user,
        traits: (parsed.data.user.traits ?? {}) as JsonObject,
      },
      company: parsed.data.company
        ? {
            ...parsed.data.company,
            traits: (parsed.data.company.traits ?? {}) as JsonObject,
          }
        : undefined,
    },
  };
}

export function normalizeTrackPayload(
  payload: TrackPayload,
  receivedAt = new Date(),
): NormalizedTrackEvent {
  return {
    eventId: payload.event_id,
    eventName: payload.event,
    occurredAt: new Date(payload.occurred_at),
    receivedAt,
    user: {
      externalId: payload.user.external_id,
      email: payload.user.email,
      name: payload.user.name,
      traits: payload.user.traits ?? {},
    },
    company: payload.company
      ? {
          externalId: payload.company.external_id,
          name: payload.company.name,
          traits: payload.company.traits ?? {},
        }
      : undefined,
    properties: payload.properties,
  };
}

function validatePayloadSize(payload: unknown): TrackValidationIssue | undefined {
  const bytes = new TextEncoder().encode(JSON.stringify(payload)).byteLength;

  if (bytes > MAX_PAYLOAD_BYTES) {
    return {
      path: "$",
      code: "payload_too_large",
      message: "Payload must stay under 64 KB.",
    };
  }
}

function inspectJsonObject(value: unknown, path: string): TrackValidationIssue[] {
  const issues: TrackValidationIssue[] = [];
  inspectJsonValue(value, path, 0, issues);
  return issues;
}

function inspectJsonValue(
  value: unknown,
  path: string,
  depth: number,
  issues: TrackValidationIssue[],
): value is JsonValue {
  if (depth > MAX_JSON_DEPTH) {
    issues.push({
      path,
      code: "json_too_deep",
      message: `JSON data cannot be deeper than ${MAX_JSON_DEPTH} levels.`,
    });
    return false;
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (typeof value === "number") {
    if (Number.isFinite(value)) {
      return true;
    }

    issues.push({
      path,
      code: "invalid_number",
      message: "JSON numbers must be finite.",
    });
    return false;
  }

  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_LENGTH) {
      issues.push({
        path,
        code: "array_too_long",
        message: `Arrays cannot contain more than ${MAX_ARRAY_LENGTH} items.`,
      });
      return false;
    }

    value.forEach((item, index) => {
      inspectJsonValue(item, `${path}.${index}`, depth + 1, issues);
    });
    return issues.length === 0;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);

    if (entries.length > MAX_OBJECT_KEYS) {
      issues.push({
        path,
        code: "object_too_wide",
        message: `Objects cannot contain more than ${MAX_OBJECT_KEYS} keys.`,
      });
      return false;
    }

    for (const [key, item] of entries) {
      if (RESERVED_PROPERTY_KEYS.has(key)) {
        issues.push({
          path: `${path}.${key}`,
          code: "reserved_key",
          message: `${key} is a reserved PulseOps field.`,
        });
      }

      inspectJsonValue(item, `${path}.${key}`, depth + 1, issues);
    }

    return issues.length === 0;
  }

  issues.push({
    path,
    code: "invalid_json_value",
    message: "Only strings, numbers, booleans, null, arrays and objects are allowed.",
  });
  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function formatPath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return "$";
  }

  return path.map(String).join(".");
}
