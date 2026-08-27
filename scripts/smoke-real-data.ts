import { loadEnvConfig } from "@next/env";
import { and, count, desc, eq } from "drizzle-orm";
import type { AnyPgTable } from "drizzle-orm/pg-core";

import { isDatabaseConfigured } from "../src/db/config";
import { closeDatabaseConnection, getDatabase } from "../src/db/client";
import {
  aggregationRuns,
  apiKeys,
  companies,
  companyHealthSnapshots,
  dailyProjectMetrics,
  events,
  funnelStepMetrics,
  projects,
  trackedUsers,
  workspaces,
} from "../src/db/schema";

loadEnvConfig(process.cwd());

const demoWorkspaceSlug = "pulseops-demo";
const demoProjectSlug = "northstar-demo";

type TableCheck = {
  count: number;
  label: string;
};

type DemoProjectCheck =
  | {
      found: false;
    }
  | {
      activeApiKeys: number;
      events: number;
      found: true;
      healthSnapshots: number;
      name: string;
    };

async function main() {
  if (!isDatabaseConfigured()) {
    console.error(
      "DATABASE_URL is required. Fill .env.local before running setup:smoke.",
    );
    process.exit(1);
  }

  const db = getDatabase();
  const checks: TableCheck[] = [
    await countTable("Workspaces", workspaces),
    await countTable("Projects", projects),
    await countTable("API keys", apiKeys),
    await countTable("Companies", companies),
    await countTable("Tracked users", trackedUsers),
    await countTable("Events", events),
    await countTable("Daily metrics", dailyProjectMetrics),
    await countTable("Funnel metrics", funnelStepMetrics),
    await countTable("Health snapshots", companyHealthSnapshots),
  ];
  const [latestRun] = await db
    .select({
      completedAt: aggregationRuns.completedAt,
      errorMessage: aggregationRuns.errorMessage,
      projectId: aggregationRuns.projectId,
      projectName: projects.name,
      startedAt: aggregationRuns.startedAt,
      status: aggregationRuns.status,
    })
    .from(aggregationRuns)
    .innerJoin(projects, eq(aggregationRuns.projectId, projects.id))
    .orderBy(desc(aggregationRuns.startedAt))
    .limit(1);
  const demoProject = await getDemoProjectCheck();

  console.log("PulseOps real-data smoke test");
  console.log("");

  for (const check of checks) {
    console.log(`[${check.count > 0 ? "ready" : "empty"}] ${check.label}: ${check.count}`);
  }

  console.log("");

  if (latestRun) {
    console.log(`[${latestRun.status}] Latest aggregation run in database`);
    console.log(`  Project: ${latestRun.projectName}`);
    console.log(`  Project id: ${latestRun.projectId}`);
    console.log(`  Started: ${latestRun.startedAt.toISOString()}`);
    console.log(
      `  Completed: ${latestRun.completedAt?.toISOString() ?? "not completed"}`,
    );

    if (latestRun.errorMessage) {
      console.log(`  Error: ${latestRun.errorMessage}`);
    }
  } else {
    console.log("[empty] Latest aggregation run: none");
  }

  console.log("");

  if (demoProject.found) {
    console.log("[ready] Seeded demo project");
    console.log(`  Project: ${demoProject.name}`);
    console.log(`  Events: ${demoProject.events}`);
    console.log(`  Active API keys: ${demoProject.activeApiKeys}`);
    console.log(`  Health snapshots: ${demoProject.healthSnapshots}`);
  } else {
    console.log("[missing] Seeded demo project: Northstar Analytics not found");
  }

  console.log("");
  printNextStep(checks, Boolean(latestRun), demoProject);
}

async function countTable(
  label: string,
  table: AnyPgTable,
) {
  const db = getDatabase();
  const [result] = await db.select({ value: count() }).from(table);

  return {
    count: result?.value ?? 0,
    label,
  };
}

async function getDemoProjectCheck(): Promise<DemoProjectCheck> {
  const db = getDatabase();
  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
    })
    .from(projects)
    .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaces.slug, demoWorkspaceSlug),
        eq(projects.slug, demoProjectSlug),
      ),
    )
    .limit(1);

  if (!project) {
    return {
      found: false,
    };
  }

  const [eventsResult] = await db
    .select({
      value: count(),
    })
    .from(events)
    .where(eq(events.projectId, project.id));
  const [apiKeysResult] = await db
    .select({
      value: count(),
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.projectId, project.id), eq(apiKeys.status, "active")));
  const [healthResult] = await db
    .select({
      value: count(),
    })
    .from(companyHealthSnapshots)
    .where(eq(companyHealthSnapshots.projectId, project.id));

  return {
    activeApiKeys: apiKeysResult?.value ?? 0,
    events: eventsResult?.value ?? 0,
    found: true,
    healthSnapshots: healthResult?.value ?? 0,
    name: project.name,
  };
}

function printNextStep(
  checks: TableCheck[],
  hasAggregationRun: boolean,
  demoProject: DemoProjectCheck,
) {
  const byLabel = new Map(checks.map((check) => [check.label, check.count]));
  const projectsCount = byLabel.get("Projects") ?? 0;
  const eventsCount = byLabel.get("Events") ?? 0;
  const healthSnapshotsCount = byLabel.get("Health snapshots") ?? 0;

  if (projectsCount === 0) {
    console.log("Next: run npm run db:seed, or create an account from /login.");
    return;
  }

  if (eventsCount === 0) {
    console.log("Next: send a test event from /app/integration or run npm run db:seed.");
    return;
  }

  if (!hasAggregationRun || healthSnapshotsCount === 0) {
    console.log("Next: run npm run jobs:aggregate.");
    return;
  }

  if (
    !demoProject.found ||
    demoProject.events === 0 ||
    demoProject.activeApiKeys === 0 ||
    demoProject.healthSnapshots === 0
  ) {
    console.log(
      "Next: run npm run db:seed, then npm run jobs:aggregate for the demo project.",
    );
    process.exitCode = 1;
    return;
  }

  console.log("Next: open /app and verify the dashboard reads PostgreSQL data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabaseConnection();
  });
