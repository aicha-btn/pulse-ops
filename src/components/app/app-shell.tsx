"use client";

import {
  Activity,
  BellOff,
  Building2,
  FileCode2,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Radio,
  Server,
  SlidersHorizontal,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SignalIndicator } from "@/components/app/pulse-primitives";
import type { AuthState } from "@/features/auth/session";

type ShellAuthState = Extract<
  AuthState,
  {
    status: "demo" | "signed_in";
  }
>;

type AppShellProps = {
  authState: ShellAuthState;
  children: ReactNode;
  lastCalculationLabel: string;
  projectName: string;
  signOutAction: (formData: FormData) => void | Promise<void>;
  source: "postgres" | "demo";
  sourceNote: string;
};

const navItems = [
  {
    href: "/app",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/app/projects",
    label: "Projects",
    icon: FolderKanban,
  },
  {
    href: "/app/companies",
    label: "Companies",
    icon: Building2,
  },
  {
    href: "/app/users",
    label: "Users",
    icon: UsersRound,
  },
  {
    href: "/app/events",
    label: "Events",
    icon: Radio,
  },
  {
    href: "/app/inactive",
    label: "Inactive",
    icon: BellOff,
  },
  {
    href: "/app/integration",
    label: "Integration",
    icon: FileCode2,
  },
  {
    href: "/app/settings",
    label: "Settings",
    icon: SlidersHorizontal,
  },
  {
    href: "/app/system",
    label: "System",
    icon: Server,
  },
];

const observeNavItems = navItems.slice(0, 6);
const configureNavItems = navItems.slice(6);

