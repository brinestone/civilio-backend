CREATE TABLE "civilio"."form_definitions" (
	"slug" text PRIMARY KEY,
	"logo" text,
	"label" text NOT NULL,
	"description" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "form_definitions_slug_index" ON "civilio"."form_definitions" ("slug");--> statement-breakpoint
CREATE INDEX "form_definitions_label_index" ON "civilio"."form_definitions" ("label");--> statement-breakpoint
CREATE INDEX "form_definitions_description_index" ON "civilio"."form_definitions" ("description") WHERE ("description" is not null);