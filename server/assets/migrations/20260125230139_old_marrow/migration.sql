CREATE TABLE "civilio"."submission_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"submission_index" bigint NOT NULL,
	"form_version" uuid NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "civilio"."form_submissions" RENAME COLUMN "formVersion" TO "form_version";--> statement-breakpoint
ALTER TABLE "civilio"."submission_responses" ADD CONSTRAINT "submission_responses_response_id_submission_versions_id_fkey" FOREIGN KEY ("response_id") REFERENCES "civilio"."submission_versions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."submission_versions" ADD CONSTRAINT "submission_versions_nuwPqoZoVX59_fkey" FOREIGN KEY ("submission_index","form_version") REFERENCES "civilio"."form_submissions"("_index","form_version") ON DELETE CASCADE ON UPDATE CASCADE;