import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  evaluateIngestionRateLimit,
  getIngestionRateLimitPerMinute,
} from "../../src/features/ingestion/rate-limit";

describe("ingestion rate limit", () => {
  it("uses the default limit when the env value is missing or invalid", () => {
    assert.equal(getIngestionRateLimitPerMinute({}), 120);
    assert.equal(
      getIngestionRateLimitPerMinute({
        INGESTION_RATE_LIMIT_PER_MINUTE: "not-a-number",
      }),
      120,
    );
    assert.equal(
      getIngestionRateLimitPerMinute({
        INGESTION_RATE_LIMIT_PER_MINUTE: "0",
      }),
      120,
    );
  });

  it("uses a valid env limit and caps very large values", () => {
    assert.equal(
      getIngestionRateLimitPerMinute({
        INGESTION_RATE_LIMIT_PER_MINUTE: "45",
      }),
      45,
    );
    assert.equal(
      getIngestionRateLimitPerMinute({
        INGESTION_RATE_LIMIT_PER_MINUTE: "50000",
      }),
      10_000,
    );
  });

  it("allows requests under the current minute limit", () => {
    const result = evaluateIngestionRateLimit({
      limit: 120,
      receivedAt: new Date("2026-08-25T09:15:10.000Z"),
      requestCount: 20,
      windowStart: new Date("2026-08-25T09:15:00.000Z"),
    });

    assert.equal(result.allowed, true);
    assert.equal(result.limit, 120);
    assert.equal(result.remaining, 100);
    assert.equal(result.resetAt.toISOString(), "2026-08-25T09:16:00.000Z");
  });

  it("blocks requests over the current minute limit", () => {
    const result = evaluateIngestionRateLimit({
      limit: 120,
      receivedAt: new Date("2026-08-25T09:15:42.100Z"),
      requestCount: 121,
      windowStart: new Date("2026-08-25T09:15:00.000Z"),
    });

    assert.equal(result.allowed, false);
    assert.equal(result.limit, 120);
    assert.equal(result.remaining, 0);

    if (!result.allowed) {
      assert.equal(result.retryAfterSeconds, 18);
    }
  });
});
