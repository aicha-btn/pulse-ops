import { loadEnvConfig } from "@next/env";

import {
  getSetupStatusData,
  type SetupCheck,
} from "../src/features/system/setup-checks";

loadEnvConfig(process.cwd());

const strict = process.argv.includes("--strict");
const statusData = getSetupStatusData();

console.log("PulseOps setup check");
console.log(
  `Required readiness: ${statusData.readyCount}/${statusData.requiredCount} (${statusData.completionRate}%)`,
);
console.log("");

for (const check of statusData.checks) {
  printCheck(check);
}

if (statusData.missingRequiredCount > 0) {
  console.log("");
  console.log("Recommended next order:");
  console.log("1. Fill DATABASE_URL and Supabase public env vars.");
  console.log("2. Run npm run db:migrate.");
  console.log("3. Run npm run db:seed.");
  console.log("4. Run npm run jobs:aggregate.");
  console.log("5. Create a test account from /login.");
}

if (strict && statusData.missingRequiredCount > 0) {
  process.exit(1);
}

function printCheck(check: SetupCheck) {
  console.log(`[${check.status}] ${check.label}`);
  console.log(`  ${check.description}`);
  console.log(`  Next: ${check.nextStep}`);
}
