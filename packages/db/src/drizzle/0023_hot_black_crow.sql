CREATE TYPE "public"."message_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "priority" SET DEFAULT null::"public"."message_priority";--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "priority" SET DATA TYPE "public"."message_priority" USING "priority"::"public"."message_priority";--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "html" DROP DEFAULT;