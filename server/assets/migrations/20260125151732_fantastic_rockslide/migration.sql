CREATE TABLE "civilio"."submission_responses" (
	"submission_index" bigint,
	"field_id" uuid,
	"form_version" uuid,
	"response_id" uuid,
	"value" text,
	CONSTRAINT "submission_responses_pkey" PRIMARY KEY("submission_index","field_id","form_version","response_id")
);
--> statement-breakpoint
ALTER TABLE "civilio"."submission_responses" ADD CONSTRAINT "submission_responses_vd2G4NRpHCeZ_fkey" FOREIGN KEY ("submission_index","form_version") REFERENCES "civilio"."form_submissions"("_index","formVersion") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."submission_responses" ADD CONSTRAINT "submission_responses_0Dw9Lpo5NsIy_fkey" FOREIGN KEY ("field_id","form_version") REFERENCES "civilio"."form_fields"("field_id","form_version") ON DELETE CASCADE ON UPDATE CASCADE;