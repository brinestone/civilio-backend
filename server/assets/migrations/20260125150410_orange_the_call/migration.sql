CREATE TABLE "civilio"."form_sections" (
	"key" text,
	"title" text NOT NULL,
	"relevance" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"form_version" uuid,
	CONSTRAINT "form_sections_pkey" PRIMARY KEY("key","form_version")
);
--> statement-breakpoint
CREATE INDEX "form_sections_title_index" ON "civilio"."form_sections" ("title");--> statement-breakpoint
CREATE INDEX "form_sections_key_index" ON "civilio"."form_sections" ("key");--> statement-breakpoint
ALTER TABLE "civilio"."form_sections" ADD CONSTRAINT "form_sections_form_version_form_versions_id_fkey" FOREIGN KEY ("form_version") REFERENCES "civilio"."form_versions"("id");