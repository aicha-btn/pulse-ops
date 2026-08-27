import { asc, eq } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { isDatabaseConfigured } from "@/db/config";
import {
  activationFunnels,
  activationFunnelSteps,
  projects,
} from "@/db/schema";
import {
  getCurrentWorkspaceProject,
  type WorkspaceProject,
} from "@/features/workspaces/default-project";

export type FunnelStepSetting = {
  eventName: string;
  label: string;
  orderIndex: number;
};

export type ProjectSettingsData =
  | {
      mode: "disabled";
      disabledReason: string;
      projectName: string;
      inactivityThresholdDays: number;
      activationWindowDays: number;
      steps: FunnelStepSetting[];
    }
  | {
      mode: "ready";
      project: WorkspaceProject;
      projectName: string;
      inactivityThresholdDays: number;
      activationWindowDays: number;
      steps: FunnelStepSetting[];
    };

const defaultSteps: FunnelStepSetting[] = [
  {
    eventName: "signed_up",
    label: "Signed up",
    orderIndex: 0,
  },
  {
    eventName: "project_created",
    label: "Project created",
    orderIndex: 1,
  },
  {
    eventName: "api_key_created",
    label: "API key created",
    orderIndex: 2,
  },
  {
    eventName: "first_event_sent",
    label: "First event sent",
    orderIndex: 3,
  },
];

export async function getProjectSettingsData(): Promise<ProjectSettingsData> {
  if (!isDatabaseConfigured()) {
    return {
      mode: "disabled",
      disabledReason: "Connect DATABASE_URL to edit project rules.",
      projectName: "Northstar Analytics",
      inactivityThresholdDays: 14,
      activationWindowDays: 14,
      steps: defaultSteps,
    };
  }

  const project = await getCurrentWorkspaceProject();

  if (!project) {
    return {
      mode: "disabled",
      disabledReason: "Create or seed a project before editing settings.",
      projectName: "No project yet",
      inactivityThresholdDays: 14,
      activationWindowDays: 14,
      steps: defaultSteps,
    };
  }

  const db = getDatabase();
  const [projectRow] = await db
    .select({
      inactivityThresholdDays: projects.inactivityThresholdDays,
      name: projects.name,
    })
    .from(projects)
    .where(eq(projects.id, project.id))
    .limit(1);

  const [funnel] = await db
    .select({
      id: activationFunnels.id,
      activationWindowDays: activationFunnels.activationWindowDays,
    })
    .from(activationFunnels)
    .where(eq(activationFunnels.projectId, project.id))
    .limit(1);

  const steps = funnel
    ? await db
        .select({
          eventName: activationFunnelSteps.eventName,
          label: activationFunnelSteps.label,
          orderIndex: activationFunnelSteps.orderIndex,
        })
        .from(activationFunnelSteps)
        .where(eq(activationFunnelSteps.funnelId, funnel.id))
        .orderBy(asc(activationFunnelSteps.orderIndex))
    : defaultSteps;

  return {
    mode: "ready",
    project,
    projectName: projectRow?.name ?? project.name,
    inactivityThresholdDays: projectRow?.inactivityThresholdDays ?? 14,
    activationWindowDays: funnel?.activationWindowDays ?? 14,
    steps: steps.length > 0 ? steps : defaultSteps,
  };
}
