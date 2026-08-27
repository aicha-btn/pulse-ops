import { and, eq, sql } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import {
  apiKeys,
  companies,
  events,
  ingestionErrors,
  trackedUsers,
} from "@/db/schema";
import { hashApiKey } from "@/features/ingestion/api-key";
import {
  buildPayloadPreview,
  type IngestionApiKeyContext,
} from "@/features/ingestion/ingestion-log";
import type { NormalizedTrackEvent } from "@/features/ingestion/track-payload";

export type StoreTrackEventResult =
  | {
      ok: true;
      status: "stored" | "duplicate_ignored";
      apiKeyId: string;
      projectId: string;
      eventId: string;
      storedEventId?: string;
    }
  | {
      ok: false;
      code: "invalid_api_key";
      message: string;
    };

export async function storeTrackEvent(
  apiKey: string,
  event: NormalizedTrackEvent,
  activeApiKey?: IngestionApiKeyContext,
): Promise<StoreTrackEventResult> {
  const db = getDatabase();
  const now = new Date();
  const keyRecord = activeApiKey ?? (await resolveActiveApiKey(apiKey));

  if (!keyRecord) {
    return {
      ok: false,
      code: "invalid_api_key",
      message: "API key was not found or has been revoked.",
    };
  }

  return db.transaction(async (tx) => {
    const companyId = event.company
      ? await upsertCompany(tx, keyRecord.projectId, event, now)
      : null;

    const userId = await upsertTrackedUser(
      tx,
      keyRecord.projectId,
      companyId,
      event,
      now,
    );

    const [storedEvent] = await tx
      .insert(events)
      .values({
        projectId: keyRecord.projectId,
        companyId,
        userId,
        eventId: event.eventId,
        name: event.eventName,
        occurredAt: event.occurredAt,
        receivedAt: event.receivedAt,
        properties: event.properties,
      })
      .onConflictDoNothing({
        target: [events.projectId, events.eventId],
      })
      .returning({
        id: events.id,
      });

    await tx
      .update(apiKeys)
      .set({
        lastUsedAt: event.receivedAt,
      })
      .where(eq(apiKeys.id, keyRecord.id));

    if (!storedEvent) {
      await tx.insert(ingestionErrors).values({
        projectId: keyRecord.projectId,
        apiKeyId: keyRecord.id,
        status: "ignored",
        code: "duplicate_event_id",
        message:
          "Event was ignored because this event_id already exists for the project.",
        payloadPreview: buildPayloadPreview({
          event_id: event.eventId,
          event: event.eventName,
          occurred_at: event.occurredAt,
          user: event.user,
          company: event.company,
          properties: event.properties,
        }),
        receivedAt: event.receivedAt,
      });
    }

    return {
      ok: true,
      status: storedEvent ? "stored" : "duplicate_ignored",
      apiKeyId: keyRecord.id,
      projectId: keyRecord.projectId,
      eventId: event.eventId,
      storedEventId: storedEvent?.id,
    };
  });
}

export async function resolveActiveApiKey(
  apiKey: string,
): Promise<IngestionApiKeyContext | null> {
  const db = getDatabase();
  const keyHash = hashApiKey(apiKey);
  const [keyRecord] = await db
    .select({
      id: apiKeys.id,
      projectId: apiKeys.projectId,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.status, "active")))
    .limit(1);

  return keyRecord ?? null;
}

async function upsertCompany(
  tx: Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0],
  projectId: string,
  event: NormalizedTrackEvent,
  now: Date,
) {
  if (!event.company) {
    return null;
  }

  const [company] = await tx
    .insert(companies)
    .values({
      projectId,
      externalId: event.company.externalId,
      name: event.company.name ?? null,
      traits: event.company.traits,
      firstSeenAt: event.occurredAt,
      lastSeenAt: event.occurredAt,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [companies.projectId, companies.externalId],
      set: {
        name: sql`coalesce(excluded.name, ${companies.name})`,
        traits: sql`${companies.traits} || excluded.traits`,
        lastSeenAt: sql`greatest(coalesce(${companies.lastSeenAt}, excluded.last_seen_at), excluded.last_seen_at)`,
        updatedAt: now,
      },
    })
    .returning({
      id: companies.id,
    });

  return company.id;
}

async function upsertTrackedUser(
  tx: Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0],
  projectId: string,
  companyId: string | null,
  event: NormalizedTrackEvent,
  now: Date,
) {
  const [user] = await tx
    .insert(trackedUsers)
    .values({
      projectId,
      companyId,
      externalId: event.user.externalId,
      email: event.user.email ?? null,
      name: event.user.name ?? null,
      traits: event.user.traits,
      firstSeenAt: event.occurredAt,
      lastSeenAt: event.occurredAt,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [trackedUsers.projectId, trackedUsers.externalId],
      set: {
        companyId,
        email: sql`coalesce(excluded.email, ${trackedUsers.email})`,
        name: sql`coalesce(excluded.name, ${trackedUsers.name})`,
        traits: sql`${trackedUsers.traits} || excluded.traits`,
        lastSeenAt: sql`greatest(coalesce(${trackedUsers.lastSeenAt}, excluded.last_seen_at), excluded.last_seen_at)`,
        updatedAt: now,
      },
    })
    .returning({
      id: trackedUsers.id,
    });

  return user.id;
}
