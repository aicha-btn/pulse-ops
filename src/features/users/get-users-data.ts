import { and, count, desc, eq, gte, isNotNull } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { isDatabaseConfigured } from "@/db/config";
import {
  companies,
  events,
  trackedUsers,
  type JsonObject,
} from "@/db/schema";
import {
  trackedUsers as demoTrackedUsers,
  type TrackedUserStatus,
  type TrackedUserSummary,
} from "@/features/demo/pulseops-demo-data";
import { getCurrentWorkspaceProject } from "@/features/workspaces/default-project";

export type UsersData = {
  source: "postgres" | "demo";
  sourceNote: string;
  users: TrackedUserSummary[];
};

export async function getUsersData(): Promise<UsersData> {
  if (!isDatabaseConfigured()) {
    return getDemoUsersData("DATABASE_URL is not configured yet.");
  }

  try {
    const project = await getCurrentWorkspaceProject();

    if (!project) {
      return getDemoUsersData("PostgreSQL is connected, but no project exists yet.");
    }

    const db = getDatabase();
    const fourteenDaysAgo = daysAgo(14);
    const userRows = await db
      .select({
        id: trackedUsers.id,
        externalId: trackedUsers.externalId,
        email: trackedUsers.email,
        name: trackedUsers.name,
        traits: trackedUsers.traits,
        firstSeenAt: trackedUsers.firstSeenAt,
        lastSeenAt: trackedUsers.lastSeenAt,
        companyName: companies.name,
        companyExternalId: companies.externalId,
      })
      .from(trackedUsers)
      .leftJoin(companies, eq(trackedUsers.companyId, companies.id))
      .where(eq(trackedUsers.projectId, project.id))
      .orderBy(desc(trackedUsers.lastSeenAt))
      .limit(100);

    const totalEventRows = await db
      .select({
        userId: events.userId,
        eventsCount: count(),
      })
      .from(events)
      .where(and(eq(events.projectId, project.id), isNotNull(events.userId)))
      .groupBy(events.userId);

    const recentEventRows = await db
      .select({
        userId: events.userId,
        eventsCount: count(),
      })
      .from(events)
      .where(
        and(
          eq(events.projectId, project.id),
          isNotNull(events.userId),
          gte(events.occurredAt, fourteenDaysAgo),
        ),
      )
      .groupBy(events.userId);

    const totalEventsByUser = toNumberMap(totalEventRows);
    const recentEventsByUser = toNumberMap(recentEventRows);

    return {
      source: "postgres",
      sourceNote: `Reading ${project.name} tracked users from Supabase PostgreSQL.`,
      users: userRows.map((user) => {
        const name = user.name ?? user.email ?? user.externalId;
        const email = user.email ?? "No email captured";

        return {
          id: user.id,
          name,
          email,
          externalId: user.externalId,
          company: user.companyName ?? user.companyExternalId ?? "Unassigned",
          role: readRole(user.traits),
          status: inferUserStatus(user.firstSeenAt, user.lastSeenAt),
          lastActivity: formatRelativeActivity(user.lastSeenAt),
          firstSeen: user.firstSeenAt ? formatDate(user.firstSeenAt) : "unknown",
          events14d: recentEventsByUser.get(user.id) ?? 0,
          totalEvents: totalEventsByUser.get(user.id) ?? 0,
        };
      }),
    };
  } catch (error) {
    console.error(error);
    return getDemoUsersData(
      "PostgreSQL is configured, but PulseOps could not read users yet.",
    );
  }
}

function getDemoUsersData(sourceNote: string): UsersData {
  return {
    source: "demo",
    sourceNote,
    users: demoTrackedUsers,
  };
}

function toNumberMap(rows: { userId: string | null; eventsCount: number }[]) {
  const map = new Map<string, number>();

  for (const row of rows) {
    if (row.userId) {
      map.set(row.userId, Number(row.eventsCount ?? 0));
    }
  }

  return map;
}

function inferUserStatus(
  firstSeenAt: Date | null,
  lastSeenAt: Date | null,
): TrackedUserStatus {
  if (!lastSeenAt) {
    return "silent";
  }

  const inactiveDays = Math.floor((Date.now() - lastSeenAt.getTime()) / 86_400_000);
  const ageDays = firstSeenAt
    ? Math.floor((Date.now() - firstSeenAt.getTime()) / 86_400_000)
    : Number.POSITIVE_INFINITY;

  if (ageDays <= 7 && inactiveDays <= 2) {
    return "new";
  }

  if (inactiveDays <= 2) {
    return "active";
  }

  if (inactiveDays <= 14) {
    return "cooling";
  }

  return "silent";
}

function readRole(traits: JsonObject | null) {
  const role = traits?.role;

  return typeof role === "string" && role.trim() ? role : "unknown";
}

function formatRelativeActivity(date: Date | null) {
  if (!date) {
    return "never";
  }

  const hours = Math.max(1, Math.floor((Date.now() - date.getTime()) / 3_600_000));

  if (hours < 24) {
    return `${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
  }).format(date);
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}
