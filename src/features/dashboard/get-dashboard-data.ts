import { cache } from "react";
import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  isNotNull,
  sql,
} from "drizzle-orm";

import { isDatabaseConfigured } from "@/db/config";
import { getDatabase } from "@/db/client";
import {
  activationFunnels,
  activationFunnelSteps,
  companies as companiesTable,
  companyHealthSnapshots,
  dailyProjectMetrics,
  events,
  funnelStepMetrics,
  ingestionErrors,
  trackedUsers,
  type JsonObject,
  type JsonValue,
} from "@/db/schema";
import { getAuthState } from "@/features/auth/session";
import {
  activationFunnel as demoActivationFunnel,
  activitySeries as demoActivitySeries,
  companies as demoCompanies,
  integrationCurl,
  overviewMetrics as demoOverviewMetrics,
  recentEvents as demoRecentEvents,
  type CompanySummary,
  type HealthScoreBreakdown,
  type HealthStatus,
  type RecentEvent,
} from "@/features/demo/pulseops-demo-data";
import {
  getCurrentWorkspaceProject,
} from "@/features/workspaces/default-project";

export type DashboardDataSource = "postgres" | "demo";

export type DashboardData = {
  source: DashboardDataSource;
  sourceNote: string;
  projectName: string;
  lastCalculationLabel: string;
  overviewMetrics: typeof demoOverviewMetrics;
  activitySeries: typeof demoActivitySeries;
  activationFunnel: typeof demoActivationFunnel;
  companies: CompanySummary[];
  recentEvents: RecentEvent[];
  integrationCurl: string;
};

