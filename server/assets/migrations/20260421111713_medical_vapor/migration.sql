ALTER TABLE "form_submissions" DROP CONSTRAINT "form_submissions_pkey" CASCADE;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD PRIMARY KEY ("_index","form","form_version");