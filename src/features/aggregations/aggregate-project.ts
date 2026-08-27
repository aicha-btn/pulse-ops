import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  sql,
} from "drizzle-orm";

import { getDatabase } from "@/db/client";
import {
  activationFunnels,
  activationFunnelSteps,
  aggregationRuns,
  companies,
  companyHealthSnapshots,
  dailyProjectMetrics,
  events,
  funnelStepMetrics,
  projects,
} from "@/db/schema";
import { calculateHealth } from "@/features/aggregations/health-score";

type ProjectForAggregation = {
  id: string;
  name: string;
  inactivityThresholdDays: number;
};

export type ProjectAggregationResult = {
  projectId: string;
  projectName: string;
  dailyMetrics: number;
  funnelSteps: number;
  healthSnapshots: number;
};

export type AggregationRunResult = {
  calculatedAt: string;
  projects: ProjectAggregationResult[];
  failures: {
    projectId: string;
    projectName: string;
    message: string;
  }[];
};

const KEY_EVENT_NAMES = [
  "first_event_sent",
  "dashboard_viewed",
  "report_shared",
  "teammate_invited",
];

export async function aggregateAllProjects(
  calculatedAt = new Date(),
): Promise<AggregationRunResult> {
  const db = getDatabase();
  const projectRows = await db
    .select({
      id: projects.id,
      name: projects.name,
      inactivityThresholdDays: projects.inactivityThresholdDays,
    })
    .from(projects)
    .orderBy(desc(projects.createdAt));

  const results: ProjectAggregationResult[] = [];
  const failures: AggregationRunResult["failures"] = [];

  for (const project of projectRows) {
    const [run] = await db
      .insert(aggregationRuns)
      .values({
        projectId: project.id,
        kind: "project_rollups",
        status: "running",
        startedAt: calculatedAt,
      })
      .returning({
        id: aggregationRuns.id,
      });

    try {
      const result = await aggregateProject(project, calculatedAt);

      await db
        .update(aggregationRuns)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(aggregationRuns.id, run.id));

      results.push(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown aggregation error.";

      await db
        .update(aggregationRuns)
        .set({
          status: "failed",
          completedAt: new Date(),
          errorMessage: message,
        })
        .where(eq(aggregationRuns.id, run.id));

      failures.push({
        projectId: project.id,
        projectName: project.name,
        message,
      });
    }
  }

  return {
    calculatedAt: calculatedAt.toISOString(),
    projects: results,
    failures,
  };
}

async function aggregateProject(
  project: ProjectForAggregation,
  calculatedAt: Date,
): Promise<ProjectAggregationResult> {
  const dailyMetrics = await upsertDailyMetrics(project.id, calculatedAt);
  const funnelSteps = await upsertFunnelMetrics(project.id, calculatedAt);
  const healthSnapshots = await createHealthSnapshots(project, calculatedAt);

  return {
    projectId: project.id,
    projectName: project.name,
    dailyMetrics,
    funnelSteps,
    healthSnapshots,
  };
}

async function upsertDailyMetrics(projectId: string, calculatedAt: Date) {
  const db = getDatabase();
  const periodStart = daysAgo(90, calculatedAt);
  const rows = await db
    .select({
      day: sql<string>`date(${events.occurredAt})`,
      eventsCount: count(),
      activeUsersCount: countDistinct(events.userId),
      activeCompaniesCount: countDistinct(events.companyId),
    })
    .from(events)
    .where(and(eq(events.projectId, projectId), gte(events.occurredAt, periodStart)))
    .groupBy(sql`date(${events.occurredAt})`)
    .orderBy(sql`date(${events.occurredAt})`);

  for (const row of rows) {
    await db
      .insert(dailyProjectMetrics)
      .values({
        projectId,
        day: row.day,
        eventsCount: row.eventsCount,
        activeUsersCount: row.activeUsersCount,
        activeCompaniesCount: row.activeCompaniesCount,
      })
      .onConflictDoUpdate({
        target: [dailyProjectMetrics.projectId, dailyProjectMetrics.day],
        set: {
          eventsCount: row.eventsCount,
          activeUsersCount: row.activeUsersCount,
          activeCompaniesCount: row.activeCompaniesCount,
        },
      });
  }

  return rows.length;
}

