"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const MIN_PASSWORD_LENGTH = 8;

export async function signInAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/app");
  }

  const credentials = readCredentials(formData);
  const nextPath = readNextPath(formData);

  if (!credentials.ok) {
    redirect(
      `/login?mode=signin&next=${encodeURIComponent(nextPath)}&error=${encodeURIComponent(credentials.message)}`,
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    redirect(
      `/login?mode=signin&next=${encodeURIComponent(nextPath)}&error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect(nextPath);
}

export async function signUpAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/app");
  }

  const credentials = readCredentials(formData);
  const nextPath = readNextPath(formData);

  if (!credentials.ok) {
    redirect(
      `/login?mode=signup&next=${encodeURIComponent(nextPath)}&error=${encodeURIComponent(credentials.message)}`,
    );
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: origin
      ? {
          emailRedirectTo: `${origin}${nextPath}`,
        }
      : undefined,
  });

  if (error) {
    redirect(
      `/login?mode=signup&next=${encodeURIComponent(nextPath)}&error=${encodeURIComponent(error.message)}`,
    );
  }

  if (data.session) {
    redirect(nextPath);
  }

  redirect(
    `/login?mode=signin&next=${encodeURIComponent(nextPath)}&message=${encodeURIComponent("Account created. Check your email if confirmation is enabled, then sign in.")}`,
  );
}

export async function signOutAction(formData?: FormData) {
  void formData;

  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/");
}

function readCredentials(formData: FormData):
  | {
      ok: true;
      email: string;
      password: string;
    }
  | {
      ok: false;
      message: string;
    } {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    return {
      ok: false,
      message: "Use a valid email address.",
    };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `Password must contain at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  return {
    ok: true,
    email,
    password,
  };
}

function readNextPath(formData: FormData) {
  const nextPath = String(formData.get("next") ?? "/app");

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/app";
  }

  return nextPath;
}
