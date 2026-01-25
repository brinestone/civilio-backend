CREATE TABLE "civilio"."facility_meta_fields" (
	"field_id" uuid,
	"meta_label" text NOT NULL,
	"meta_description" text,
	"form_version" uuid,
	CONSTRAINT "facility_meta_fields_pkey" PRIMARY KEY("field_id","form_version")
);
--> statement-breakpoint
CREATE TABLE "civilio"."form_fields" (
	"field_id" uuid DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"readonly" boolean DEFAULT false,
	"title" text NOT NULL,
	"description" text,
	"section_key" text,
	"span" integer DEFAULT 12,
	"relevance" jsonb,
	"form_version" uuid,
	"field_type" "civilio"."form_field_type" NOT NULL,
	CONSTRAINT "form_fields_pkey" PRIMARY KEY("field_id","form_version")
);
--> statement-breakpoint
CREATE TABLE "civilio"."form_submissions" (
	"_index" bigserial,
	"approved" boolean DEFAULT false,
	"approved_at" timestamp with time zone,
	"validation_code" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"formVersion" uuid,
	CONSTRAINT "form_submissions_pkey" PRIMARY KEY("_index","formVersion")
);
--> statement-breakpoint
CREATE INDEX "form_fields_form_version_index" ON "civilio"."form_fields" ("form_version");--> statement-breakpoint
CREATE INDEX "form_fields_title_index" ON "civilio"."form_fields" ("title");--> statement-breakpoint
CREATE INDEX "form_fields_description_index" ON "civilio"."form_fields" ("description") WHERE ("description" is not null);--> statement-breakpoint
CREATE INDEX "form_fields_section_key_index" ON "civilio"."form_fields" ("section_key") WHERE ("section_key" is not null);--> statement-breakpoint
ALTER TABLE "civilio"."facility_meta_fields" ADD CONSTRAINT "facility_meta_fields_1uHuUXvpWYAe_fkey" FOREIGN KEY ("field_id","form_version") REFERENCES "civilio"."form_fields"("field_id","form_version");--> statement-breakpoint
ALTER TABLE "civilio"."form_fields" ADD CONSTRAINT "form_fields_5qpyZOt7zVho_fkey" FOREIGN KEY ("section_key","form_version") REFERENCES "civilio"."form_sections"("key","form_version") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."form_submissions" ADD CONSTRAINT "form_submissions_formVersion_form_versions_id_fkey" FOREIGN KEY ("formVersion") REFERENCES "civilio"."form_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;