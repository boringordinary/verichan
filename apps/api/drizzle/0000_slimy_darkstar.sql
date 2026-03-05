CREATE TYPE "public"."document_type" AS ENUM('passport', 'drivers_license', 'national_id', 'residence_permit', 'other');--> statement-breakpoint
CREATE TYPE "public"."review_decision" AS ENUM('approved', 'rejected', 'needs_resubmission');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('identity_verification', 'age_verification');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('created', 'in_progress', 'submitted', 'processing', 'in_review', 'approved', 'rejected', 'needs_resubmission', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."step_status" AS ENUM('pending', 'submitted', 'processing', 'approved', 'rejected', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."step_type" AS ENUM('document', 'selfie', 'liveness');--> statement-breakpoint
CREATE TYPE "public"."verification_tier" AS ENUM('document', 'estimation');--> statement-breakpoint
CREATE TYPE "public"."webhook_delivery_status" AS ENUM('pending', 'delivered', 'failed', 'retrying');--> statement-breakpoint
CREATE TABLE "session_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"from_status" "session_status",
	"to_status" "session_status" NOT NULL,
	"changed_by" text,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_delivery" (
	"id" text PRIMARY KEY NOT NULL,
	"webhook_endpoint_id" text NOT NULL,
	"session_id" text NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"status" "webhook_delivery_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb,
	"response_status_code" integer,
	"response_body" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"next_retry_at" timestamp,
	"last_attempt_at" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"key_prefix" varchar(20) NOT NULL,
	"key_hash" text NOT NULL,
	"label" varchar(255),
	"environment" varchar(10) DEFAULT 'live' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoint" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"url" text NOT NULL,
	"secret_hash" text NOT NULL,
	"events" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" text PRIMARY KEY NOT NULL,
	"step_id" text NOT NULL,
	"document_type" "document_type" NOT NULL,
	"side" varchar(10),
	"file_key" text NOT NULL,
	"file_bucket" varchar(255) NOT NULL,
	"file_mime_type" varchar(100),
	"file_size_bytes" integer,
	"extracted_data" jsonb,
	"purged_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "selfie" (
	"id" text PRIMARY KEY NOT NULL,
	"step_id" text NOT NULL,
	"file_key" text NOT NULL,
	"file_bucket" varchar(255) NOT NULL,
	"file_mime_type" varchar(100),
	"file_size_bytes" integer,
	"capture_method" varchar(50),
	"similarity_score" numeric(5, 2),
	"liveness_score" numeric(5, 2),
	"liveness_session_id" varchar(255),
	"purged_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"reviewer_id" text,
	"decision" "review_decision",
	"decision_reason" text,
	"assigned_at" timestamp,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_note" (
	"id" text PRIMARY KEY NOT NULL,
	"review_id" text NOT NULL,
	"step_id" text,
	"author_id" text,
	"content" text NOT NULL,
	"is_client_visible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_session" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"external_user_id" varchar(255),
	"service" "service_type" NOT NULL,
	"tier" "verification_tier" NOT NULL,
	"status" "session_status" DEFAULT 'created' NOT NULL,
	"token" text NOT NULL,
	"redirect_url" text,
	"webhook_url" text,
	"metadata" jsonb,
	"result_data" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"expires_at" timestamp NOT NULL,
	"submitted_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_step" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"type" "step_type" NOT NULL,
	"status" "step_status" DEFAULT 'pending' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"config" jsonb,
	"result_data" jsonb,
	"provider_response" jsonb,
	"error_code" varchar(50),
	"error_message" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session_status_history" ADD CONSTRAINT "session_status_history_session_id_verification_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."verification_session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_webhook_endpoint_id_webhook_endpoint_id_fk" FOREIGN KEY ("webhook_endpoint_id") REFERENCES "public"."webhook_endpoint"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_session_id_verification_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."verification_session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD CONSTRAINT "webhook_endpoint_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_step_id_verification_step_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."verification_step"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "selfie" ADD CONSTRAINT "selfie_step_id_verification_step_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."verification_step"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_session_id_verification_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."verification_session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_note" ADD CONSTRAINT "review_note_review_id_review_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."review"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_note" ADD CONSTRAINT "review_note_step_id_verification_step_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."verification_step"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_note" ADD CONSTRAINT "review_note_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_session" ADD CONSTRAINT "verification_session_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_step" ADD CONSTRAINT "verification_step_session_id_verification_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."verification_session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_status_history_session_id_idx" ON "session_status_history" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_status_history_session_created_idx" ON "session_status_history" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "webhook_delivery_endpoint_id_idx" ON "webhook_delivery" USING btree ("webhook_endpoint_id");--> statement-breakpoint
CREATE INDEX "webhook_delivery_session_id_idx" ON "webhook_delivery" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "webhook_delivery_status_retry_idx" ON "webhook_delivery" USING btree ("status","next_retry_at");--> statement-breakpoint
CREATE INDEX "api_key_organization_id_idx" ON "api_key" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "api_key_key_hash_idx" ON "api_key" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "webhook_endpoint_organization_id_idx" ON "webhook_endpoint" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "document_step_id_idx" ON "document" USING btree ("step_id");--> statement-breakpoint
CREATE INDEX "selfie_step_id_idx" ON "selfie" USING btree ("step_id");--> statement-breakpoint
CREATE INDEX "review_session_id_idx" ON "review" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "review_reviewer_id_idx" ON "review" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "review_decision_assigned_at_idx" ON "review" USING btree ("decision","assigned_at");--> statement-breakpoint
CREATE INDEX "review_note_review_id_idx" ON "review_note" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "verification_session_organization_id_idx" ON "verification_session" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "verification_session_status_idx" ON "verification_session" USING btree ("status");--> statement-breakpoint
CREATE INDEX "verification_session_org_ext_user_idx" ON "verification_session" USING btree ("organization_id","external_user_id");--> statement-breakpoint
CREATE INDEX "verification_session_created_at_idx" ON "verification_session" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_session_token_idx" ON "verification_session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "verification_step_session_id_idx" ON "verification_step" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "verification_step_session_type_idx" ON "verification_step" USING btree ("session_id","type");