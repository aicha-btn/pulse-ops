CREATE TABLE "ingestion_rate_limits" (
	"api_key_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ingestion_rate_limits_api_key_id_window_start_pk" PRIMARY KEY("api_key_id","window_start")
);
--> statement-breakpoint
ALTER TABLE "ingestion_rate_limits" ADD CONSTRAINT "ingestion_rate_limits_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_rate_limits" ADD CONSTRAINT "ingestion_rate_limits_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ingestion_rate_limits_project_window_idx" ON "ingestion_rate_limits" USING btree ("project_id","window_start");