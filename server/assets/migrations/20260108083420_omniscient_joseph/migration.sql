CREATE TABLE "civilio"."choices2" (
	"title" text NOT NULL,
	"form" text,
	"parent_key" text,
	"parent_value" text,
	"description" text,
	"key" text,
	CONSTRAINT "choices2_pkey" PRIMARY KEY("form","key")
);
--> statement-breakpoint
CREATE TABLE "civilio"."choice_values" (
	"fallbackLabel" text NOT NULL,
	"value" text,
	"i18n_key" text,
	"form" text,
	"key" text,
	CONSTRAINT "choice_values_pkey" PRIMARY KEY("key","form","value")
);
--> statement-breakpoint
ALTER TABLE "civilio"."choices" DROP COLUMN "title";--> statement-breakpoint
CREATE INDEX "choices2_parent_key_parent_value_index" ON "civilio"."choices2" ("parent_key","parent_value");--> statement-breakpoint
CREATE INDEX "choices2_key_index" ON "civilio"."choices2" ("key");--> statement-breakpoint
ALTER TABLE "civilio"."choice_values" ADD CONSTRAINT "choice_values_key_form_choices2_key_form_fkey" FOREIGN KEY ("key","form") REFERENCES "civilio"."choices2"("key","form") ON DELETE CASCADE ON UPDATE CASCADE;