async function upsertFunnelMetrics(projectId: string, calculatedAt: Date) {
  const db = getDatabase();
  const [funnel] = await db
    .select({
      id: activationFunnels.id,
      activationWindowDays: activationFunnels.activationWindowDays,
    })
    .from(activationFunnels)
    .where(eq(activationFunnels.projectId, projectId))
    .limit(1);

  if (!funnel) {
    return 0;
  }

  const steps = await db
    .select({
      orderIndex: activationFunnelSteps.orderIndex,
      eventName: activationFunnelSteps.eventName,
    })
    .from(activationFunnelSteps)
    .where(eq(activationFunnelSteps.funnelId, funnel.id))
    .orderBy(activationFunnelSteps.orderIndex);

  if (steps.length === 0) {
    return 0;
  }

  const periodStart = daysAgo(funnel.activationWindowDays, calculatedAt);
  const periodStartKey = toDateKey(periodStart);
  const periodEndKey = toDateKey(calculatedAt);
  const reached = await Promise.all(
    steps.map(async (step) => {
      const [result] = await db
        .select({
          users: countDistinct(events.userId),
        })
        .from(events)
        .where(
          and(
            eq(events.projectId, projectId),
            eq(events.name, step.eventName),
            gte(events.occurredAt, periodStart),
            isNotNull(events.userId),
          ),
        );

      return {
        ...step,
        usersReached: result?.users ?? 0,
      };
    }),
  );

  const firstStepUsers = reached[0]?.usersReached ?? 0;

  for (const step of reached) {
    const conversionRateBasisPoints =
      firstStepUsers > 0
        ? Math.round((step.usersReached / firstStepUsers) * 10_000)
        : 0;

    await db
      .insert(funnelStepMetrics)
      .values({
        projectId,
        funnelId: funnel.id,
        periodStart: periodStartKey,
        periodEnd: periodEndKey,
        orderIndex: step.orderIndex,
        eventName: step.eventName,
        usersReached: step.usersReached,
        conversionRateBasisPoints,
      })
      .onConflictDoUpdate({
        target: [
          funnelStepMetrics.projectId,
          funnelStepMetrics.funnelId,
          funnelStepMetrics.periodStart,
          funnelStepMetrics.periodEnd,
          funnelStepMetrics.orderIndex,
        ],
        set: {
          eventName: step.eventName,
          usersReached: step.usersReached,
          conversionRateBasisPoints,
        },
      });
  }

  return reached.length;
}

async function createHealthSnapshots(
  project: ProjectForAggregation,
  calculatedAt: Date,
) {
  const db = getDatabase();
  const recentPeriodStart = daysAgo(14, calculatedAt);
  const companyRows = await db
    .select({
      id: companies.id,
      lastSeenAt: companies.lastSeenAt,
    })
    .from(companies)
    .where(eq(companies.projectId, project.id));

  if (companyRows.length === 0) {
    return 0;
  }

  const [funnel] = await db
    .select({
      id: activationFunnels.id,
    })
    .from(activationFunnels)
    .where(eq(activationFunnels.projectId, project.id))
    .limit(1);

  const funnelSteps = funnel
    ? await db
        .select({
          eventName: activationFunnelSteps.eventName,
        })
        .from(activationFunnelSteps)
        .where(eq(activationFunnelSteps.funnelId, funnel.id))
    : [];

  const recentEventRows = await db
    .select({
      companyId: events.companyId,
      eventsCount: count(),
    })
    .from(events)
    .where(
      and(
        eq(events.projectId, project.id),
        isNotNull(events.companyId),
        gte(events.occurredAt, recentPeriodStart),
      ),
    )
    .groupBy(events.companyId);

  const recentEventsByCompany = toNumberMap(recentEventRows, "eventsCount");

  const keyEventRows = await db
    .select({
      companyId: events.companyId,
      keyEvents: count(),
    })
    .from(events)
    .where(
      and(
        eq(events.projectId, project.id),
        isNotNull(events.companyId),
        gte(events.occurredAt, recentPeriodStart),
        inArray(events.name, KEY_EVENT_NAMES),
      ),
    )
    .groupBy(events.companyId);

  const keyEventsByCompany = toNumberMap(keyEventRows, "keyEvents");
  const stepNames = funnelSteps.map((step) => step.eventName);
  const reachedStepRows =
    stepNames.length > 0
      ? await db
          .select({
            companyId: events.companyId,
            reachedSteps: countDistinct(events.name),
          })
          .from(events)
          .where(
            and(
              eq(events.projectId, project.id),
              isNotNull(events.companyId),
              inArray(events.name, stepNames),
            ),
          )
          .groupBy(events.companyId)
      : [];

  const reachedStepsByCompany = toNumberMap(reachedStepRows, "reachedSteps");
  const snapshots = companyRows.map((company) => {
    const health = calculateHealth({
      calculatedAt,
      inactivityThresholdDays: project.inactivityThresholdDays,
      keyEvents: keyEventsByCompany.get(company.id) ?? 0,
      lastSeenAt: company.lastSeenAt,
      recentEvents: recentEventsByCompany.get(company.id) ?? 0,
      reachedSteps: reachedStepsByCompany.get(company.id) ?? 0,
      totalSteps: stepNames.length,
    });

    return {
      projectId: project.id,
      companyId: company.id,
      calculatedAt,
      score: health.score,
      status: health.status,
      recentActivityPoints: health.recentActivityPoints,
      frequencyPoints: health.frequencyPoints,
      funnelPoints: health.funnelPoints,
      keyEventPoints: health.keyEventPoints,
      reasons: health.reasons,
    };
  });

  await db.insert(companyHealthSnapshots).values(snapshots);

  return snapshots.length;
}

function toNumberMap<T extends { companyId: string | null }>(
  rows: T[],
  key: keyof T,
) {
  const map = new Map<string, number>();

  for (const row of rows) {
    if (row.companyId) {
      map.set(row.companyId, Number(row[key] ?? 0));
    }
  }

  return map;
}

function daysAgo(days: number, from: Date) {
  const date = new Date(from);
  date.setDate(date.getDate() - days);
  return date;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
