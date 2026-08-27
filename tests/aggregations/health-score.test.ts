import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateFrequencyPoints,
  calculateFunnelPoints,
  calculateHealth,
  calculateKeyEventPoints,
  calculateRecentActivityPoints,
  inferStatus,
} from "../../src/features/aggregations/health-score";

const calculatedAt = new Date("2026-08-25T12:00:00.000Z");

describe("health score", () => {
  it("scores a healthy account with recent activity and full activation", () => {
    const health = calculateHealth({
      calculatedAt,
      inactivityThresholdDays: 14,
      keyEvents: 2,
      lastSeenAt: new Date("2026-08-25T08:00:00.000Z"),
      recentEvents: 24,
      reachedSteps: 4,
      totalSteps: 4,
    });

    assert.equal(health.score, 100);
    assert.equal(health.status, "healthy");
    assert.equal(health.recentActivityPoints, 40);
    assert.equal(health.frequencyPoints, 25);
    assert.equal(health.funnelPoints, 20);
    assert.equal(health.keyEventPoints, 15);
  });

  it("scores an account to watch when activity is present but incomplete", () => {
    const health = calculateHealth({
      calculatedAt,
      inactivityThresholdDays: 14,
      keyEvents: 1,
      lastSeenAt: new Date("2026-08-20T12:00:00.000Z"),
      recentEvents: 8,
      reachedSteps: 2,
      totalSteps: 4,
    });

    assert.equal(health.score, 64);
    assert.equal(health.status, "watch");
    assert.deepEqual(health.reasons, ["Reached 2/4 activation steps."]);
  });

  it("scores an at-risk account when the signal is weak but not silent", () => {
    const health = calculateHealth({
      calculatedAt,
      inactivityThresholdDays: 14,
      keyEvents: 0,
      lastSeenAt: new Date("2026-08-15T12:00:00.000Z"),
      recentEvents: 8,
      reachedSteps: 1,
      totalSteps: 4,
    });

    assert.equal(health.score, 37);
    assert.equal(health.status, "at_risk");
  });

  it("scores a silent account with very weak recent volume", () => {
    const health = calculateHealth({
      calculatedAt,
      inactivityThresholdDays: 14,
      keyEvents: 0,
      lastSeenAt: new Date("2026-08-15T12:00:00.000Z"),
      recentEvents: 2,
      reachedSteps: 1,
      totalSteps: 4,
    });

    assert.equal(health.score, 24);
    assert.equal(health.status, "silent");
    assert.deepEqual(health.reasons, [
      "Activity is older than one week.",
      "Fewer than 3 events in the last 14 days.",
      "Reached 1/4 activation steps.",
      "No key activation event in the last 14 days.",
    ]);
  });

  it("forces silent status when inactivity passes the project threshold", () => {
    const health = calculateHealth({
      calculatedAt,
      inactivityThresholdDays: 14,
      keyEvents: 4,
      lastSeenAt: new Date("2026-08-01T12:00:00.000Z"),
      recentEvents: 30,
      reachedSteps: 4,
      totalSteps: 4,
    });

    assert.equal(health.score, 60);
    assert.equal(health.status, "silent");
    assert.equal(health.reasons[0], "No activity for 24 days.");
  });

  it("keeps the score transparent through small point helpers", () => {
    assert.equal(calculateRecentActivityPoints(0, 14), 40);
    assert.equal(calculateRecentActivityPoints(3, 14), 34);
    assert.equal(calculateRecentActivityPoints(7, 14), 26);
    assert.equal(calculateRecentActivityPoints(14, 14), 14);
    assert.equal(calculateRecentActivityPoints(15, 14), 0);

    assert.equal(calculateFrequencyPoints(0), 0);
    assert.equal(calculateFrequencyPoints(2), 5);
    assert.equal(calculateFrequencyPoints(7), 10);
    assert.equal(calculateFrequencyPoints(19), 18);
    assert.equal(calculateFrequencyPoints(20), 25);

    assert.equal(calculateFunnelPoints(0, 0), 0);
    assert.equal(calculateFunnelPoints(2, 4), 10);
    assert.equal(calculateFunnelPoints(6, 4), 20);

    assert.equal(calculateKeyEventPoints(0), 0);
    assert.equal(calculateKeyEventPoints(1), 10);
    assert.equal(calculateKeyEventPoints(2), 15);
  });

  it("maps scores to honest health statuses", () => {
    assert.equal(inferStatus(80, 0, 14), "healthy");
    assert.equal(inferStatus(60, 0, 14), "watch");
    assert.equal(inferStatus(40, 0, 14), "at_risk");
    assert.equal(inferStatus(20, 0, 14), "silent");
    assert.equal(inferStatus(90, 15, 14), "silent");
  });
});
