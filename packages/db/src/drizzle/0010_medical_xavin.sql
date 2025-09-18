ALTER TABLE "identities" ADD COLUMN "dns_records" jsonb DEFAULT 'null'::jsonb;--> statement-breakpoint
ALTER TABLE "identities" ADD COLUMN "meta" jsonb DEFAULT 'null'::jsonb;--> statement-breakpoint
ALTER TABLE "providers" DROP COLUMN "dns_records";--> statement-breakpoint
ALTER TABLE "providers" DROP COLUMN "meta";