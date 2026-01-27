ALTER TABLE "civilio"."choice_groups" DROP CONSTRAINT "choice_groups_2W1EHM6Z0twd_fkey";--> statement-breakpoint
ALTER TABLE "civilio"."choice_items" ADD COLUMN "parentValue" text;--> statement-breakpoint
ALTER TABLE "civilio"."choice_groups" DROP COLUMN "parent_value";