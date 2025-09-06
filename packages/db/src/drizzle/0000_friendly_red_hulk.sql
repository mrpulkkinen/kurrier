CREATE TYPE "public"."provider_kind" AS ENUM('smtp', 'ses', 'mailgun', 'postmark', 'sendgrid');--> statement-breakpoint
CREATE TABLE "emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_secrets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"secret_id" uuid NOT NULL,
	"key_name" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_secrets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid DEFAULT auth.uid() NOT NULL,
	"type" "provider_kind" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "providers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "provider_secrets" ADD CONSTRAINT "provider_secrets_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_secrets" ADD CONSTRAINT "provider_secrets_secret_id_secrets_meta_id_fk" FOREIGN KEY ("secret_id") REFERENCES "public"."secrets_meta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "secrets_meta" ADD CONSTRAINT "secrets_meta_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "provsec_select_own" ON "provider_secrets" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        exists (
          select 1
          from "providers" p
          where p.id = "provider_secrets"."provider_id"
            and p.owner_id = (select auth.uid())
        )
      );--> statement-breakpoint
CREATE POLICY "provsec_insert_own" ON "provider_secrets" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
        exists (
          select 1
          from "providers" p
          where p.id = "provider_secrets"."provider_id"
            and p.owner_id = (select auth.uid())
        )
        and exists (
          select 1
          from "secrets_meta" s
          where s.id = "provider_secrets"."secret_id"
            and s.owner_id = (select auth.uid())
        )
      );--> statement-breakpoint
CREATE POLICY "provsec_update_own" ON "provider_secrets" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
        exists (
          select 1
          from "providers" p
          where p.id = "provider_secrets"."provider_id"
            and p.owner_id = (select auth.uid())
        )
      ) WITH CHECK (
        exists (
          select 1
          from "providers" p
          where p.id = "provider_secrets"."provider_id"
            and p.owner_id = (select auth.uid())
        )
        and exists (
          select 1
          from "secrets_meta" s
          where s.id = "provider_secrets"."secret_id"
            and s.owner_id = (select auth.uid())
        )
      );--> statement-breakpoint
CREATE POLICY "provsec_delete_own" ON "provider_secrets" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
        exists (
          select 1
          from "providers" p
          where p.id = "provider_secrets"."provider_id"
            and p.owner_id = (select auth.uid())
        )
      );--> statement-breakpoint
CREATE POLICY "providers_select_own" ON "providers" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("providers"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "providers_insert_own" ON "providers" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("providers"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "providers_update_own" ON "providers" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("providers"."owner_id" = (select auth.uid())) WITH CHECK ("providers"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "providers_delete_own" ON "providers" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("providers"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "select_own" ON "secrets_meta" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("secrets_meta"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "insert_own" ON "secrets_meta" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("secrets_meta"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "update_own" ON "secrets_meta" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("secrets_meta"."owner_id" = (select auth.uid())) WITH CHECK ("secrets_meta"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "delete_own" ON "secrets_meta" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("secrets_meta"."owner_id" = (select auth.uid()));