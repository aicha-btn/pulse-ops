import { and, count, desc, eq } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { isDatabaseConfigured } from "@/db/config";
import {
  apiKeys,
  companies,
  events,
  projects,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import { getAuthState } from "@/features/auth/session";
import { getCurrentWorkspaceProject } from "@/features/workspaces/default-project";

export type ProjectSummary = {
  id: string;
  name: string;
  slug: string;
  workspaceName: string;
  inactivityThresholdDays: number;
  createdAtLabel: string;
  companiesCount: number;
  eventsCount: number;
  activeApiKeysCount: number;
  isCurrent: boolean;
};

export type ProjectsData =
  | {
      mode: "disabled";
      disabledReason: string;
      projects: ProjectSummary[];
      source: "demo";
    }
  | {
      mode: "ready";
      projects: ProjectSummary[];
      source: "postgres";
    };

export async function getProjectsData(): Promise<ProjectsData> {
  if (!isDatabaseConfigured()) {
    return {
      mode: "disabled",
      disabledReason: "Connect DATABASE_URL to create and switch projects.",
      projects: [getDemoProject()],
      source: "demo",
    };
  }

  const currentProject = await getCurrentWorkspaceProject();

  if (!currentProject) {
    return {
      mode: "disabled",
      disabledReason: "Create or seed a workspace before managing projects.",
      projects: [],
      source: "demo",
    };
  }

  const db = getDatabase();
  const authState = await getAuthState();
  const projectRows =
    authState.status === "signed_in"
      ? await db
          .select({
            id: projects.id,
            name: projects.name,
            slug: projects.slug,
            workspaceName: workspaces.name,
            inactivityThresholdDays: projects.inactivityThresholdDays,
            createdAt: projects.createdAt,
          })
          .from(workspaceMembers)
          .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
          .innerJoin(projects, eq(projects.workspaceId, workspaces.id))
          .where(eq(workspaceMembers.authUserId, authState.userId))
          .orderBy(desc(projects.createdAt))
      : await db
          .select({
            id: projects.id,
            name: projects.name,
            slug: projects.slug,
            workspaceName: workspaces.name,
            inactivityThresholdDays: projects.inactivityThresholdDays,
            createdAt: projects.createdAt,
          })
          .from(projects)
          .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
          .where(eq(projects.workspaceId, currentProject.workspaceId))
          .orderBy(desc(projects.createdAt));

  const summaries = await Promise.all(
    projectRows.map(async (project) => ({
      id: project.id,
      name: project.name,
      slug: project.slug,
      workspaceName: project.workspaceName,
      inactivityThresholdDays: project.inactivityThresholdDays,
      createdAtLabel: formatDate(project.createdAt),
      companiesCount: await countCompanies(project.id),
      eventsCount: await countEvents(project.id),
      activeApiKeysCount: await countActiveApiKeys(project.id),
      isCurrent: project.id === currentProject.id,
    })),
  );

  return {
    mode: "ready",
    projects: summaries,
    source: "postgres",
  };
}

async function countCompanies(projectId: string) {
  const db = getDatabase();
  const [result] = await db
    .select({
      value: count(),
    })
    .from(companies)
    .where(eq(companies.projectId, projectId));

  return Number(result?.value ?? 0);
}

async function countEvents(projectId: string) {
  const db = getDatabase();
  const [result] = await db
    .select({
      value: count(),
    })
    .from(events)
    .where(eq(events.projectId, projectId));

  return Number(result?.value ?? 0);
}

async function countActiveApiKeys(projectId: string) {
  const db = getDatabase();
  const [result] = await db
    .select({
      value: count(),
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.projectId, projectId), eq(apiKeys.status, "active")));

  return Number(result?.value ?? 0);
}

function getDemoProject(): ProjectSummary {
  return {
    id: "demo-project",
    name: "Northstar Analytics",
    slug: "northstar-demo",
    workspaceName: "PulseOps Demo",
    inactivityThresholdDays: 14,
    createdAtLabel: "Aug 24",
    companiesCount: 8,
    eventsCount: 851,
    activeApiKeysCount: 1,
    isCurrent: true,
  };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
  }).format(date);
}