export const getDashboardData = cache(async (): Promise<DashboardData> => {
  if (!isDatabaseConfigured()) {
    return getDemoDashboardData("DATABASE_URL is not configured yet.");
  }

  try {
    const db = getDatabase();
    const authState = await getAuthState();

    if (authState.status === "signed_out") {
      return getDemoDashboardData("Sign in to read your Supabase workspace.");
    }

    const project = await getCurrentWorkspaceProject();

    if (!project) {
      return getDemoDashboardData("PostgreSQL is connected, but no project exists yet.");
    }

    const sourceNote =
      authState.status === "signed_in"
        ? `Reading ${project.workspaceName} from Supabase PostgreSQL.`
        : "Reading from Supabase PostgreSQL.";

    const [eventCountResult] = await db
      .select({
        value: count(),
      })
      .from(events)
      .where(eq(events.projectId, project.id));

    const fourteenDaysAgo = daysAgo(14);
    const ninetyDaysAgo = daysAgo(90);

    const [activeCompaniesResult] = await db
      .select({
        value: countDistinct(events.companyId),
      })
      .from(events)
      .where(
        and(
          eq(events.projectId, project.id),
          isNotNull(events.companyId),
          gte(events.occurredAt, fourteenDaysAgo),
        ),
      );

    const companyRows = await db
      .select({
        id: companiesTable.id,
        name: companiesTable.name,
        externalId: companiesTable.externalId,
        traits: companiesTable.traits,
        lastSeenAt: companiesTable.lastSeenAt,
      })
      .from(companiesTable)
      .where(eq(companiesTable.projectId, project.id))
      .orderBy(desc(companiesTable.lastSeenAt))
      .limit(20);

    const rolledUpActivityRows = await db
      .select({
        bucket: sql<string>`to_char(date_trunc('week', ${dailyProjectMetrics.day}), 'Mon DD')`,
        events: sql<number>`coalesce(sum(${dailyProjectMetrics.eventsCount}), 0)::int`,
        accounts: sql<number>`coalesce(max(${dailyProjectMetrics.activeCompaniesCount}), 0)::int`,
      })
      .from(dailyProjectMetrics)
      .where(
        and(
          eq(dailyProjectMetrics.projectId, project.id),
          gte(dailyProjectMetrics.day, toDateKey(ninetyDaysAgo)),
        ),
      )
      .groupBy(sql`date_trunc('week', ${dailyProjectMetrics.day})`)
      .orderBy(sql`date_trunc('week', ${dailyProjectMetrics.day})`);

    const liveActivityRows = await db
      .select({
        bucket: sql<string>`to_char(date_trunc('week', ${events.occurredAt}), 'Mon DD')`,
        events: count(),
        accounts: countDistinct(events.companyId),
      })
      .from(events)
      .where(and(eq(events.projectId, project.id), gte(events.occurredAt, ninetyDaysAgo)))
      .groupBy(sql`date_trunc('week', ${events.occurredAt})`)
      .orderBy(sql`date_trunc('week', ${events.occurredAt})`);

    const activityRows =
      rolledUpActivityRows.length > 0 ? rolledUpActivityRows : liveActivityRows;

    const funnelRows = await db
      .select({
        step: activationFunnelSteps.eventName,
        orderIndex: activationFunnelSteps.orderIndex,
      })
      .from(activationFunnelSteps)
      .innerJoin(
        activationFunnels,
        eq(activationFunnelSteps.funnelId, activationFunnels.id),
      )
      .where(eq(activationFunnels.projectId, project.id))
      .orderBy(activationFunnelSteps.orderIndex);

    const eventRows = await db
      .select({
        id: events.eventId,
        event: events.name,
        company: companiesTable.name,
        companyExternalId: companiesTable.externalId,
        userEmail: trackedUsers.email,
        userExternalId: trackedUsers.externalId,
        occurredAt: events.occurredAt,
        receivedAt: events.receivedAt,
      })
      .from(events)
      .leftJoin(companiesTable, eq(events.companyId, companiesTable.id))
      .leftJoin(trackedUsers, eq(events.userId, trackedUsers.id))
      .where(eq(events.projectId, project.id))
      .orderBy(desc(events.receivedAt))
      .limit(20);

    const ingestionLogRows = await db
      .select({
        id: ingestionErrors.id,
        status: ingestionErrors.status,
        code: ingestionErrors.code,
        message: ingestionErrors.message,
        payloadPreview: ingestionErrors.payloadPreview,
        receivedAt: ingestionErrors.receivedAt,
      })
      .from(ingestionErrors)
      .where(eq(ingestionErrors.projectId, project.id))
      .orderBy(desc(ingestionErrors.receivedAt))
      .limit(20);

    const activeUsersByCompanyRows = await db
      .select({
        companyId: events.companyId,
        activeUsers: countDistinct(events.userId),
      })
      .from(events)
      .where(
        and(
          eq(events.projectId, project.id),
          isNotNull(events.companyId),
          isNotNull(events.userId),
          gte(events.occurredAt, fourteenDaysAgo),
        ),
      )
      .groupBy(events.companyId);

    const activeUsersByCompany = new Map(
      activeUsersByCompanyRows
        .filter((row) => row.companyId)
        .map((row) => [row.companyId as string, row.activeUsers]),
    );

    const latestHealthRows = await db
      .select({
        companyId: companyHealthSnapshots.companyId,
        score: companyHealthSnapshots.score,
        status: companyHealthSnapshots.status,
        recentActivityPoints: companyHealthSnapshots.recentActivityPoints,
        frequencyPoints: companyHealthSnapshots.frequencyPoints,
        funnelPoints: companyHealthSnapshots.funnelPoints,
        keyEventPoints: companyHealthSnapshots.keyEventPoints,
        reasons: companyHealthSnapshots.reasons,
        calculatedAt: companyHealthSnapshots.calculatedAt,
      })
      .from(companyHealthSnapshots)
      .where(eq(companyHealthSnapshots.projectId, project.id))
      .orderBy(desc(companyHealthSnapshots.calculatedAt))
      .limit(500);

    const latestHealthByCompany = new Map<
      string,
      {
        score: number;
        status: HealthStatus;
        reason: string;
        healthBreakdown: HealthScoreBreakdown;
        healthScoreSource: CompanySummary["healthScoreSource"];
        calculatedAt: Date;
      }
    >();

    for (const health of latestHealthRows) {
      if (!latestHealthByCompany.has(health.companyId)) {
        latestHealthByCompany.set(health.companyId, {
          score: health.score,
          status: health.status,
          healthBreakdown: {
            recentActivityPoints: health.recentActivityPoints,
            frequencyPoints: health.frequencyPoints,
            funnelPoints: health.funnelPoints,
            keyEventPoints: health.keyEventPoints,
          },
          healthScoreSource: "calculated",
          reason: health.reasons[0] ?? "Health score calculated from recent activity.",
          calculatedAt: health.calculatedAt,
        });
      }
    }

    const companies = companyRows.map((company): CompanySummary => {
      const fallbackHealth = inferHealth(company.lastSeenAt);
      const health = latestHealthByCompany.get(company.id) ?? fallbackHealth;
      const plan = readPlan(company.traits);

      return {
        id: company.id,
        name: company.name ?? company.externalId,
        plan,
        score: health.score,
        status: health.status,
        lastActivity: formatRelativeActivity(company.lastSeenAt),
        activeUsers: activeUsersByCompany.get(company.id) ?? 0,
        trend: health.status === "healthy" ? "flat" : "down",
        activationStep: "first_event_sent",
        reason: health.reason,
        healthBreakdown: health.healthBreakdown,
        healthScoreSource: health.healthScoreSource,
      };
    });

    const activationFunnel = await buildFunnel(project.id, funnelRows);
    const latestCalculation = latestHealthRows[0]?.calculatedAt;

    return {
      source: "postgres",
      sourceNote,
      projectName: project.name,
      lastCalculationLabel: latestCalculation ? formatTime(latestCalculation) : "live query",
      overviewMetrics: [
        {
          label: "Activation",
          value: `${activationFunnel.at(-1)?.rate ?? 0}%`,
          delta: "live",
          tone: "neutral",
          note: "Users reaching each funnel event.",
        },
        {
          label: "Silent accounts",
          value: String(companies.filter((company) => company.status === "silent").length),
          delta: "14 days",
          tone: "risk",
          note: "No activity for at least 14 days.",
        },
        {
          label: "Active accounts",
          value: String(activeCompaniesResult?.value ?? 0),
          delta: "14 days",
          tone: "good",
          note: "At least one recent event.",
        },
        {
          label: "Events received",
          value: formatCompactNumber(eventCountResult?.value ?? 0),
          delta: "all time",
          tone: "neutral",
          note: "Stored through ingestion.",
        },
      ],
      activitySeries: activityRows.map((row) => ({
        day: row.bucket,
        events: row.events,
        accounts: row.accounts,
      })),
      activationFunnel,
      companies,
      recentEvents: mergeRecentEvents(eventRows, ingestionLogRows),
      integrationCurl: getIntegrationCurl(),
    };
  } catch (error) {
    console.error(error);
    return getDemoDashboardData(
      "PostgreSQL is configured, but PulseOps could not read it yet.",
    );
  }
});