export function AppShell({
  authState,
  children,
  lastCalculationLabel,
  projectName,
  signOutAction,
  source,
  sourceNote,
}: AppShellProps) {
  const pathname = usePathname();
  const streamState = source === "postgres" ? "Live stream" : "Demo stream";
  const sourceLabel =
    source === "postgres"
      ? "Supabase PostgreSQL is feeding this workspace."
      : sourceNote;

  return (
    <div className="observatory-grid min-h-screen text-[var(--ink)]">
      <aside className="night-lattice fixed inset-y-0 left-0 hidden w-64 border-r border-[rgba(247,248,239,0.16)] text-[var(--paper)] lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-[var(--app-header-height)] shrink-0 items-center border-b border-[rgba(247,248,239,0.16)] px-5">
            <Link
              className="flex items-center gap-3 font-mono text-sm uppercase"
              href="/"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--cyan)] bg-[rgba(34,223,197,0.08)] text-[var(--cyan)]">
                <Activity size={17} strokeWidth={1.8} />
              </span>
              <span>
                PulseOps
                <span className="mt-1 block font-mono text-[10px] uppercase text-[rgba(247,248,239,0.48)]">
                  signal observatory
                </span>
              </span>
            </Link>
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <NavGroup
              items={observeNavItems}
              label="Observe"
              pathname={pathname}
            />
            <NavGroup
              className="mt-5"
              items={configureNavItems}
              label="Operate"
              pathname={pathname}
            />
          </nav>
          <div className="shrink-0 border-t border-[rgba(247,248,239,0.16)] bg-[rgba(23,16,31,0.72)] p-4 pb-16 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-xs uppercase text-[rgba(247,248,239,0.5)]">
                Telemetry source
              </p>
              <span className="signal-node" aria-hidden="true" />
            </div>
            <Link
              className="mt-2 block text-sm font-semibold transition hover:text-[var(--cyan)]"
              href="/app/projects"
            >
              {projectName}
            </Link>
            <p className="mt-2 truncate font-mono text-xs uppercase text-[rgba(247,248,239,0.54)]">
              {streamState}
            </p>
            <div className="mt-5 border-t border-[rgba(247,248,239,0.14)] pt-4">
              <p className="font-mono text-xs uppercase text-[rgba(247,248,239,0.5)]">
                Access
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {authState.email}
                  </p>
                  <p className="mt-1 text-xs text-[rgba(247,248,239,0.58)]">
                    {authState.status === "demo"
                      ? "Demo mode"
                      : "Supabase session"}
                  </p>
                </div>
                {authState.status === "signed_in" ? (
                  <form action={signOutAction}>
                    <button
                      aria-label="Sign out"
                      className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[rgba(247,248,239,0.18)] text-[rgba(247,248,239,0.62)] transition hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
                      title="Sign out"
                      type="submit"
                    >
                      <LogOut size={15} strokeWidth={1.8} />
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-[var(--border-soft)] bg-[rgba(247,248,239,0.82)] px-5 shadow-[0_1px_0_rgba(34,223,197,0.18)] backdrop-blur lg:h-[var(--app-header-height)] lg:px-8">
          <div className="grid min-h-24 gap-4 py-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:py-0">
            <div className="flex min-w-0 items-center justify-between gap-3 lg:hidden">
              <Link
                className="flex min-w-0 items-center gap-3 font-mono text-sm uppercase"
                href="/"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--signal)] bg-[rgba(34,223,197,0.08)] text-[var(--signal)]">
                  <Activity size={17} strokeWidth={1.8} />
                </span>
                <span className="min-w-0">
                  PulseOps
                  <span className="mt-1 block truncate font-mono text-[10px] uppercase text-[var(--muted)]">
                    {projectName}
                  </span>
                </span>
              </Link>
              <SignalIndicator label={streamState} tone="signal" />
            </div>
            <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1.1fr)_160px_160px] md:items-center">
              <div className="min-w-0">
                <p className="font-mono text-xs uppercase text-[var(--muted)]">
                  System status
                </p>
                <p className="mt-1 truncate text-sm text-[var(--muted)]">
                  {sourceLabel}
                </p>
              </div>
              <HeaderProbe label="last calculation" value={lastCalculationLabel} />
              <HeaderStream value={streamState} />
            </div>
            <nav className="flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map((item) => {
                const isActive = isActivePath(pathname, item.href);

                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={`whitespace-nowrap rounded-[var(--radius-sm)] border px-3 py-2 text-sm ${
                      isActive
                        ? "border-[rgba(34,223,197,0.42)] bg-[rgba(34,223,197,0.14)] text-[var(--ink)]"
                        : "border-[var(--line)] bg-[var(--paper)]"
                    }`}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex min-w-0 items-center gap-3 justify-self-start lg:min-w-[220px] lg:justify-self-end">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-soft)] bg-[var(--paper)] text-[var(--signal)]">
                <UserRound size={15} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {authState.email}
                </p>
                <p className="font-mono text-xs uppercase text-[var(--muted)]">
                  {authState.status === "demo" ? "Demo" : "Signed in"}
                </p>
              </div>
              {authState.status === "signed_in" ? (
                <form action={signOutAction}>
                  <button
                    aria-label="Sign out"
                    className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--paper)] text-[var(--muted)] transition hover:border-[var(--signal)] hover:text-[var(--signal)]"
                    title="Sign out"
                    type="submit"
                  >
                    <LogOut size={15} strokeWidth={1.8} />
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function NavGroup({
  className = "",
  items,
  label,
  pathname,
}: {
  className?: string;
  items: typeof navItems;
  label: string;
  pathname: string;
}) {
  return (
    <div className={className}>
      <p className="px-3 font-mono text-[10px] uppercase text-[rgba(247,248,239,0.42)]">
        {label}
      </p>
      <div className="mt-2 space-y-1">
        {items.map((item) => {
          const isActive = isActivePath(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`relative flex h-11 items-center gap-3 rounded-[var(--radius-sm)] border px-3 text-sm transition ${
                isActive
                  ? "border-[rgba(34,223,197,0.24)] bg-[rgba(34,223,197,0.1)] text-[var(--paper)]"
                  : "border-transparent text-[rgba(247,248,239,0.62)] hover:border-[rgba(247,248,239,0.16)] hover:bg-[rgba(247,248,239,0.055)] hover:text-[var(--paper)]"
              }`}
              href={item.href}
              key={item.href}
            >
              {isActive ? (
                <span className="absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-full bg-[var(--signal)]" />
              ) : null}
              <Icon
                className={isActive ? "text-[var(--signal)]" : ""}
                size={16}
                strokeWidth={1.8}
              />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {isActive ? <span className="signal-node" aria-hidden="true" /> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function HeaderProbe({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l border-[var(--border-soft)] pl-3">
      <p className="font-mono text-[10px] uppercase text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 truncate font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}

function HeaderStream({ value }: { value: string }) {
  return (
    <div className="min-w-0 border-l border-[var(--border-soft)] pl-3">
      <p className="font-mono text-[10px] uppercase text-[var(--muted)]">
        stream
      </p>
      <div className="mt-1">
        <SignalIndicator label={value} tone="signal" />
      </div>
    </div>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
