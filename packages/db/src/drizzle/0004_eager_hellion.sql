CREATE TYPE "public"."identity_kind" AS ENUM('domain', 'email');--> statement-breakpoint
CREATE TYPE "public"."identity_status" AS ENUM('unverified', 'pending', 'verified', 'failed');--> statement-breakpoint
CREATE TABLE "identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid DEFAULT auth.uid() NOT NULL,
	"kind" "identity_kind" NOT NULL,
	"value" text NOT NULL,
	"display_name" text,
	"provider_type" "provider_kind" NOT NULL,
	"provider_id" uuid,
	"smtp_account_id" uuid,
	"status" "identity_status" DEFAULT 'unverified' NOT NULL,
	"last_verified_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "identities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "emails" CASCADE;--> statement-breakpoint
ALTER TABLE "identities" ADD CONSTRAINT "identities_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identities" ADD CONSTRAINT "identities_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identities" ADD CONSTRAINT "identities_smtp_account_id_smtp_accounts_id_fk" FOREIGN KEY ("smtp_account_id") REFERENCES "public"."smtp_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_identity_per_user" ON "identities" USING btree ("owner_id","kind","value");--> statement-breakpoint
CREATE POLICY "identities_select_own" ON "identities" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("identities"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "identities_insert_own" ON "identities" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("identities"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "identities_update_own" ON "identities" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("identities"."owner_id" = (select auth.uid())) WITH CHECK ("identities"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "identities_delete_own" ON "identities" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("identities"."owner_id" = (select auth.uid()));