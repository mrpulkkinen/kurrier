CREATE TABLE "emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "secrets_meta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid DEFAULT auth.uid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"vault_secret" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "secrets_meta" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "secrets_meta" ADD CONSTRAINT "secrets_meta_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "select_own" ON "secrets_meta" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("secrets_meta"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "insert_own" ON "secrets_meta" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("secrets_meta"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "update_own" ON "secrets_meta" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("secrets_meta"."owner_id" = (select auth.uid())) WITH CHECK ("secrets_meta"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "delete_own" ON "secrets_meta" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("secrets_meta"."owner_id" = (select auth.uid()));