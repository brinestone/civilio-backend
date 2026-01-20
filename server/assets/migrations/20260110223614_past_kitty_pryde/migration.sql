CREATE TYPE "revisions"."change_op" AS ENUM('INSERT', 'DELETE', 'UPDATE', 'REVERT');--> statement-breakpoint
CREATE TYPE "revisions"."sync_status" AS ENUM('pending', 'synced', 'failed');--> statement-breakpoint
CREATE SEQUENCE "civilio"."chefferie_index_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 324 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."chefferie_personnel_index_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 186 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."csc_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 475016321 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."csc_index_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 445 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."csc_personnel_index_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 774 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."csc_pieces_index_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 543 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."csc_statistics_index_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1463 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."csc_villages_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 2344 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."fosa_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 484119070 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."fosa_index_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 971 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."fosa_personnel_index_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1261 CACHE 1;--> statement-breakpoint
CREATE TABLE "revisions"."ledger" (
	"hash" text NOT NULL,
	"form" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"submission_index" integer NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "civilio"."choice_groups" (
	"title" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"parent_id" uuid,
	"parent_value" text,
	"description" text,
	"key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "civilio"."choice_items" (
	"id" uuid DEFAULT gen_random_uuid(),
	"label" text NOT NULL,
	"value" text NOT NULL,
	"i18n_key" text,
	"group_id" uuid,
	"ordinal" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "choice_items_pkey" PRIMARY KEY("group_id","id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "civilio"."choices" (
	"name" text,
	"label" text NOT NULL,
	"parent_value" text,
	"parent_key" text,
	"group" text,
	"i18n_key" text,
	"version" text,
	"description" text,
	CONSTRAINT "choices_pkey" PRIMARY KEY("name","group","version")
);
--> statement-breakpoint
CREATE TABLE "revisions"."deltas" (
	"hash" text,
	"submission_index" integer,
	"index" integer,
	"form" text,
	"table_name" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delta_data" jsonb NOT NULL,
	"changed_by" text,
	"op" "revisions"."change_op" NOT NULL,
	"parent" text,
	"sync_status" "revisions"."sync_status" DEFAULT 'pending'::"revisions"."sync_status",
	CONSTRAINT "deltas_pkey" PRIMARY KEY("hash","submission_index","index","form","table_name")
);
--> statement-breakpoint
CREATE TABLE "civilio"."form_field_mappings" (
	"field" text,
	"i18n_key" text,
	"db_column" text NOT NULL,
	"db_table" text NOT NULL,
	"form" text,
	"db_column_type" text NOT NULL,
	"alias_hash" text GENERATED ALWAYS AS (md5
				("civilio"."form_field_mappings"."field")) STORED,
	CONSTRAINT "field_db_column_db_table_form_pk" PRIMARY KEY("field","form")
);
--> statement-breakpoint
CREATE TABLE "civilio"."form_definitions" (
	"name" text PRIMARY KEY,
	"icon" text,
	"label" text NOT NULL,
	"description" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "civilio"."form_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"form_name" text NOT NULL,
	"readonly" boolean DEFAULT false,
	"title" text NOT NULL,
	"t_translated" text,
	"description" text,
	"d_translated" text,
	"section_key" text NOT NULL,
	"span" integer DEFAULT 12,
	"relevance" jsonb
);
--> statement-breakpoint
CREATE TABLE "civilio"."form_sections" (
	"key" text,
	"form" text,
	"title" text NOT NULL,
	"relevance" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "form_sections_pkey" PRIMARY KEY("key","form")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_hash_form_submission_index_index" ON "revisions"."ledger" ("hash","form","submission_index");--> statement-breakpoint
CREATE UNIQUE INDEX "choice_groups_key_index" ON "civilio"."choice_groups" ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "choice_items_id_index" ON "civilio"."choice_items" ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "choice_items_group_id_value_index" ON "civilio"."choice_items" ("group_id","value");--> statement-breakpoint
CREATE INDEX "deltas_hash_index" ON "revisions"."deltas" ("hash");--> statement-breakpoint
CREATE INDEX "deltas_submission_index_index" ON "revisions"."deltas" ("submission_index");--> statement-breakpoint
CREATE INDEX "deltas_index_index" ON "revisions"."deltas" ("index");--> statement-breakpoint
CREATE INDEX "deltas_form_index" ON "revisions"."deltas" ("form");--> statement-breakpoint
CREATE INDEX "deltas_changed_at_index" ON "revisions"."deltas" ("changed_at");--> statement-breakpoint
CREATE INDEX "deltas_parent_index" ON "revisions"."deltas" ("parent") WHERE ("parent" is not null);--> statement-breakpoint
CREATE INDEX "deltas_parent_hash_index" ON "revisions"."deltas" ("parent","hash");--> statement-breakpoint
CREATE INDEX "deltas_submission_index_form_changed_at_index" ON "revisions"."deltas" ("submission_index","form","changed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "form_definitions_name_index" ON "civilio"."form_definitions" ("name");--> statement-breakpoint
CREATE INDEX "form_definitions_label_index" ON "civilio"."form_definitions" ("label");--> statement-breakpoint
CREATE INDEX "form_definitions_description_index" ON "civilio"."form_definitions" ("description") WHERE ("description" is not null);--> statement-breakpoint
CREATE INDEX "form_fields_form_name_index" ON "civilio"."form_fields" ("form_name");--> statement-breakpoint
CREATE INDEX "form_fields_title_index" ON "civilio"."form_fields" ("title");--> statement-breakpoint
CREATE INDEX "form_fields_description_index" ON "civilio"."form_fields" ("description") WHERE ("description" is not null);--> statement-breakpoint
CREATE INDEX "form_fields_t_translated_index" ON "civilio"."form_fields" ("t_translated") WHERE ("description" is not null);--> statement-breakpoint
CREATE INDEX "form_fields_d_translated_index" ON "civilio"."form_fields" ("d_translated") WHERE ("description" is not null);--> statement-breakpoint
CREATE INDEX "form_fields_section_key_index" ON "civilio"."form_fields" ("section_key");--> statement-breakpoint
CREATE INDEX "form_sections_title_index" ON "civilio"."form_sections" ("title");--> statement-breakpoint
CREATE INDEX "form_sections_key_index" ON "civilio"."form_sections" ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "form_sections_key_form_index" ON "civilio"."form_sections" ("key","form");--> statement-breakpoint
ALTER TABLE "civilio"."choice_groups" ADD CONSTRAINT "choice_groups_parent_id_choice_groups_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "civilio"."choice_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."choice_groups" ADD CONSTRAINT "choice_groups_2W1EHM6Z0twd_fkey" FOREIGN KEY ("parent_id","parent_value") REFERENCES "civilio"."choice_items"("group_id","value");--> statement-breakpoint
ALTER TABLE "civilio"."choice_items" ADD CONSTRAINT "choice_items_group_id_choice_groups_id_fkey" FOREIGN KEY ("group_id") REFERENCES "civilio"."choice_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."form_fields" ADD CONSTRAINT "form_fields_form_name_form_definitions_name_fkey" FOREIGN KEY ("form_name") REFERENCES "civilio"."form_definitions"("name") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."form_fields" ADD CONSTRAINT "form_fields_section_key_form_name_form_sections_key_form_fkey" FOREIGN KEY ("section_key","form_name") REFERENCES "civilio"."form_sections"("key","form") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."form_sections" ADD CONSTRAINT "form_sections_form_form_definitions_name_fkey" FOREIGN KEY ("form") REFERENCES "civilio"."form_definitions"("name") ON DELETE CASCADE ON UPDATE CASCADE;