import { loadEnvConfig } from "@next/env";

import { closeDatabaseConnection } from "../src/db/client";
import { isDatabaseConfigured } from "../src/db/config";
import { aggregateAllProjects } from "../src/features/aggregations/aggregate-project";

loadEnvConfig(process.cwd());

async function main() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required to run aggregation jobs.");
  }

  const result = await aggregateAllProjects();

  console.log("PulseOps aggregation complete.");
  console.log(`Calculated at: ${result.calculatedAt}`);
  console.log(`Projects updated: ${result.projects.length}`);

  for (const project of result.projects) {
    console.log(
      `- ${project.projectName}: ${project.dailyMetrics} daily rows, ${project.funnelSteps} funnel steps, ${project.healthSnapshots} health snapshots`,
    );
  }

  if (result.failures.length > 0) {
    console.log(`Failures: ${result.failures.length}`);

    for (const failure of result.failures) {
      console.log(`- ${failure.projectName}: ${failure.message}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabaseConnection();
  });
