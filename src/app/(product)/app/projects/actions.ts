"use server";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDatabase } from "@/db/client";
import { isDatabaseConfigured } from "@/db/config";
import {
  activationFunnels,
  activationFunnelSteps,
  projects,
  workspaceMembers,
} from "@/db/schema";
import { getAuthState } from "@/features/auth/session";
import {
  CURRENT_PROJECT_COOKIE,
  defaultFunnelSteps,
  getCurrentWorkspaceProject,
  type WorkspaceProject,
} from "@/features/workspaces/default-project";

type ProjectMutationResult =
  | {
      ok: true;
      project: WorkspaceProject;
    }
  | {
      ok: false;
      message: string;
    };

export async function createProjectAction(formData: FormData) {
  const projectResult = await getProjectForProjectMutation();

  if (!projectResult.ok) {
    redirectWithError(projectResult.message);
  }

  const name = readProjectName(formData);
  const db = getDatabase();
  const slug = await buildUniqueProjectSlug(projectResult.project.workspaceId, name);

  const [project] = await db.transaction(async (tx) => {
    const [createdProject] = await tx
      .insert(projects)
      .values({
        workspaceId: projectResult.project.workspaceId,
        name,
        slug,
        inactivityThresholdDays: 14,
      })
      .returning({
        id: projects.id,
      });

    const [funnel] = await tx
      .insert(activationFunnels)
      .values({
        projectId: createdProject.id,
        name: "Activation",
        activationWindowDays: 14,
        isPrimary: true,
      })
      .returning({
        id: activationFunnels.id,
      });

    await tx.insert(activationFunnelSteps).values(
      defaultFunnelSteps.map((step, orderIndex) => ({
        funnelId: funnel.id,
        orderIndex,
        eventName: step.eventName,
        label: step.label,
      })),
    );

    return [createdProject];
  });

  await setCurrentProjectCookie(project.id);
  revalidateProductPaths();
  redirect("/app/projects?saved=created");
}

export async function selectProjectAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");

  if (!projectId) {
    redirectWithError("Project id is required.");
  }

  const canAccess = await canAccessProject(projectId);

  if (!canAccess) {
    redirectWithError("This project is not available in the current workspace.");
  }

  await setCurrentProjectCookie(projectId);
  revalidateProductPaths();
  redirect("/app/projects?saved=selected");
}

async function getProjectForProjectMutation(): Promise<ProjectMutationResult> {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      message: "Connect DATABASE_URL before creating projects.",
    };
  }

  const authState = await getAuthState();

  if (authState.status === "signed_out") {
    redirect("/login?next=/app/projects");
  }

  const project = await getCurrentWorkspaceProject();

  if (!project) {
    return {
      ok: false,
      message: "Create or seed a workspace before creating projects.",
    };
  }

  return {
    ok: true,
    project,
  };
}

async function canAccessProject(projectId: string) {
  if (!isDatabaseConfigured()) {
    return false;
  }

  const db = getDatabase();
  const authState = await getAuthState();

  if (authState.status === "signed_out") {
    redirect("/login?next=/app/projects");
  }

  if (authState.status === "signed_in") {
    const [project] = await db
      .select({
        id: projects.id,
      })
      .from(workspaceMembers)
      .innerJoin(projects, eq(projects.workspaceId, workspaceMembers.workspaceId))
      .where(
        and(
          eq(workspaceMembers.authUserId, authState.userId),
          eq(projects.id, projectId),
        ),
      )
      .limit(1);

    return Boolean(project);
  }

  const currentProject = await getCurrentWorkspaceProject();

  if (!currentProject) {
    return false;
  }

  const [project] = await db
    .select({
      id: projects.id,
    })
    .from(projects)
    .where(
      and(
        eq(projects.workspaceId, currentProject.workspaceId),
        eq(projects.id, projectId),
      ),
    )
    .limit(1);

  return Boolean(project);
}

async function buildUniqueProjectSlug(workspaceId: string, name: string) {
  const baseSlug = normalizeSlug(name);
  let slug = baseSlug;
  let suffix = 2;

  while (await projectSlugExists(workspaceId, slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function projectSlugExists(workspaceId: string, slug: string) {
  const db = getDatabase();
  const [project] = await db
    .select({
      id: projects.id,
    })
    .from(projects)
    .where(and(eq(projects.workspaceId, workspaceId), eq(projects.slug, slug)))
    .limit(1);

  return Boolean(project);
}

async function setCurrentProjectCookie(projectId: string) {
  const cookieStore = await cookies();

  cookieStore.set(CURRENT_PROJECT_COOKIE, projectId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
}

function readProjectName(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    redirectWithError("Project name is required.");
  }

  return name.slice(0, 120);
}

function normalizeSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return slug || "project";
}

function revalidateProductPaths() {
  revalidatePath("/app");
  revalidatePath("/app/companies");
  revalidatePath("/app/events");
  revalidatePath("/app/inactive");
  revalidatePath("/app/integration");
  revalidatePath("/app/projects");
  revalidatePath("/app/settings");
  revalidatePath("/app/users");
}

function redirectWithError(message: string): never {
  redirect(`/app/projects?error=${encodeURIComponent(message)}`);
}
