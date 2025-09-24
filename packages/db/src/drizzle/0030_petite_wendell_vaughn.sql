CREATE TABLE "message_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid DEFAULT auth.uid() NOT NULL,
	"message_id" uuid NOT NULL,
	"bucket_id" text DEFAULT 'attachments' NOT NULL,
	"path" text NOT NULL,
	"filename_original" text,
	"content_type" text,
	"size_bytes" integer,
	"cid" text,
	"is_inline" boolean DEFAULT false NOT NULL,
	"checksum" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message_attachments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_msg_attachments_message" ON "message_attachments" USING btree ("message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_bucket_path" ON "message_attachments" USING btree ("bucket_id","path");--> statement-breakpoint
CREATE INDEX "idx_msg_attachments_cid" ON "message_attachments" USING btree ("cid");--> statement-breakpoint
CREATE POLICY "message_attachments_select_own" ON "message_attachments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("message_attachments"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "message_attachments_insert_own" ON "message_attachments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("message_attachments"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "message_attachments_update_own" ON "message_attachments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("message_attachments"."owner_id" = (select auth.uid())) WITH CHECK ("message_attachments"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "message_attachments_delete_own" ON "message_attachments" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("message_attachments"."owner_id" = (select auth.uid()));