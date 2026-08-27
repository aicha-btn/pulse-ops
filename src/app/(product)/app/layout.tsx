import { AppShell } from "@/components/app/app-shell";
import { getAuthState } from "@/features/auth/session";
import { getDashboardData } from "@/features/dashboard/get-dashboard-data";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { signOutAction } from "../../login/actions";

export const dynamic = "force-dynamic";

export default async function ProductLayout({
  children,
}: {
  children: ReactNode;
}) {
  const authState = await getAuthState();

  if (authState.status === "signed_out") {
    redirect("/login?next=/app");
  }

  const dashboardData = await getDashboardData();

  return (
    <AppShell
      authState={authState}
      lastCalculationLabel={dashboardData.lastCalculationLabel}
      projectName={dashboardData.projectName}
      signOutAction={signOutAction}
      source={dashboardData.source}
      sourceNote={dashboardData.sourceNote}
    >
      {children}
    </AppShell>
  );
}
