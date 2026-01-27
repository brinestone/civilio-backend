ALTER TABLE "civilio"."submission_versions" DROP CONSTRAINT "submission_versions_nuwPqoZoVX59_fkey";--> statement-breakpoint
ALTER TABLE "civilio"."form_submissions" DROP CONSTRAINT "form_submissions_pkey";--> statement-breakpoint
ALTER TABLE "civilio"."form_submissions" ADD PRIMARY KEY ("_index");--> statement-breakpoint
CREATE INDEX "submission_responses_sub_idx" ON "civilio"."submission_responses" ("submission_index","form_version");--> statement-breakpoint
CREATE INDEX "submission_responses_field_idx" ON "civilio"."submission_responses" ("field_id","form_version");--> statement-breakpoint
CREATE INDEX "submission_responses_version_idx" ON "civilio"."submission_responses" ("response_id");--> statement-breakpoint
CREATE INDEX "submission_versions_submission_index_index" ON "civilio"."submission_versions" ("submission_index");--> statement-breakpoint
CREATE INDEX "submission_versions_form_version_index" ON "civilio"."submission_versions" ("form_version");--> statement-breakpoint
CREATE INDEX "submission_versions_submission_index_form_version_index" ON "civilio"."submission_versions" ("submission_index","form_version");--> statement-breakpoint
ALTER TABLE "civilio"."submission_responses" ADD CONSTRAINT "submission_responses_WiIggkvkgkZy_fkey" FOREIGN KEY ("submission_index") REFERENCES "civilio"."form_submissions"("_index");--> statement-breakpoint
ALTER TABLE "civilio"."submission_versions" ADD CONSTRAINT "submission_versions_rwRdHs0k7gEL_fkey" FOREIGN KEY ("submission_index") REFERENCES "civilio"."form_submissions"("_index") ON DELETE CASCADE ON UPDATE CASCADE;