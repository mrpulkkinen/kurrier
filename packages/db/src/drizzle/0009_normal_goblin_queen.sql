ALTER TABLE "providers" ADD COLUMN "dns_records" jsonb DEFAULT 'null'::jsonb;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "meta" jsonb DEFAULT 'null'::jsonb;