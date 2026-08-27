import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export const workspaceMemberRole = pgEnum("workspace_member_role", [
  "owner",
  "admin",
  "viewer",
]);

export const apiKeyStatus = pgEnum("api_key_status", ["active", "revoked"]);

export const healthStatus = pgEnum("health_status", [
  "healthy",
  "watch",
  "at_risk",
  "silent",
]);

export const ingestionErrorStatus = pgEnum("ingestion_error_status", [
  "rejected",
  "stored",
  "ignored",
]);

export const aggregationRunStatus = pgEnum("aggregation_run_status", [
  "running",
  "completed",
  "failed",
]);

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    authUserId: uuid("auth_user_id").notNull(),
    role: workspaceMemberRole("role").notNull().default("viewer"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.workspaceId, table.authUserId],
    }),
    index("workspace_members_auth_user_id_idx").on(table.authUserId),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 80 }).notNull(),
    inactivityThresholdDays: integer("inactivity_threshold_days")
      .notNull()
      .default(14),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("projects_workspace_id_idx").on(table.workspaceId),
    uniqueIndex("projects_workspace_slug_idx").on(table.workspaceId, table.slug),
  ],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    keyPrefix: varchar("key_prefix", { length: 16 }).notNull(),
    keyHash: text("key_hash").notNull(),
    lastFour: varchar("last_four", { length: 4 }).notNull(),
    status: apiKeyStatus("status").notNull().default("active"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    index("api_keys_project_id_idx").on(table.projectId),
    uniqueIndex("api_keys_key_hash_idx").on(table.keyHash),
  ],
);

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    externalId: varchar("external_id", { length: 160 }).notNull(),
    name: varchar("name", { length: 160 }),
    traits: jsonb("traits").$type<JsonObject>().notNull().default({}),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("companies_project_id_idx").on(table.projectId),
    uniqueIndex("companies_project_external_id_idx").on(
      table.projectId,
      table.externalId,
    ),
  ],
);

export const trackedUsers = pgTable(
  "tracked_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    externalId: varchar("external_id", { length: 160 }).notNull(),
    email: varchar("email", { length: 254 }),
    name: varchar("name", { length: 160 }),
    traits: jsonb("traits").$type<JsonObject>().notNull().default({}),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("tracked_users_project_id_idx").on(table.projectId),
    index("tracked_users_company_id_idx").on(table.companyId),
    index("tracked_users_email_idx").on(table.email),
    uniqueIndex("tracked_users_project_external_id_idx").on(
      table.projectId,
      table.externalId,
    ),
  ],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id").references(() => trackedUsers.id, {
      onDelete: "set null",
    }),
    eventId: varchar("event_id", { length: 160 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    properties: jsonb("properties").$type<JsonObject>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("events_project_occurred_at_idx").on(
      table.projectId,
      table.occurredAt,
    ),
    index("events_project_name_idx").on(table.projectId, table.name),
    index("events_company_id_idx").on(table.companyId),
    uniqueIndex("events_project_event_id_idx").on(
      table.projectId,
      table.eventId,
    ),
  ],
);

export const activationFunnels = pgTable(
  "activation_funnels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull().default("Activation"),
    activationWindowDays: integer("activation_window_days")
      .notNull()
      .default(14),
    isPrimary: boolean("is_primary").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("activation_funnels_project_id_idx").on(table.projectId),
    uniqueIndex("activation_funnels_project_id_unique_idx").on(table.projectId),
  ],
);

export const activationFunnelSteps = pgTable(
  "activation_funnel_steps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    funnelId: uuid("funnel_id")
      .notNull()
      .references(() => activationFunnels.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull(),
    eventName: varchar("event_name", { length: 160 }).notNull(),
    label: varchar("label", { length: 160 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("activation_funnel_steps_funnel_id_idx").on(table.funnelId),
    uniqueIndex("activation_funnel_steps_order_idx").on(
      table.funnelId,
      table.orderIndex,
    ),
  ],
);

export const ingestionErrors = pgTable(
  "ingestion_errors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    apiKeyId: uuid("api_key_id").references(() => apiKeys.id, {
      onDelete: "set null",
    }),
    status: ingestionErrorStatus("status").notNull(),
    code: varchar("code", { length: 80 }).notNull(),
    message: text("message").notNull(),
    payloadPreview: jsonb("payload_preview").$type<JsonObject>(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ingestion_errors_project_received_at_idx").on(
      table.projectId,
      table.receivedAt,
    ),
  ],
);

export const ingestionRateLimits = pgTable(
  "ingestion_rate_limits",
  {
    apiKeyId: uuid("api_key_id")
      .notNull()
      .references(() => apiKeys.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    requestCount: integer("request_count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.apiKeyId, table.windowStart],
    }),
    index("ingestion_rate_limits_project_window_idx").on(
      table.projectId,
      table.windowStart,
    ),
  ],
);

export const aggregationRuns = pgTable(
  "aggregation_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 80 }).notNull(),
    status: aggregationRunStatus("status").notNull().default("running"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("aggregation_runs_project_started_at_idx").on(
      table.projectId,
      table.startedAt,
    ),
  ],
);

export const dailyProjectMetrics = pgTable(
  "daily_project_metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    eventsCount: integer("events_count").notNull().default(0),
    activeUsersCount: integer("active_users_count").notNull().default(0),
    activeCompaniesCount: integer("active_companies_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("daily_project_metrics_project_day_idx").on(
      table.projectId,
      table.day,
    ),
  ],
);

export const funnelStepMetrics = pgTable(
  "funnel_step_metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    funnelId: uuid("funnel_id")
      .notNull()
      .references(() => activationFunnels.id, { onDelete: "cascade" }),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    orderIndex: integer("order_index").notNull(),
    eventName: varchar("event_name", { length: 160 }).notNull(),
    usersReached: integer("users_reached").notNull().default(0),
    conversionRateBasisPoints: integer("conversion_rate_basis_points")
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("funnel_step_metrics_unique_period_idx").on(
      table.projectId,
      table.funnelId,
      table.periodStart,
      table.periodEnd,
      table.orderIndex,
    ),
  ],
);

export const companyHealthSnapshots = pgTable(
  "company_health_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    calculatedAt: timestamp("calculated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    score: integer("score").notNull(),
    status: healthStatus("status").notNull(),
    recentActivityPoints: integer("recent_activity_points").notNull(),
    frequencyPoints: integer("frequency_points").notNull(),
    funnelPoints: integer("funnel_points").notNull(),
    keyEventPoints: integer("key_event_points").notNull(),
    reasons: jsonb("reasons").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("company_health_project_calculated_at_idx").on(
      table.projectId,
      table.calculatedAt,
    ),
    uniqueIndex("company_health_company_calculated_at_idx").on(
      table.companyId,
      table.calculatedAt,
    ),
  ],
);
