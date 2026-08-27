export type SetupCheckStatus = "missing" | "optional" | "ready";

export type SetupCheck = {
  description: string;
  label: string;
  nextStep: string;
  status: SetupCheckStatus;
};

export type SetupStatusData = {
  checks: SetupCheck[];
  completionRate: number;
  missingRequiredCount: number;
  readyCount: number;
  requiredCount: number;
};

type EnvLike = Record<string, string | undefined>;

export function getSetupStatusData(env: EnvLike = process.env): SetupStatusData {
  const databaseUrl = readEnv(env, "DATABASE_URL");
  const supabaseUrl = readEnv(env, "NEXT_PUBLIC_SUPABASE_URL");
  const supabasePublishableKey =
    readEnv(env, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ??
    readEnv(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const cronSecret = readEnv(env, "CRON_SECRET");
  const ingestionTestKey = readEnv(env, "NEXT_PUBLIC_INGESTION_TEST_KEY");

  const checks: SetupCheck[] = [
    {
      label: "PostgreSQL database",
      status: databaseUrl ? "ready" : "missing",
      description:
        "Stores projects, companies, tracked users, events and aggregated metrics.",
      nextStep: databaseUrl
        ? "Run migrations, seed data, then aggregate metrics."
        : "Set DATABASE_URL in .env.local or Vercel environment variables.",
    },
    {
      label: "Supabase Auth",
      status: supabaseUrl && supabasePublishableKey ? "ready" : "missing",
      description:
        "Protects /app and creates a workspace for each signed-in user.",
      nextStep:
        supabaseUrl && supabasePublishableKey
          ? "Create a test account from /login."
          : "Set the missing Supabase public env vars in .env.local.",
    },
    {
      label: "Cron secret",
      status: cronSecret ? "ready" : "missing",
      description:
        "Protects the aggregation job that recalculates health and funnel metrics.",
      nextStep: cronSecret
        ? "A scheduler can call /api/jobs/aggregate with Authorization: Bearer <CRON_SECRET>."
        : "Set CRON_SECRET before running aggregation in production.",
    },
    {
      label: "Cron scheduler",
      status: "ready",
      description:
        "vercel.json keeps a daily Vercel Hobby fallback; use an HTTP cron for 5-minute refreshes.",
      nextStep: "Deploy to Vercel, then configure the production scheduler.",
    },
    {
      label: "Ingestion test key",
      status: ingestionTestKey ? "ready" : "optional",
      description:
        "Prefills the local event tester with a project API key for demos.",
      nextStep: ingestionTestKey
        ? "Use /app/integration to send a test event."
        : "Optional locally. Create a real key in /app/integration after Supabase is connected.",
    },
    {
      label: "Service role key",
      status: "optional",
      description:
        "Reserved for future admin-only tasks. PulseOps does not need it for the current MVP.",
      nextStep:
        "Leave empty unless a future server-only admin workflow explicitly needs it.",
    },
  ];
  const requiredChecks = checks.filter((check) => check.status !== "optional");
  const readyCount = requiredChecks.filter(
    (check) => check.status === "ready",
  ).length;
  const requiredCount = requiredChecks.length;

  return {
    checks,
    completionRate:
      requiredCount === 0 ? 100 : Math.round((readyCount / requiredCount) * 100),
    missingRequiredCount: requiredCount - readyCount,
    readyCount,
    requiredCount,
  };
}

function readEnv(env: EnvLike, key: string) {
  const value = env[key]?.trim();

  return value ? value : null;
}
