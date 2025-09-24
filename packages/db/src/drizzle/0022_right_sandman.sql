ALTER TABLE "messages" ALTER COLUMN "html" SET DEFAULT null;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "priority" text;--> statement-breakpoint
CREATE INDEX "idx_messages_priority" ON "messages" USING btree ("priority");