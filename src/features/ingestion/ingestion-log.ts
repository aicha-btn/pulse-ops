import { getDatabase } from "@/db/client";
import { ingestionErrors, type JsonObject, type JsonValue } from "@/db/schema";

export type IngestionApiKeyContext = {
  id: string;
  projectId: string;
};

type RecordIngestionLogInput = {
  apiKey: IngestionApiKeyContext;
  code: string;
  message: string;
  payload?: unknown;
  receivedAt: Date;
  status: "ignored" | "rejected";
};

export async function recordIngestionLog({
  apiKey,
  code,
  message,
  payload,
  receivedAt,
  status,
}: RecordIngestionLogInput) {
  const db = getDatabase();

  await db.insert(ingestionErrors).values({
    projectId: apiKey.projectId,
    apiKeyId: apiKey.id,
    status,
    code,
    message,
    payloadPreview: buildPayloadPreview(payload),
    receivedAt,
  });
}

export function buildPayloadPreview(payload: unknown): JsonObject {
  if (payload === undefined) {
    return {};
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      value: toJsonValue(payload),
    };
  }

  const preview: JsonObject = {};

  for (const [key, value] of Object.entries(payload).slice(0, 16)) {
    preview[key.slice(0, 80)] = toJsonValue(value);
  }

  return preview;
}

function toJsonValue(value: unknown, depth = 0): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value === undefined) {
    return null;
  }

  if (depth >= 2) {
    return "[nested]";
  }

  if (Array.isArray(value)) {
    return value.slice(0, 10).map((item) => toJsonValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const objectValue: JsonObject = {};

    for (const [key, childValue] of Object.entries(value).slice(0, 10)) {
      objectValue[key.slice(0, 80)] = toJsonValue(childValue, depth + 1);
    }

    return objectValue;
  }

  return String(value).slice(0, 500);
}
