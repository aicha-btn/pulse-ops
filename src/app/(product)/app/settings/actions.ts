"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDatabase } from "@/db/client";
import { isDatabaseConfigured } from "@/db/config";
import {
  activationFunnels,
  activationFunnelSteps,
  projects,
} from "@/db/schema";
import { getAuthState } from "@/features/auth/session";
import {
  getCurrentWorkspaceProject,
  type WorkspaceProject,
} from "@/features/workspaces/default-project";

type SettingsProjectResult =
  | {
      ok: true;
      project: WorkspaceProject;
    }
  | {
      ok: false;
      message: string;
    };

export async function updateProjectRulesAction(formData: FormData) {
  const projectResult = await getProjectForSettingsMutation();

  if (!projectResult.ok) {
    redirectWithError(projectResult.message);
  }

  const projectName = readRequiredText(
    formData,
    "projectName",
    "Project name is required.",
  );
  const inactivityThresholdDays = readInteger(formData, {
    fallback: 14,
    max: 90,
    min: 1,
    name: "inactivityThresholdDays",
  });
  const activationWindowDays = readInteger(formData, {
    fallback: 14,
    max: 60,
    min: 1,
    name: "activationWindowDays",
  });
  const db = getDatabase();

  await db.transaction(async (tx) => {
    await tx
      .update(projects)
      .set({
        inactivityThresholdDays,
        name: projectName.slice(0, 120),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectResult.project.id));

    await tx
      .insert(activationFunnels)
      .values({
        projectId: projectResult.project.id,
        name: "Activation",
        activationWindowDays,
        isPrimary: true,
      })
      .onConflictDoUpdate({
        target: activationFunnels.projectId,
        set: {
          activationWindowDays,
          isPrimary: true,
          name: "Activation",
          updatedAt: new Date(),
        },
      });
  });

  revalidateProductPaths();
  redirect("/app/settings?saved=rules");
}

export async function updateFunnelStepsAction(formData: FormData) {
  const projectResult = await getProjectForSettingsMutation();

  if (!projectResult.ok) {
    redirectWithError(projectResult.message);
  }

  const steps = readFunnelSteps(formData);

  if (steps.length < 2) {
    redirectWithError("Keep at least two activation steps.");
  }

  const db = getDatabase();

  await db.transaction(async (tx) => {
    const [funnel] = await tx
      .insert(activationFunnels)
      .values({
        projectId: projectResult.project.id,
        name: "Activation",
        activationWindowDays: 14,
        isPrimary: true,
      })
      .onConflictDoUpdate({
        target: activationFunnels.projectId,
        set: {
          isPrimary: true,
          name: "Activation",
          updatedAt: new Date(),
        },
      })
      .returning({
        id: activationFunnels.id,
      });

    await tx
      .delete(activationFunnelSteps)
      .where(eq(activationFunnelSteps.funnelId, funnel.id));

    await tx.insert(activationFunnelSteps).values(
      steps.map((step, orderIndex) => ({
        funnelId: funnel.id,
        orderIndex,
        eventName: step.eventName,
        label: step.label,
      })),
    );
  });

  revalidateProductPaths();
  redirect("/app/settings?saved=funnel");
}

async function getProjectForSettingsMutation(): Promise<SettingsProjectResult> {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      message: "Connect DATABASE_URL before editing project settings.",
    };
  }

  const authState = await getAuthState();

  if (authState.status === "signed_out") {
    redirect("/login?next=/app/settings");
  }

  const project = await getCurrentWorkspaceProject();

  if (!project) {
    return {
      ok: false,
      message: "Create or seed a project before editing settings.",
    };
  }

  return {
    ok: true,
    project,
  };
}

function readRequiredText(formData: FormData, name: string, message: string) {
  const value = String(formData.get(name) ?? "").trim();

  if (!value) {
    redirectWithError(message);
  }

  return value;
}

function readInteger(
  formData: FormData,
  {
    fallback,
    max,
    min,
    name,
  }: {
    fallback: number;
    max: number;
    min: number;
    name: string;
  },
) {
  const rawValue = Number(formData.get(name));

  if (!Number.isFinite(rawValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(rawValue)));
}

function readFunnelSteps(formData: FormData) {
  const steps: { eventName: string; label: string }[] = [];

  for (let index = 0; index < 6; index += 1) {
    const eventName = normalizeEventName(
      String(formData.get(`eventName_${index}`) ?? ""),
    );
    const label = String(formData.get(`label_${index}`) ?? "").trim();

    if (!eventName) {
      continue;
    }

    steps.push({
      eventName,
      label: label.slice(0, 160) || humanizeEventName(eventName),
    });
  }

  return steps;
}

function normalizeEventName(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_.:-]/g, "")
    .slice(0, 160);

  return normalized.length >= 2 ? normalized : "";
}

function humanizeEventName(value: string) {
  return value
    .split(/[_:.-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function revalidateProductPaths() {
  revalidatePath("/app");
  revalidatePath("/app/companies");
  revalidatePath("/app/inactive");
  revalidatePath("/app/settings");
}

function redirectWithError(message: string): never {
  redirect(`/app/settings?error=${encodeURIComponent(message)}`);
}
