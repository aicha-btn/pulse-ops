import { desc, eq } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { isDatabaseConfigured } from "@/db/config";
import { apiKeys } from "@/db/schema";
import {
  getCurrentWorkspaceProject,
  isSeededDemoProject,
  type WorkspaceProject,
} from "@/features/workspaces/default-project";

export type ApiKeySummary = {
  id: string;
  name: string;
  preview: string;
  status: "active" | "revoked";
  createdAtLabel: string;
  lastUsedAtLabel: string;
  revokedAtLabel: string | null;
};

export type ApiKeysData =
  | {
      mode: "disabled";
      disabledReason: string;
      keys: ApiKeySummary[];
      projectName: string;
      testApiKey: string;
    }
  | {
      mode: "ready";
      keys: ApiKeySummary[];
      project: WorkspaceProject;
      projectName: string;
      testApiKey: string;
    };

export async function getApiKeysData(): Promise<ApiKeysData> {
  const seededDemoTestKey = process.env.NEXT_PUBLIC_INGESTION_TEST_KEY ?? "";

  if (!isDatabaseConfigured()) {
    return {
      mode: "disabled",
      disabledReason: "Connect DATABASE_URL to create real ingestion keys.",
      keys: [],
      projectName: "Northstar Analytics",
      testApiKey: seededDemoTestKey || "po_live_demo_1234567890",
    };
  }

  const project = await getCurrentWorkspaceProject();

  if (!project) {
    return {
      mode: "disabled",
      disabledReason: "Create or seed a project before generating API keys.",
      keys: [],
      projectName: "No project yet",
      testApiKey: "",
    };
  }

  const db = getDatabase();
  const keyRows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastFour: apiKeys.lastFour,
      status: apiKeys.status,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.projectId, project.id))
    .orderBy(desc(apiKeys.createdAt));

  return {
    mode: "ready",
    keys: keyRows.map((key) => ({
      id: key.id,
      name: key.name,
      preview: `${key.keyPrefix}...${key.lastFour}`,
      status: key.status,
      createdAtLabel: formatDateTime(key.createdAt),
      lastUsedAtLabel: key.lastUsedAt ? formatDateTime(key.lastUsedAt) : "Never",
      revokedAtLabel: key.revokedAt ? formatDateTime(key.revokedAt) : null,
    })),
    project,
    projectName: project.name,
    testApiKey: isSeededDemoProject(project) ? seededDemoTestKey : "",
  };
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
