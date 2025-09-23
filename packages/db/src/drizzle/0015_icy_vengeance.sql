CREATE TYPE "public"."mailbox_kind" AS ENUM('inbox', 'sent', 'drafts', 'archive', 'spam', 'trash', 'outbox', 'custom');--> statement-breakpoint
CREATE TYPE "public"."message_state" AS ENUM('normal', 'bounced', 'queued', 'failed');--> statement-breakpoint
CREATE TABLE "mailboxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid DEFAULT auth.uid() NOT NULL,
	"identity_id" uuid NOT NULL,
	"public_id" text DEFAULT left(md5(gen_random_uuid()::text), 12) NOT NULL,
	"kind" "mailbox_kind" DEFAULT 'inbox' NOT NULL,
	"name" text,
	"slug" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mailboxes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid DEFAULT auth.uid() NOT NULL,
	"mailbox_id" uuid NOT NULL,
	"public_id" text DEFAULT left(md5(gen_random_uuid()::text), 12) NOT NULL,
	"provider" text,
	"provider_message_id" text,
	"imap_uid" integer,
	"imap_uidvalidity" integer,
	"subject" text,
	"snippet" text,
	"from_name" text,
	"from_email" text,
	"to" jsonb DEFAULT '[]'::jsonb,
	"cc" jsonb DEFAULT '[]'::jsonb,
	"bcc" jsonb DEFAULT '[]'::jsonb,
	"date" timestamp with time zone,
	"size_bytes" integer,
	"seen" boolean DEFAULT false NOT NULL,
	"answered" boolean DEFAULT false NOT NULL,
	"flagged" boolean DEFAULT false NOT NULL,
	"draft" boolean DEFAULT false NOT NULL,
	"has_attachments" boolean DEFAULT false NOT NULL,
	"state" "message_state" DEFAULT 'normal' NOT NULL,
	"headers_json" jsonb DEFAULT 'null'::jsonb,
	"raw_storage_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "mailboxes" ADD CONSTRAINT "mailboxes_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mailboxes" ADD CONSTRAINT "mailboxes_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."identities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_mailbox_id_mailboxes_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_mailbox_public_id" ON "mailboxes" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_default_mailbox_per_kind" ON "mailboxes" USING btree ("identity_id","kind") WHERE "mailboxes"."is_default" IS TRUE;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_mailbox_slug_per_identity" ON "mailboxes" USING btree ("identity_id","slug") WHERE "mailboxes"."slug" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_message_public_id" ON "messages" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "idx_messages_mailbox_date" ON "messages" USING btree ("mailbox_id","date");--> statement-breakpoint
CREATE INDEX "idx_messages_mailbox_seen_date" ON "messages" USING btree ("mailbox_id","seen","date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_messages_provider_id" ON "messages" USING btree ("provider","provider_message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_messages_imap_uid" ON "messages" USING btree ("mailbox_id","imap_uid","imap_uidvalidity");--> statement-breakpoint
CREATE POLICY "mailboxes_select_own" ON "mailboxes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("mailboxes"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "mailboxes_insert_own" ON "mailboxes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("mailboxes"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "mailboxes_update_own" ON "mailboxes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("mailboxes"."owner_id" = (select auth.uid())) WITH CHECK ("mailboxes"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "mailboxes_delete_own" ON "mailboxes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("mailboxes"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "messages_select_own" ON "messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("messages"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "messages_insert_own" ON "messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("messages"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "messages_update_own" ON "messages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("messages"."owner_id" = (select auth.uid())) WITH CHECK ("messages"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "messages_delete_own" ON "messages" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("messages"."owner_id" = (select auth.uid()));