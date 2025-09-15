ALTER TABLE "providers" ADD COLUMN "verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "smtp_accounts" ADD COLUMN "verified" boolean DEFAULT false;