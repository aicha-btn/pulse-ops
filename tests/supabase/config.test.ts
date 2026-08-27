import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getSupabaseConfig } from "../../src/lib/supabase/config";

describe("supabase config", () => {
  it("reports missing public Supabase variables", () => {
    const config = getSupabaseConfig({});

    assert.deepEqual(config, {
      ok: false,
      missing: [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      ],
    });
  });

  it("uses the publishable key when present", () => {
    const config = getSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: " publishable-key ",
      NEXT_PUBLIC_SUPABASE_URL: " https://example.supabase.co ",
    });

    assert.deepEqual(config, {
      ok: true,
      publishableKey: "publishable-key",
      url: "https://example.supabase.co",
    });
  });

  it("falls back to the legacy anon key name", () => {
    const config = getSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    });

    assert.deepEqual(config, {
      ok: true,
      publishableKey: "anon-key",
      url: "https://example.supabase.co",
    });
  });
});
