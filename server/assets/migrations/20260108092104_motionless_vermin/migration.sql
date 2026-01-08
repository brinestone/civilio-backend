ALTER TABLE "civilio"."choice_groups" ALTER COLUMN "parent_key" SET DATA TYPE uuid USING "parent_key"::uuid;--> statement-breakpoint
ALTER TABLE "civilio"."choice_groups" ALTER COLUMN "key" SET DATA TYPE uuid USING "key"::uuid;--> statement-breakpoint
ALTER TABLE "civilio"."choice_values" ALTER COLUMN "key" SET DATA TYPE uuid USING "key"::uuid;