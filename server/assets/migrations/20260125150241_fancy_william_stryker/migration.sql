CREATE TABLE "civilio"."form_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"label" text NOT NULL,
	"form" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"parentId" uuid,
	"is_current" boolean DEFAULT true
);
--> statement-breakpoint
ALTER TABLE "civilio"."form_versions" ADD CONSTRAINT "form_versions_form_form_definitions_slug_fkey" FOREIGN KEY ("form") REFERENCES "civilio"."form_definitions"("slug") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."form_versions" ADD CONSTRAINT "form_versions_parentId_form_versions_id_fkey" FOREIGN KEY ("parentId") REFERENCES "civilio"."form_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;