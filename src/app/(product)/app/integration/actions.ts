"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDatabase } from "@/db/client";
import { isDatabaseConfigured } from "@/db/config";
import { apiKeys } from "@/db/schema";
import { getAuthState } from "@/features/auth/session";
import {
  API_KEY_PREFIX,
  generateApiKey,
  getApiKeyLastFour,
  hashApiKey,
} from "@/features/ingestion/api-key";
import {
  getCurrentWorkspaceProject,
  getLatestProject,
  type WorkspaceProject,
} from "@/features/workspaces/default-project";

export type CreateApiKeyActionState = {
  createdKey?: string;
  createdKeyName?: string;
  message: string;
  status: "idle" | "success" | "error";
};

type ApiKeyMutationProjectResult =
  | {
      ok: true;
      project: WorkspaceProject;
    }
  | {
      ok: false;
      message: string;
    };

export async function createApiKeyAction(
  _state: CreateApiKeyActionState,
  formData: FormData,
): Promise<CreateApiKeyActionState> {
  const projectResult = await getProjectForApiKeyMutation();

  if (!projectResult.ok) {
    return {
      status: "error",
      message: projectResult.message,
    };
  }

  const apiKey = generateApiKey();
  const keyName = readKeyName(formData);
  const db = getDatabase();

  await db.insert(apiKeys).values({
    projectId: projectResult.project.id,
    name: keyName,
    keyPrefix: API_KEY_PREFIX,
    keyHash: hashApiKey(apiKey),
    lastFour: getApiKeyLastFour(apiKey),
    status: "active",
  });

  revalidatePath("/app/integration");

  return {
    status: "success",
    message: "API key created. Copy it now; PulseOps will only store its hash.",
    createdKey: apiKey,
    createdKeyName: keyName,
  };
}

export async function revokeApiKeyAction(formData: FormData) {
  const projectResult = await getProjectForApiKeyMutation();

  if (!projectResult.ok) {
    return;
  }

  const keyId = String(formData.get("keyId") ?? "");

  if (!keyId) {
    return;
  }

  const db = getDatabase();
  await db
    .update(apiKeys)
    .set({
      status: "revoked",
      revokedAt: new Date(),
    })
    .where(
      and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.projectId, projectResult.project.id),
        eq(apiKeys.status, "active"),
      ),
    );

  revalidatePath("/app/integration");
}

async function getProjectForApiKeyMutation(): Promise<ApiKeyMutationProjectResult> {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      message: "Connect DATABASE_URL before creating real API keys.",
    };
  }

  const authState = await getAuthState();

  if (authState.status === "signed_out") {
    redirect("/login?next=/app/integration");
  }

  if (authState.status === "signed_in") {
    const project = await getCurrentWorkspaceProject();

    if (!project) {
      return {
        ok: false,
        message: "Create or seed a project before creating an API key.",
      };
    }

    return {
      ok: true,
      project,
    };
  }

  const project = await getLatestProject();

  if (!project) {
    return {
      ok: false,
      message: "Create or seed a project before creating an API key.",
    };
  }

  return {
    ok: true,
    project,
  };
}

function readKeyName(formData: FormData) {
  const value = String(formData.get("name") ?? "").trim();

  return value.slice(0, 120) || "Ingestion key";
}
