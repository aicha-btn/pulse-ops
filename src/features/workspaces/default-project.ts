import { and, count, desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { getDatabase } from "@/db/client";
import {
  activationFunnelSteps,
  activationFunnels,
  events,
  projects,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import { getAuthState } from "@/features/auth/session";

export const CURRENT_PROJECT_COOKIE = "pulseops_current_project_id";

const DEFAULT_PROJECT_SLUG = "main";
const DEFAULT_INACTIVITY_THRESHOLD_DAYS = 14;
const SEEDED_DEMO_WORKSPACE_SLUG = "pulseops-demo";
const SEEDED_DEMO_PROJECT_SLUG = "northstar-demo";

export const defaultFunnelSteps = [
  {
    eventName: "signed_up",
    label: "Signed up",
  },
  {
    eventName: "project_created",
    label: "Project created",
  },
  {
    eventName: "api_key_created",
    label: "API key created",
  },
  {
    eventName: "first_event_sent",
    label: "First event sent",
  },
];

export type WorkspaceProject = {
  id: string;
  name: string;
  slug: string;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
};

type EnsureDefaultProjectInput = {
  authUserId: string;
  email: string;
};

export async function getLatestProject(): Promise<WorkspaceProject | null> {
  const db = getDatabase();
  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      workspaceSlug: workspaces.slug,
    })
    .from(projects)
    .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
    .orderBy(desc(projects.createdAt))
    .limit(1);

  return project ?? null;
}

export async function getCurrentWorkspaceProject(): Promise<WorkspaceProject | null> {
  const authState = await getAuthState();
  const selectedProjectId = await getSelectedProjectId();

  if (authState.status === "signed_in") {
    const selectedProject = selectedProjectId
      ? await getProjectForUser(authState.userId, selectedProjectId)
      : null;

    if (
      selectedProject &&
      !(await shouldPreferSeededDemoProject(authState.userId, selectedProject))
    ) {
      return selectedProject;
    }

    const existingProject = await getProjectForUser(authState.userId);

    if (
      existingProject &&
      !(await shouldPreferSeededDemoProject(authState.userId, existingProject))
    ) {
      return existingProject;
    }

    const seededDemoProject = await getSeededDemoProjectForUser(authState.userId);

    if (seededDemoProject) {
      return seededDemoProject;
    }

    return getOrCreateDefaultProjectForUser({
      authUserId: authState.userId,
      email: authState.email,
    });
  }

  if (selectedProjectId) {
    const selectedProject = await getProjectById(selectedProjectId);

    if (selectedProject) {
      return selectedProject;
    }
  }

  return getLatestProject();
}

export async function getOrCreateDefaultProjectForUser({
  authUserId,
  email,
}: EnsureDefaultProjectInput): Promise<WorkspaceProject> {
  const db = getDatabase();
  const existingProject = await getProjectForUser(authUserId);

  if (existingProject) {
    return existingProject;
  }

  return db.transaction(async (tx) => {
    const workspaceName = getWorkspaceName(email);
    const [workspace] = await tx
      .insert(workspaces)
      .values({
        name: workspaceName,
        slug: getWorkspaceSlug(authUserId),
      })
      .onConflictDoUpdate({
        target: workspaces.slug,
        set: {
          name: workspaceName,
          updatedAt: new Date(),
        },
      })
      .returning({
        id: workspaces.id,
        name: workspaces.name,
      });

    await tx
      .insert(workspaceMembers)
      .values({
        workspaceId: workspace.id,
        authUserId,
        role: "owner",
      })
      .onConflictDoUpdate({
        target: [workspaceMembers.workspaceId, workspaceMembers.authUserId],
        set: {
          role: "owner",
        },
      });

    const [project] = await tx
      .insert(projects)
      .values({
        workspaceId: workspace.id,
        name: "PulseOps Project",
        slug: DEFAULT_PROJECT_SLUG,
        inactivityThresholdDays: DEFAULT_INACTIVITY_THRESHOLD_DAYS,
      })
      .onConflictDoUpdate({
        target: [projects.workspaceId, projects.slug],
        set: {
          inactivityThresholdDays: DEFAULT_INACTIVITY_THRESHOLD_DAYS,
          updatedAt: new Date(),
        },
      })
      .returning({
        id: projects.id,
        name: projects.name,
        slug: projects.slug,
      });

    const [funnel] = await tx
      .insert(activationFunnels)
      .values({
        projectId: project.id,
        name: "Activation",
        activationWindowDays: 14,
        isPrimary: true,
      })
      .onConflictDoUpdate({
        target: activationFunnels.projectId,
        set: {
          name: "Activation",
          activationWindowDays: 14,
          isPrimary: true,
          updatedAt: new Date(),
        },
      })
      .returning({
        id: activationFunnels.id,
      });

    for (const [index, step] of defaultFunnelSteps.entries()) {
      await tx
        .insert(activationFunnelSteps)
        .values({
          funnelId: funnel.id,
          orderIndex: index,
          eventName: step.eventName,
          label: step.label,
        })
        .onConflictDoUpdate({
          target: [
            activationFunnelSteps.funnelId,
            activationFunnelSteps.orderIndex,
          ],
          set: {
            eventName: step.eventName,
            label: step.label,
          },
        });
    }

    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceSlug: getWorkspaceSlug(authUserId),
    };
  });
}

