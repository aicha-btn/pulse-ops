import { TrackEventTester } from "@/components/track-event-tester";
import { PulseBrand } from "@/components/pulse-brand";
import Link from "next/link";

const accountSignals = [
  {
    name: "Northstar Labs",
    score: 84,
    status: "healthy",
    note: "Activation complete, product rhythm stable",
  },
  {
    name: "Copperline CRM",
    score: 61,
    status: "watch",
    note: "Usage dropped after first report shared",
  },
  {
    name: "RivetCloud",
    score: 34,
    status: "silent",
    note: "No key event in 16 days",
  },
];

const funnelSteps = [
  { label: "signed_up", value: 100 },
  { label: "project_created", value: 78 },
  { label: "api_key_created", value: 53 },
  { label: "first_event_sent", value: 39 },
];

export default function Home() {
  return (
    <main className="spectral-tile min-h-screen text-[var(--ink)]">
      <section className="hero-scene relative min-h-[92svh] overflow-hidden px-5 text-[var(--paper)] sm:px-8 lg:px-12">
        <div className="signal-sweep pointer-events-none absolute inset-y-0 left-0 w-2/3" />

        <div className="pointer-events-none absolute inset-0 opacity-90">
          <div className="absolute left-[7%] top-[38%] h-[1px] w-[74%] bg-[linear-gradient(90deg,transparent,var(--cyan),transparent)]" />
          <div className="absolute bottom-[34%] left-[4%] h-[1px] w-[62%] bg-[linear-gradient(90deg,transparent,var(--violet),transparent)]" />
        </div>

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between py-6">
          <PulseBrand />
          <nav className="hidden items-center gap-8 text-sm text-[rgba(244,241,232,0.72)] md:flex">
            <a href="#signals" className="transition hover:text-[var(--cyan)]">
              Signals
            </a>
            <a href="#health" className="transition hover:text-[var(--cyan)]">
              Health
            </a>
            <a
              href="#integration"
              className="transition hover:text-[var(--cyan)]"
            >
              Integration
            </a>
          </nav>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl items-end gap-12 pb-16 pt-20 lg:grid-cols-[1fr_420px] lg:pb-24 lg:pt-28">
          <div className="max-w-4xl">
            <p className="mb-6 inline-flex border border-[rgba(34,223,197,0.38)] bg-[rgba(34,223,197,0.08)] px-3 py-2 font-mono text-xs uppercase text-[var(--cyan)]">
              Product analytics for B2B teams
            </p>
            <h1 className="max-w-4xl text-6xl font-semibold leading-none text-[var(--paper)] sm:text-7xl lg:text-8xl">
              PulseOps
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-8 text-[rgba(244,241,232,0.78)]">
              See activation, understand drop-offs, and act before customer
              accounts go silent.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/app"
                className="inline-flex h-12 items-center justify-center border border-[var(--mint)] bg-[var(--mint)] px-6 text-sm font-semibold text-[var(--night)] transition hover:bg-transparent hover:text-[var(--mint)]"
              >
                Open product preview
              </Link>
              <Link
                href="/app/companies"
                className="inline-flex h-12 items-center justify-center border border-[rgba(244,241,232,0.22)] px-5 text-sm font-semibold text-[var(--paper)] transition hover:border-[var(--paper)]"
              >
                Inspect account health
              </Link>
            </div>
          </div>

          <aside className="night-lattice hidden border border-[rgba(247,248,239,0.18)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur lg:block">
            <div className="flex items-center justify-between gap-4 border-b border-[rgba(244,241,232,0.14)] pb-4">
              <span className="font-mono text-xs uppercase text-[rgba(244,241,232,0.62)]">
                Account pulse
              </span>
              <span className="font-mono text-xs text-[var(--mint)]">
                recalculated 14:35
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {accountSignals.map((account) => (
                <div
                  key={account.name}
                  className="grid grid-cols-[56px_1fr] gap-4 border border-[rgba(244,241,232,0.12)] bg-[rgba(244,241,232,0.045)] p-3"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center border font-mono text-lg ${
                      account.status === "healthy"
                        ? "border-[rgba(185,255,74,0.45)] text-[var(--mint)]"
                        : account.status === "watch"
                          ? "border-[rgba(255,183,44,0.48)] text-[var(--amber)]"
                          : "border-[rgba(255,79,123,0.5)] text-[var(--coral)]"
                    }`}
                  >
                    {account.score}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--paper)]">
                      {account.name}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-[rgba(244,241,232,0.62)]">
                      {account.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section
        id="signals"
        className="border-y border-[var(--line)] bg-[var(--paper)] px-5 py-16 sm:px-8 lg:px-12"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-mono text-xs uppercase text-[var(--muted)]">
              Decision briefing
            </p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              Not more charts. Better product judgment.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--muted)]">
              PulseOps turns raw product events into activation paths, silent
              accounts, and transparent health scores.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="border border-[var(--line)] bg-white p-5 shadow-[inset_6px_0_0_var(--cyan)]">
              <p className="font-mono text-xs uppercase text-[var(--muted)]">
                Activation
              </p>
              <p className="mt-6 text-5xl font-semibold">39%</p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Drop-off concentrates before first event sent.
              </p>
            </article>
            <article className="border border-[var(--line)] bg-white p-5 shadow-[inset_6px_0_0_var(--coral)]">
              <p className="font-mono text-xs uppercase text-[var(--muted)]">
                Silent accounts
              </p>
              <p className="mt-6 text-5xl font-semibold text-[var(--coral)]">
                7
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                No tracked activity for at least 14 days.
              </p>
            </article>
            <article className="border border-[var(--line)] bg-white p-5 shadow-[inset_6px_0_0_var(--mint)]">
              <p className="font-mono text-xs uppercase text-[var(--muted)]">
                Key feature
              </p>
              <p className="mt-6 text-5xl font-semibold text-[var(--mint)]">
                +18
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Health lift after teammate invited.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section
        id="health"
        className="spectral-tile px-5 py-16 sm:px-8 lg:px-12"
      >
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="border border-[var(--line-strong)] bg-[var(--paper)] p-5">
            <div className="flex flex-col justify-between gap-4 border-b border-[rgba(17,20,15,0.12)] pb-5 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono text-xs uppercase text-[var(--muted)]">
                  Activation path
                </p>
                <h2 className="mt-3 text-3xl font-semibold">
                  Where accounts lose momentum
                </h2>
              </div>
              <p className="font-mono text-xs text-[var(--muted)]">
                last calculation 14:35
              </p>
            </div>

            <div className="mt-8 space-y-5">
              {funnelSteps.map((step) => (
                <div key={step.label}>
                  <div className="mb-2 flex items-center justify-between gap-4 font-mono text-xs">
                    <span>{step.label}</span>
                    <span>{step.value}%</span>
                  </div>
                  <div className="h-8 border border-[rgba(17,20,15,0.12)] bg-white">
                    <div
                      className="bar-rise h-full bg-[var(--cyan)]"
                      style={{ width: `${step.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            id="integration"
            className="night-lattice border border-[rgba(247,248,239,0.16)] p-5 text-[var(--paper)]"
          >
            <p className="font-mono text-xs uppercase text-[var(--cyan)]">
              Ingestion check
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              Events should feel traceable.
            </h2>
            <TrackEventTester />
          </div>
        </div>
      </section>
    </main>
  );
}
