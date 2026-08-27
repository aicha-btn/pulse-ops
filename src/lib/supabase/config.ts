export type SupabaseConfig =
  | {
      ok: true;
      url: string;
      publishableKey: string;
    }
  | {
      ok: false;
      missing: string[];
    };

type EnvLike = Record<string, string | undefined>;

export function getSupabaseConfig(env: EnvLike = process.env): SupabaseConfig {
  const url = readEnv(env, "NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey =
    readEnv(env, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ??
    readEnv(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const missing: string[] = [];

  if (!url) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!publishableKey) {
    missing.push(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  if (!url || !publishableKey) {
    return {
      ok: false,
      missing,
    };
  }

  return {
    ok: true,
    url,
    publishableKey,
  };
}

export function isSupabaseConfigured() {
  return getSupabaseConfig().ok;
}

function readEnv(env: EnvLike, key: string) {
  const value = env[key]?.trim();

  return value ? value : null;
}
