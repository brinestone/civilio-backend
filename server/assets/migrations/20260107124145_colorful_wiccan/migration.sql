ALTER TABLE "civilio"."choices" RENAME COLUMN "parent" TO "parent_value";--> statement-breakpoint
ALTER TABLE "civilio"."choices" ADD COLUMN "parent_key" text;