export function isSeededDemoProject(project: WorkspaceProject) {
  return (
    project.workspaceSlug === SEEDED_DEMO_WORKSPACE_SLUG &&
    project.slug === SEEDED_DEMO_PROJECT_SLUG
  );
}

async function getProjectForUser(
  authUserId: string,
  projectId?: string,
): Promise<WorkspaceProject | null> {
  const db = getDatabase();
  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      workspaceSlug: workspaces.slug,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .innerJoin(projects, eq(projects.workspaceId, workspaces.id))
    .where(
      projectId
        ? and(eq(workspaceMembers.authUserId, authUserId), eq(projects.id, projectId))
        : eq(workspaceMembers.authUserId, authUserId),
    )
    .orderBy(desc(projects.createdAt))
    .limit(1);

  return project ?? null;
}

async function getProjectById(projectId: string): Promise<WorkspaceProject | null> {
  const db = getDatabase();
  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      workspaceSlug: workspaces.slug,
    })
    .from(projects)
    .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
    .where(eq(projects.id, projectId))
    .limit(1);

  return project ?? null;
}

async function getSeededDemoProjectForUser(
  authUserId: string,
): Promise<WorkspaceProject | null> {
  const db = getDatabase();
  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      workspaceSlug: workspaces.slug,
    })
    .from(projects)
    .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaces.slug, SEEDED_DEMO_WORKSPACE_SLUG),
        eq(projects.slug, SEEDED_DEMO_PROJECT_SLUG),
      ),
    )
    .limit(1);

  if (!project) {
    return null;
  }

  await db
    .insert(workspaceMembers)
    .values({
      workspaceId: project.workspaceId,
      authUserId,
      role: "owner",
    })
    .onConflictDoUpdate({
      target: [workspaceMembers.workspaceId, workspaceMembers.authUserId],
      set: {
        role: "owner",
      },
    });

  return project;
}

async function shouldPreferSeededDemoProject(
  authUserId: string,
  project: WorkspaceProject,
) {
  if (isSeededDemoProject(project)) {
    return false;
  }

  if (
    project.slug !== DEFAULT_PROJECT_SLUG ||
    project.workspaceSlug !== getWorkspaceSlug(authUserId)
  ) {
    return false;
  }

  const db = getDatabase();
  const [result] = await db
    .select({
      value: count(),
    })
    .from(events)
    .where(eq(events.projectId, project.id));

  return Number(result?.value ?? 0) === 0;
}

async function getSelectedProjectId() {
  const cookieStore = await cookies();
  const value = cookieStore.get(CURRENT_PROJECT_COOKIE)?.value;

  return value && value.length > 0 ? value : null;
}

function getWorkspaceSlug(authUserId: string) {
  return `workspace-${authUserId}`;
}

function getWorkspaceName(email: string) {
  const namePart = email.split("@")[0]?.trim();

  if (!namePart || namePart === "Signed in") {
    return "Personal Workspace";
  }

  return `${humanizeSlug(namePart)} Workspace`;
}

function humanizeSlug(value: string) {
  return value
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
