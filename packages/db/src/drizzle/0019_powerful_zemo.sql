DROP INDEX "idx_messages_provider_id";--> statement-breakpoint
DROP INDEX "idx_messages_imap_uid";--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "text" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "text_as_html" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "html" text;--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "provider";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "provider_message_id";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "imap_uid";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "imap_uidvalidity";