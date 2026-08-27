"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "./config";

export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();

  if (!config.ok) {
    throw new Error(`Missing Supabase env vars: ${config.missing.join(", ")}`);
  }

  return createBrowserClient(config.url, config.publishableKey);
}