function getDemoDashboardData(sourceNote: string): DashboardData {
  return {
    source: "demo",
    sourceNote,
    projectName: "Northstar Analytics",
    lastCalculationLabel: "14:35",
    overviewMetrics: demoOverviewMetrics,
    activitySeries: demoActivitySeries,
    activationFunnel: demoActivationFunnel,
    companies: demoCompanies,
    recentEvents: demoRecentEvents,
    integrationCurl: getIntegrationCurl(),
  };
}

type EventRow = {
  id: string;
  event: string;
  company: string | null;
  companyExternalId: string | null;
  userEmail: string | null;
  userExternalId: string | null;
  occurredAt: Date;
  receivedAt: Date;
};

type IngestionLogRow = {
  id: string;
  status: "ignored" | "rejected" | "stored";
  code: string;
  message: string;
  payloadPreview: JsonObject | null;
  receivedAt: Date;
};

function mergeRecentEvents(
  eventRows: EventRow[],
  ingestionLogRows: IngestionLogRow[],
): RecentEvent[] {
  const acceptedEvents = eventRows.map((event) => ({
    id: event.id,
    event: event.event,
    company: event.company ?? event.companyExternalId ?? "Unassigned",
    user: event.userEmail ?? event.userExternalId ?? "Unknown user",
    occurredAt: formatTime(event.occurredAt),
    status: "accepted" as const,
    sortAt: event.receivedAt,
  }));

  const loggedEvents = ingestionLogRows.map((log) => ({
    id: log.id,
    event: readEventFromPreview(log.payloadPreview) ?? log.code,
    company: readCompanyFromPreview(log.payloadPreview),
    user: readUserFromPreview(log.payloadPreview) ?? log.message,
    occurredAt: formatTime(log.receivedAt),
    status: mapIngestionStatus(log.status),
    sortAt: log.receivedAt,
  }));

  return [...acceptedEvents, ...loggedEvents]
    .sort((left, right) => right.sortAt.getTime() - left.sortAt.getTime())
    .slice(0, 20)
    .map(({ sortAt, ...event }) => {
      void sortAt;
      return event;
    });
}

