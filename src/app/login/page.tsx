import { Activity, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

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
    <main className="hero-scene min-h-screen px-5 py-6 text-[var(--paper)] sm:px-8 lg:px-12">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link className="flex items-center gap-3 font-mono text-sm uppercase" href="/">
          <span className="flex h-9 w-9 items-center justify-center border border-[rgba(244,241,232,0.42)]">
            <Activity size={17} strokeWidth={1.8} />
          </span>
          PulseOps
        </Link>
        <Link
          className="text-sm font-semibold text-[rgba(244,241,232,0.72)] transition hover:text-[var(--cyan)]"
          href="/"
        >
          Back home
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 py-16 lg:grid-cols-[0.95fr_440px] lg:items-center lg:py-24">
        <div>
          <p className="font-mono text-xs uppercase text-[var(--cyan)]">
            Secure workspace
          </p>
          <h1 className="mt-5 max-w-2xl text-5xl font-semibold leading-none sm:text-6xl">
            One clear entry point for product signals.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[rgba(244,241,232,0.74)]">
            PulseOps keeps account health private once Supabase is connected,
            while preserving an open demo mode for local portfolio previews.
          </p>

          <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
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

        <aside className="border border-[rgba(244,241,232,0.18)] bg-[rgba(16,19,15,0.78)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur">
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

              <div className="mt-6">
                <p className="font-mono text-xs uppercase text-[var(--cyan)]">
                  {isSignUp ? "Create account" : "Welcome back"}
                </p>
                <h2 className="mt-3 text-3xl font-semibold">
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

              <form action={action} className="mt-6 space-y-4">
                <input name="next" type="hidden" value={nextPath} />
                <label className="block">
                  <span className="font-mono text-xs uppercase text-[rgba(244,241,232,0.62)]">
                    Email
                  </span>
                  <input
                    className="mt-2 h-12 w-full border border-[rgba(244,241,232,0.2)] bg-[rgba(244,241,232,0.06)] px-3 text-sm text-[var(--paper)] outline-none transition placeholder:text-[rgba(244,241,232,0.36)] focus:border-[var(--cyan)]"
                    name="email"
                    placeholder="aicha@example.com"
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
      <h2 className="mt-3 text-3xl font-semibold">Supabase is not connected.</h2>
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
      className={`flex h-10 flex-1 items-center justify-center text-sm font-semibold transition ${
        active
          ? "bg-[var(--paper)] text-[var(--ink)]"
          : "text-[rgba(244,241,232,0.62)] hover:text-[var(--paper)]"
      }`}
      href={href}
    >
      {children}
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
