DROP INDEX "uniq_identity_per_user";--> statement-breakpoint
ALTER TABLE "identities" DROP COLUMN "value";--> statement-breakpoint
ALTER TABLE "identities" DROP COLUMN "display_name";