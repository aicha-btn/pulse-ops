import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const API_KEY_PREFIX = "po_live_";
const API_KEY_RANDOM_BYTES = 32;

export type ApiKeyReadResult =
  | {
      ok: true;
      apiKey: string;
    }
  | {
      ok: false;
      code: "missing_authorization" | "invalid_authorization" | "invalid_prefix";
      message: string;
    };

export function readBearerApiKey(authorization: string | null): ApiKeyReadResult {
  if (!authorization) {
    return {
      ok: false,
      code: "missing_authorization",
      message: "Missing Authorization header.",
    };
  }

  const [scheme, token, extra] = authorization.trim().split(/\s+/);

  if (scheme !== "Bearer" || !token || extra) {
    return {
      ok: false,
      code: "invalid_authorization",
      message: "Use Authorization: Bearer <api_key>.",
    };
  }

  if (!token.startsWith(API_KEY_PREFIX)) {
    return {
      ok: false,
      code: "invalid_prefix",
      message: `PulseOps ingestion keys must start with ${API_KEY_PREFIX}.`,
    };
  }

  return {
    ok: true,
    apiKey: token,
  };
}

export function generateApiKey() {
  return `${API_KEY_PREFIX}${randomBytes(API_KEY_RANDOM_BYTES).toString("base64url")}`;
}

export function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

export function maskApiKey(apiKey: string) {
  return `${apiKey.slice(0, API_KEY_PREFIX.length)}...${apiKey.slice(-4)}`;
}

export function getApiKeyLastFour(apiKey: string) {
  return apiKey.slice(-4);
}

export function apiKeyHashesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.byteLength !== rightBuffer.byteLength) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
