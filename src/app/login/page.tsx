import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { PulseBrand } from "@/components/pulse-brand";
import { getAuthState } from "@/features/auth/session";

import { signInAction, signUpAction } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    message?: string | string[];
    mode?: string | string[];
    next?: string | string[];
  }>;
};

type AuthMode = "signin" | "signup";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const mode = readMode(params.mode);
  const nextPath = readNextPath(params.next);
  const errorMessage = readParam(params.error);
  const successMessage = readParam(params.message);
  const authState = await getAuthState();

  if (authState.status === "signed_in") {
    redirect(nextPath);
  }

  const isSignUp = mode === "signup";
  const action = isSignUp ? signUpAction : signInAction;

  return (
    <main className="hero-scene min-h-screen overflow-x-clip px-4 py-4 text-[var(--paper)] sm:px-8 sm:py-6 lg:px-12">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <PulseBrand compact className="max-w-[210px]" />
        <Link
          className="shrink-0 text-sm font-semibold text-[rgba(244,241,232,0.72)] transition hover:text-[var(--cyan)]"
          href="/"
        >
          Back home
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-6 py-6 sm:gap-10 sm:py-16 lg:grid-cols-[0.95fr_440px] lg:items-center lg:py-24">
        <div className="order-2 min-w-0 lg:order-1">
          <p className="font-mono text-xs uppercase text-[var(--cyan)]">
            Secure workspace
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:mt-5 sm:text-5xl sm:leading-none lg:text-6xl">
            One clear entry point for product signals.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[rgba(244,241,232,0.74)] sm:mt-6 sm:text-lg sm:leading-8">
            PulseOps keeps account health private once Supabase is connected,
            while preserving an open demo mode for local portfolio previews.
          </p>

          <div className="mt-8 hidden max-w-xl gap-3 sm:grid sm:grid-cols-3 lg:mt-10">
            {["Auth session", "Private app", "Demo fallback"].map((item) => (
              <div
                className="border border-[rgba(244,241,232,0.16)] bg-[rgba(244,241,232,0.045)] p-4"
                key={item}
              >
                <ShieldCheck
                  className="text-[var(--mint)]"
                  size={18}
                  strokeWidth={1.8}
                />
                <p className="mt-4 text-sm font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="order-1 min-w-0 border border-[rgba(244,241,232,0.18)] bg-[rgba(16,19,15,0.78)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur sm:p-5 lg:order-2">
          {authState.status === "demo" ? (
            <DemoAccessPanel />
          ) : (
            <>
              <div className="flex border border-[rgba(244,241,232,0.14)] p-1">
                <ModeLink active={!isSignUp} href={buildLoginHref("signin", nextPath)}>
                  Sign in
                </ModeLink>
                <ModeLink active={isSignUp} href={buildLoginHref("signup", nextPath)}>
                  Create account
                </ModeLink>
              </div>

              <div className="mt-5 sm:mt-6">
                <p className="font-mono text-xs uppercase text-[var(--cyan)]">
                  {isSignUp ? "Create account" : "Welcome back"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold sm:mt-3 sm:text-3xl">
                  {isSignUp ? "Start a workspace" : "Open PulseOps"}
                </h2>
              </div>

              {errorMessage ? (
                <p className="mt-5 border border-[rgba(255,79,123,0.45)] bg-[rgba(255,79,123,0.1)] p-3 text-sm leading-6 text-[var(--coral)]">
                  {errorMessage}
                </p>
              ) : null}

              {successMessage ? (
                <p className="mt-5 border border-[rgba(185,255,74,0.45)] bg-[rgba(185,255,74,0.1)] p-3 text-sm leading-6 text-[var(--mint)]">
                  {successMessage}
                </p>
              ) : null}

              <form action={action} className="mt-5 space-y-4 sm:mt-6">
                <input name="next" type="hidden" value={nextPath} />
                <label className="block">
                  <span className="font-mono text-xs uppercase text-[rgba(244,241,232,0.62)]">
                    Email
                  </span>
                  <input
                    className="mt-2 h-12 w-full border border-[rgba(244,241,232,0.2)] bg-[rgba(244,241,232,0.06)] px-3 text-sm text-[var(--paper)] outline-none transition placeholder:text-[rgba(244,241,232,0.36)] focus:border-[var(--cyan)]"
                    name="email"
                    placeholder="user@example.com"
                    required
                    type="email"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-xs uppercase text-[rgba(244,241,232,0.62)]">
                    Password
                  </span>
                  <input
                    className="mt-2 h-12 w-full border border-[rgba(244,241,232,0.2)] bg-[rgba(244,241,232,0.06)] px-3 text-sm text-[var(--paper)] outline-none transition placeholder:text-[rgba(244,241,232,0.36)] focus:border-[var(--cyan)]"
                    minLength={8}
                    name="password"
                    placeholder="8 characters minimum"
                    required
                    type="password"
                  />
                </label>

                <button
                  className="inline-flex h-12 w-full items-center justify-center gap-2 border border-[var(--cyan)] bg-[var(--cyan)] px-4 text-sm font-semibold text-[var(--ink)] transition hover:bg-transparent hover:text-[var(--cyan)]"
                  type="submit"
                >
                  {isSignUp ? "Create account" : "Sign in"}
                  <ArrowRight size={16} strokeWidth={1.8} />
                </button>
              </form>
            </>
          )}
        </aside>
      </section>
    </main>
  );
}

function DemoAccessPanel() {
  return (
    <div>
      <p className="font-mono text-xs uppercase text-[var(--cyan)]">
        Demo environment
      </p>
      <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
        Supabase is not connected.
      </h2>
      <p className="mt-4 text-sm leading-6 text-[rgba(244,241,232,0.68)]">
        The product stays open with local demo data. Once Supabase variables are
        added, this same page becomes the real login gate.
      </p>
      <Link
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 border border-[var(--cyan)] bg-[var(--cyan)] px-4 text-sm font-semibold text-[var(--ink)] transition hover:bg-transparent hover:text-[var(--cyan)]"
        href="/app"
      >
        Open demo product
        <ArrowRight size={16} strokeWidth={1.8} />
      </Link>
    </div>
  );
}

function ModeLink({
  active,
  children,
  href,
}: {
  active: boolean;
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      className={`flex h-10 min-w-0 flex-1 items-center justify-center px-2 text-sm font-semibold transition ${
        active
          ? "bg-[var(--paper)] text-[var(--ink)]"
          : "text-[rgba(244,241,232,0.62)] hover:text-[var(--paper)]"
      }`}
      href={href}
    >
      <span className="truncate">{children}</span>
    </Link>
  );
}

function readMode(value: string | string[] | undefined): AuthMode {
  return readParam(value) === "signup" ? "signup" : "signin";
}

function readNextPath(value: string | string[] | undefined) {
  const nextPath = readParam(value) ?? "/app";

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/app";
  }

  return nextPath;
}

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function buildLoginHref(mode: AuthMode, nextPath: string) {
  return `/login?mode=${mode}&next=${encodeURIComponent(nextPath)}`;
}
