import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildCompanyLinkIndex,
  getCompanyHref,
  normalizeCompanyName,
} from "../../src/features/companies/company-links";
import {
  buildHealthParts,
  getRecommendedAction,
  getRecoveryPriority,
  summarizeEventStatuses,
} from "../../src/features/companies/get-company-detail-data";
import type {
  CompanySummary,
  RecentEvent,
} from "../../src/features/demo/pulseops-demo-data";

const company: CompanySummary = {
  activationStep: "first_event_sent",
  activeUsers: 2,
  healthBreakdown: {
    frequencyPoints: 10,
    funnelPoints: 5,
    keyEventPoints: 0,
    recentActivityPoints: 20,
  },
  healthScoreSource: "calculated",
  id: "northstar-labs",
  lastActivity: "3 days ago",
  name: "Northstar Labs",
  plan: "growth",
  reason: "Usage is weakening before first_event_sent.",
  score: 35,
  status: "at_risk",
  trend: "down",
};

describe("company detail data helpers", () => {
  it("builds stable account links from company names", () => {
    const index = buildCompanyLinkIndex([
      {
        id: "northstar-labs",
        name: "Northstar Labs",
      },
      {
        id: "company with spaces",
        name: "Brightbeam",
      },
    ]);

    assert.equal(normalizeCompanyName("  NORTHSTAR LABS "), "northstar labs");
    assert.equal(
      getCompanyHref(index, "northstar labs"),
      "/app/companies/northstar-labs",
    );
    assert.equal(
      getCompanyHref(index, "Brightbeam"),
      "/app/companies/company%20with%20spaces",
    );
    assert.equal(getCompanyHref(index, "Unassigned"), null);
  });

  it("keeps health parts transparent and bounded", () => {
    const parts = buildHealthParts(company.healthBreakdown);

    assert.equal(parts.length, 4);
    assert.deepEqual(
      parts.map((part) => `${part.label}:${part.points}/${part.max}`),
      [
        "Recent activity:20/40",
        "Frequency:10/25",
        "Funnel progress:5/20",
        "Key events:0/15",
      ],
    );
    assert.deepEqual(
      parts.map((part) => part.width),
      [50, 40, 25, 0],
    );
  });

  it("summarizes event statuses for the account timeline", () => {
    const events: RecentEvent[] = [
      {
        company: "Northstar Labs",
        event: "first_event_sent",
        id: "evt_1",
        occurredAt: "14:31",
        status: "accepted",
        user: "founder@northstar.example",
      },
      {
        company: "Northstar Labs",
        event: "first_event_sent",
        id: "evt_2",
        occurredAt: "14:20",
        status: "ignored",
        user: "founder@northstar.example",
      },
      {
        company: "Northstar Labs",
        event: "missing_event_id",
        id: "evt_3",
        occurredAt: "14:12",
        status: "rejected",
        user: "founder@northstar.example",
      },
    ];

    assert.deepEqual(summarizeEventStatuses(events), {
      accepted: 1,
      ignored: 1,
      rejected: 1,
      total: 3,
    });
  });

  it("turns health status into a simple operational recommendation", () => {
    assert.equal(getRecoveryPriority(company).label, "High");
    assert.match(getRecommendedAction(company), /first_event_sent/);

    assert.equal(
      getRecoveryPriority({
        ...company,
        score: 18,
        status: "silent",
      }).label,
      "Critical",
    );
  });
});
