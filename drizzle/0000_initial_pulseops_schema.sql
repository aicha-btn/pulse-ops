CREATE TYPE "public"."aggregation_run_status" AS ENUM('running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."api_key_status" AS ENUM('active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."health_status" AS ENUM('healthy', 'watch', 'at_risk', 'silent');--> statement-breakpoint
CREATE TYPE "public"."ingestion_error_status" AS ENUM('rejected', 'stored', 'ignored');--> statement-breakpoint
CREATE TYPE "public"."workspace_member_role" AS ENUM('owner', 'admin', 'viewer');--> statement-breakpoint
CREATE TABLE "activation_funnel_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"funnel_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"event_name" varchar(160) NOT NULL,
	"label" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activation_funnels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(120) DEFAULT 'Activation' NOT NULL,
	"activation_window_days" integer DEFAULT 14 NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aggregation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"kind" varchar(80) NOT NULL,
	"status" "aggregation_run_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"key_prefix" varchar(16) NOT NULL,
	"key_hash" text NOT NULL,
	"last_four" varchar(4) NOT NULL,
	"status" "api_key_status" DEFAULT 'active' NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"external_id" varchar(160) NOT NULL,
	"name" varchar(160),
	"traits" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"first_seen_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_health_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"score" integer NOT NULL,
	"status" "health_status" NOT NULL,
	"recent_activity_points" integer NOT NULL,
	"frequency_points" integer NOT NULL,
	"funnel_points" integer NOT NULL,
	"key_event_points" integer NOT NULL,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_project_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"day" date NOT NULL,
	"events_count" integer DEFAULT 0 NOT NULL,
	"active_users_count" integer DEFAULT 0 NOT NULL,
	"active_companies_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"company_id" uuid,
	"user_id" uuid,
	"event_id" varchar(160) NOT NULL,
	"name" varchar(160) NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funnel_step_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"funnel_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"order_index" integer NOT NULL,
	"event_name" varchar(160) NOT NULL,
	"users_reached" integer DEFAULT 0 NOT NULL,
	"conversion_rate_basis_points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"api_key_id" uuid,
	"status" "ingestion_error_status" NOT NULL,
	"code" varchar(80) NOT NULL,
	"message" text NOT NULL,
	"payload_preview" jsonb,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"inactivity_threshold_days" integer DEFAULT 14 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracked_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"company_id" uuid,
	"external_id" varchar(160) NOT NULL,
	"email" varchar(254),
	"name" varchar(160),
	"traits" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"first_seen_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" uuid NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"role" "workspace_member_role" DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_workspace_id_auth_user_id_pk" PRIMARY KEY("workspace_id","auth_user_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "activation_funnel_steps" ADD CONSTRAINT "activation_funnel_steps_funnel_id_activation_funnels_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."activation_funnels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activation_funnels" ADD CONSTRAINT "activation_funnels_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aggregation_runs" ADD CONSTRAINT "aggregation_runs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_health_snapshots" ADD CONSTRAINT "company_health_snapshots_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_health_snapshots" ADD CONSTRAINT "company_health_snapshots_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_project_metrics" ADD CONSTRAINT "daily_project_metrics_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_tracked_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tracked_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funnel_step_metrics" ADD CONSTRAINT "funnel_step_metrics_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funnel_step_metrics" ADD CONSTRAINT "funnel_step_metrics_funnel_id_activation_funnels_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."activation_funnels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_errors" ADD CONSTRAINT "ingestion_errors_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_errors" ADD CONSTRAINT "ingestion_errors_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracked_users" ADD CONSTRAINT "tracked_users_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracked_users" ADD CONSTRAINT "tracked_users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activation_funnel_steps_funnel_id_idx" ON "activation_funnel_steps" USING btree ("funnel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "activation_funnel_steps_order_idx" ON "activation_funnel_steps" USING btree ("funnel_id","order_index");--> statement-breakpoint
CREATE INDEX "activation_funnels_project_id_idx" ON "activation_funnels" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "activation_funnels_project_id_unique_idx" ON "activation_funnels" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "aggregation_runs_project_started_at_idx" ON "aggregation_runs" USING btree ("project_id","started_at");--> statement-breakpoint
CREATE INDEX "api_keys_project_id_idx" ON "api_keys" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_key_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "companies_project_id_idx" ON "companies" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "companies_project_external_id_idx" ON "companies" USING btree ("project_id","external_id");--> statement-breakpoint
CREATE INDEX "company_health_project_calculated_at_idx" ON "company_health_snapshots" USING btree ("project_id","calculated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "company_health_company_calculated_at_idx" ON "company_health_snapshots" USING btree ("company_id","calculated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_project_metrics_project_day_idx" ON "daily_project_metrics" USING btree ("project_id","day");--> statement-breakpoint
CREATE INDEX "events_project_occurred_at_idx" ON "events" USING btree ("project_id","occurred_at");--> statement-breakpoint
CREATE INDEX "events_project_name_idx" ON "events" USING btree ("project_id","name");--> statement-breakpoint
CREATE INDEX "events_company_id_idx" ON "events" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "events_project_event_id_idx" ON "events" USING btree ("project_id","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "funnel_step_metrics_unique_period_idx" ON "funnel_step_metrics" USING btree ("project_id","funnel_id","period_start","period_end","order_index");--> statement-breakpoint
CREATE INDEX "ingestion_errors_project_received_at_idx" ON "ingestion_errors" USING btree ("project_id","received_at");--> statement-breakpoint
CREATE INDEX "projects_workspace_id_idx" ON "projects" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_workspace_slug_idx" ON "projects" USING btree ("workspace_id","slug");--> statement-breakpoint
CREATE INDEX "tracked_users_project_id_idx" ON "tracked_users" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tracked_users_company_id_idx" ON "tracked_users" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "tracked_users_email_idx" ON "tracked_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "tracked_users_project_external_id_idx" ON "tracked_users" USING btree ("project_id","external_id");--> statement-breakpoint
CREATE INDEX "workspace_members_auth_user_id_idx" ON "workspace_members" USING btree ("auth_user_id");