import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  API_KEY_PREFIX,
  apiKeyHashesMatch,
  generateApiKey,
  getApiKeyLastFour,
  hashApiKey,
  maskApiKey,
  readBearerApiKey,
} from "../../src/features/ingestion/api-key";

describe("ingestion api keys", () => {
  it("reads a valid bearer token", () => {
    const apiKey = `${API_KEY_PREFIX}abc123`;
    const result = readBearerApiKey(`Bearer ${apiKey}`);

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.apiKey, apiKey);
    }
  });

  it("rejects missing and malformed authorization headers", () => {
    assert.deepEqual(readBearerApiKey(null), {
      ok: false,
      code: "missing_authorization",
      message: "Missing Authorization header.",
    });

    assert.equal(readBearerApiKey("Token po_live_abc").ok, false);
    assert.equal(readBearerApiKey("Bearer po_live_abc extra").ok, false);
  });

  it("rejects keys without the PulseOps prefix", () => {
    const result = readBearerApiKey("Bearer sk_live_abc");

    assert.equal(result.ok, false);

    if (!result.ok) {
      assert.equal(result.code, "invalid_prefix");
    }
  });

  it("generates, masks and compares hashed keys", () => {
    const apiKey = generateApiKey();
    const hash = hashApiKey(apiKey);

    assert.equal(apiKey.startsWith(API_KEY_PREFIX), true);
    assert.equal(getApiKeyLastFour(apiKey), apiKey.slice(-4));
    assert.equal(maskApiKey(apiKey), `${API_KEY_PREFIX}...${apiKey.slice(-4)}`);
    assert.equal(apiKeyHashesMatch(hash, hashApiKey(apiKey)), true);
    assert.equal(apiKeyHashesMatch(hash, hashApiKey(`${apiKey}_wrong`)), false);
  });
});
