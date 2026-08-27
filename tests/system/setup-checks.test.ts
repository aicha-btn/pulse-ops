import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getSetupStatusData } from "../../src/features/system/setup-checks";

describe("setup checks", () => {
  it("reports missing required services in demo mode", () => {
    const status = getSetupStatusData({});

    assert.equal(status.requiredCount, 4);
    assert.equal(status.readyCount, 1);
    assert.equal(status.missingRequiredCount, 3);
    assert.equal(status.completionRate, 25);
    assert.equal(findCheck(status.checks, "Cron scheduler")?.status, "ready");
  });

  it("marks the Supabase handoff ready when required env vars exist", () => {
    const status = getSetupStatusData({
      CRON_SECRET: "local-secret",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/pulseops",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_key",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    });

    assert.equal(status.requiredCount, 4);
    assert.equal(status.readyCount, 4);
    assert.equal(status.missingRequiredCount, 0);
    assert.equal(status.completionRate, 100);
  });

  it("accepts the legacy Supabase anon key name", () => {
    const status = getSetupStatusData({
      CRON_SECRET: "local-secret",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/pulseops",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    });

    assert.equal(findCheck(status.checks, "Supabase Auth")?.status, "ready");
  });

  it("keeps the ingestion test key optional", () => {
    const status = getSetupStatusData({
      CRON_SECRET: "local-secret",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/pulseops",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_key",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    });

    assert.equal(findCheck(status.checks, "Ingestion test key")?.status, "optional");
    assert.equal(status.missingRequiredCount, 0);
  });
});

function findCheck(
  checks: ReturnType<typeof getSetupStatusData>["checks"],
  label: string,
) {
  return checks.find((check) => check.label === label);
}