function mapIngestionStatus(
  status: IngestionLogRow["status"],
): RecentEvent["status"] {
  if (status === "ignored") {
    return "ignored";
  }

  if (status === "stored") {
    return "accepted";
  }

  return "rejected";
}

function readEventFromPreview(preview: JsonObject | null) {
  return readString(preview?.event) ?? readString(preview?.event_id);
}

function readCompanyFromPreview(preview: JsonObject | null) {
  const company = preview?.company;

  if (isJsonObject(company)) {
    return (
      readString(company.name) ??
      readString(company.external_id) ??
      readString(company.externalId) ??
      "Unassigned"
    );
  }

  return readString(company) ?? "Unassigned";
}

function readUserFromPreview(preview: JsonObject | null) {
  const user = preview?.user;

  if (isJsonObject(user)) {
    return (
      readString(user.email) ??
      readString(user.external_id) ??
      readString(user.externalId)
    );
  }

  return readString(user);
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readString(value: JsonValue | undefined) {
  return typeof value === "string" && value.trim() ? value : null;
}

async function buildFunnelFromEvents(
  projectId: string,
  configuredSteps: { step: string; orderIndex: number }[],
) {
  const steps =
    configuredSteps.length > 0
      ? configuredSteps
      : demoActivationFunnel.map((step, index) => ({
          step: step.step,
          orderIndex: index,
        }));

  const db = getDatabase();
  const reached = await Promise.all(
    steps.map(async (step) => {
      const [result] = await db
        .select({
          users: countDistinct(events.userId),
        })
        .from(events)
        .where(and(eq(events.projectId, projectId), eq(events.name, step.step)));

      return {
        step: step.step,
        users: result?.users ?? 0,
      };
    }),
  );

  const firstStepUsers = reached[0]?.users ?? 0;

  return reached.map((step) => ({
    ...step,
    rate:
      firstStepUsers > 0 ? Math.round((step.users / firstStepUsers) * 100) : 0,
  }));
}

async function buildFunnel(
  projectId: string,
  configuredSteps: { step: string; orderIndex: number }[],
) {
  const db = getDatabase();
  const [latestPeriod] = await db
    .select({
      periodStart: funnelStepMetrics.periodStart,
      periodEnd: funnelStepMetrics.periodEnd,
    })
    .from(funnelStepMetrics)
    .where(eq(funnelStepMetrics.projectId, projectId))
    .orderBy(desc(funnelStepMetrics.createdAt))
    .limit(1);

  if (!latestPeriod) {
    return buildFunnelFromEvents(projectId, configuredSteps);
  }

  const rows = await db
    .select({
      step: funnelStepMetrics.eventName,
      users: funnelStepMetrics.usersReached,
      conversionRateBasisPoints: funnelStepMetrics.conversionRateBasisPoints,
    })
    .from(funnelStepMetrics)
    .where(
      and(
        eq(funnelStepMetrics.projectId, projectId),
        eq(funnelStepMetrics.periodStart, latestPeriod.periodStart),
        eq(funnelStepMetrics.periodEnd, latestPeriod.periodEnd),
      ),
    )
    .orderBy(funnelStepMetrics.orderIndex);

  return rows.map((row) => ({
    step: row.step,
    users: row.users,
    rate: Math.round(row.conversionRateBasisPoints / 100),
  }));
}

type InferredHealth = {
  score: number;
  status: HealthStatus;
  reason: string;
  healthBreakdown: HealthScoreBreakdown;
  healthScoreSource: CompanySummary["healthScoreSource"];
};

function inferHealth(lastSeenAt: Date | null): InferredHealth {
  if (!lastSeenAt) {
    const score = 20;

    return {
      score,
      status: "silent" satisfies HealthStatus,
      reason: "No tracked activity has been received for this account yet.",
      healthBreakdown: estimateBreakdown(score),
      healthScoreSource: "estimated",
    };
  }

  const inactiveDays = Math.floor((Date.now() - lastSeenAt.getTime()) / 86_400_000);

  if (inactiveDays <= 2) {
    const score = 82;

    return {
      score,
      status: "healthy" satisfies HealthStatus,
      reason: "Recent activity suggests the account is still in rhythm.",
      healthBreakdown: estimateBreakdown(score),
      healthScoreSource: "estimated",
    };
  }

  if (inactiveDays <= 7) {
    const score = 64;

    return {
      score,
      status: "watch" satisfies HealthStatus,
      reason: "Activity is recent, but the rhythm is starting to slow.",
      healthBreakdown: estimateBreakdown(score),
      healthScoreSource: "estimated",
    };
  }

  if (inactiveDays <= 14) {
    const score = 46;

    return {
      score,
      status: "at_risk" satisfies HealthStatus,
      reason: "The account has not sent activity in more than a week.",
      healthBreakdown: estimateBreakdown(score),
      healthScoreSource: "estimated",
    };
  }

  const score = 28;

  return {
    score,
    status: "silent" satisfies HealthStatus,
    reason: "No tracked activity for at least 14 days.",
    healthBreakdown: estimateBreakdown(score),
    healthScoreSource: "estimated",
  };
}

function estimateBreakdown(score: number): HealthScoreBreakdown {
  const recentActivityPoints = Math.min(40, score);
  const remainingAfterRecent = score - recentActivityPoints;
  const frequencyPoints = Math.min(25, Math.max(0, remainingAfterRecent));
  const remainingAfterFrequency = remainingAfterRecent - frequencyPoints;
  const funnelPoints = Math.min(20, Math.max(0, remainingAfterFrequency));
  const keyEventPoints = Math.min(
    15,
    Math.max(0, remainingAfterFrequency - funnelPoints),
  );

  return {
    recentActivityPoints,
    frequencyPoints,
    funnelPoints,
    keyEventPoints,
  };
}

function readPlan(traits: Record<string, unknown> | null): CompanySummary["plan"] {
  const plan = traits?.plan;

  if (plan === "starter" || plan === "growth" || plan === "scale") {
    return plan;
  }

  return "growth";
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

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getIntegrationCurl() {
  const apiKey =
    process.env.NEXT_PUBLIC_INGESTION_TEST_KEY ?? "po_live_your_key_here";

  return integrationCurl.replace("po_live_demo_1234567890", apiKey);
}
