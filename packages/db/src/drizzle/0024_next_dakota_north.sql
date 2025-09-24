DROP INDEX "uniq_thread_mailbox_root";--> statement-breakpoint
DROP INDEX "idx_threads_mailbox_lastdate";--> statement-breakpoint
ALTER TABLE "threads" ALTER COLUMN "message_count" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "thread_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_threads_mailbox_lastdate" ON "threads" USING btree ("mailbox_id","last_message_date","id");--> statement-breakpoint
ALTER TABLE "threads" DROP COLUMN "root_message_id";--> statement-breakpoint
ALTER TABLE "threads" DROP COLUMN "subject_normalized";--> statement-breakpoint
ALTER TABLE "threads" DROP COLUMN "participants";--> statement-breakpoint
ALTER TABLE "threads" DROP COLUMN "unread_count";--> statement-breakpoint
ALTER TABLE "threads" DROP COLUMN "last_snippet";--> statement-breakpoint
CREATE POLICY "threads_select_own" ON "threads" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("threads"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "threads_insert_own" ON "threads" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("threads"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "threads_update_own" ON "threads" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("threads"."owner_id" = (select auth.uid())) WITH CHECK ("threads"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "threads_delete_own" ON "threads" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("threads"."owner_id" = (select auth.uid()));
