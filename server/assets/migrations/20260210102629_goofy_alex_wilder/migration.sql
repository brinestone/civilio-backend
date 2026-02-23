ALTER TABLE "dataset_items" ALTER COLUMN "ordinal" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "form_items" ALTER COLUMN "position" SET DATA TYPE text USING "position"::text;