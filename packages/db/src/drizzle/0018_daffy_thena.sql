ALTER TABLE "identities" ALTER COLUMN "public_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "mailboxes" ALTER COLUMN "public_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "public_id" DROP DEFAULT;