ALTER TABLE "form_version_items" ADD COLUMN "path" text NOT NULL;--> statement-breakpoint
ALTER TABLE "form_items" DROP COLUMN "position";