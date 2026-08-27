import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizeTrackPayload,
  parseTrackPayload,
} from "../../src/features/ingestion/track-payload";

const validPayload = {
  event_id: "evt_20260824_001",
  event: "first_event_sent",
  occurred_at: "2026-08-24T12:30:00.000Z",
  user: {
    external_id: "user_123",
    email: "founder@example.com",
    name: "Mara Chen",
    traits: {
      role: "founder",
    },
  },
  company: {
    external_id: "company_456",
    name: "Northstar Labs",
    traits: {
      plan: "growth",
      seats: 24,
    },
  },
  properties: {
    source: "backend",
  },
};

describe("track payload parsing", () => {
  it("accepts and normalizes a valid event payload", () => {
    const parsed = parseTrackPayload(validPayload);

    assert.equal(parsed.ok, true);

    if (!parsed.ok) {
      return;
    }

    const receivedAt = new Date("2026-08-25T09:15:00.000Z");
    const event = normalizeTrackPayload(parsed.data, receivedAt);

    assert.equal(event.eventId, validPayload.event_id);
    assert.equal(event.eventName, validPayload.event);
    assert.equal(event.occurredAt.toISOString(), validPayload.occurred_at);
    assert.equal(event.receivedAt, receivedAt);
    assert.equal(event.user.externalId, validPayload.user.external_id);
    assert.equal(event.company?.externalId, validPayload.company.external_id);
  });

  it("rejects event names that are not stable machine names", () => {
    const parsed = parseTrackPayload({
      ...validPayload,
      event: "First Event Sent",
    });

    assert.equal(parsed.ok, false);

    if (!parsed.ok) {
      assert.equal(parsed.issues[0]?.path, "event");
      assert.equal(parsed.issues[0]?.code, "invalid_format");
    }
  });

  it("rejects reserved keys inside metadata", () => {
    const parsed = parseTrackPayload({
      ...validPayload,
      properties: {
        event_id: "should_not_be_here",
      },
    });

    assert.equal(parsed.ok, false);

    if (!parsed.ok) {
      assert.equal(parsed.issues[0]?.path, "properties.event_id");
      assert.equal(parsed.issues[0]?.code, "reserved_key");
    }
  });

  it("rejects payloads over 64 KB", () => {
    const parsed = parseTrackPayload({
      ...validPayload,
      properties: {
        blob: "x".repeat(70 * 1024),
      },
    });

    assert.equal(parsed.ok, false);

    if (!parsed.ok) {
      assert.equal(parsed.issues[0]?.code, "payload_too_large");
    }
  });
});
