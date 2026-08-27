import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthState =
  | {
      status: "demo";
      email: string;
      userId: null;
    }
  | {
      status: "signed_in";
      email: string;
      userId: string;
    }
  | {
      status: "signed_out";
      email: null;
      userId: null;
    };

export async function getAuthState(): Promise<AuthState> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "demo",
      email: "Demo mode",
      userId: null,
    };
  }

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return {
      status: "signed_out",
      email: null,
      userId: null,
    };
  }

  return {
    status: "signed_in",
    email:
      typeof data.claims.email === "string" ? data.claims.email : "Signed in",
    userId: data.claims.sub,
  };
}
