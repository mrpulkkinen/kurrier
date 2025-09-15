ALTER TABLE "identities" ADD COLUMN "value" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_identity_per_user" ON "identities" USING btree ("owner_id","kind","value");