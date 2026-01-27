ALTER TABLE "civilio"."submission_versions" ADD COLUMN "approved" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "civilio"."submission_versions" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "civilio"."form_submissions" DROP COLUMN "approved";--> statement-breakpoint
ALTER TABLE "civilio"."form_submissions" DROP COLUMN "approved_at";