CREATE TYPE "form_item_type" AS ENUM('field', 'note', 'image', 'group', 'list', 'separator');--> statement-breakpoint
CREATE TYPE "dataset_ref_types" AS ENUM('all', 'subset');--> statement-breakpoint
CREATE TABLE "dataset_items" (
	"id" uuid DEFAULT gen_random_uuid(),
	"label" text NOT NULL,
	"value" text NOT NULL,
	"parent_value" text,
	"dataset_id" uuid,
	"ordinal" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dataset_items_pkey" PRIMARY KEY("dataset_id","id")
);
--> statement-breakpoint
CREATE TABLE "dataset_ref_items" (
	"ref" text NOT NULL,
	"dataset_id" uuid NOT NULL,
	"item_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dataset_refs" (
	"slug" varchar(64) PRIMARY KEY,
	"type" "dataset_ref_types" DEFAULT 'all'::"dataset_ref_types" NOT NULL,
	"in_use" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dataset" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "datasets" (
	"title" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"parent_id" uuid,
	"description" text,
	"key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_items" (
	"type" "form_item_type" NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"config" jsonb,
	"tags" jsonb
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"_index" bigserial,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"form_version" uuid NOT NULL,
	"form" text,
	"archived_at" timestamp with time zone,
	CONSTRAINT "form_submissions_pkey" PRIMARY KEY("_index","form")
);
--> statement-breakpoint
CREATE TABLE "form_version_items" (
	"item_id" uuid NOT NULL,
	"parent_id" uuid,
	"form" text NOT NULL,
	"form_version" uuid,
	"path" text NOT NULL,
	"relevance" jsonb,
	"config" jsonb,
	"tags" jsonb,
	"id" uuid DEFAULT gen_random_uuid(),
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "form_version_items_pkey" PRIMARY KEY("form_version","id")
);
--> statement-breakpoint
CREATE TABLE "form_versions" (
	"id" uuid DEFAULT gen_random_uuid(),
	"form" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"parent_id" uuid,
	"is_current" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "form_versions_pkey" PRIMARY KEY("id","form")
);
--> statement-breakpoint
CREATE TABLE "form_definitions" (
	"slug" text PRIMARY KEY,
	"logo" text,
	"label" text NOT NULL,
	"description" text,
	"created_by" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_responses" (
	"submission_index" bigint,
	"field_id" uuid,
	"form_version" uuid,
	"submission_tag" text,
	"form" text NOT NULL,
	"value" text,
	CONSTRAINT "submission_responses_pkey" PRIMARY KEY("submission_index","field_id","form_version","submission_tag")
);
--> statement-breakpoint
CREATE TABLE "submission_versions" (
	"change_notes" text NOT NULL,
	"tag" text,
	"submission_index" bigint,
	"form_version" uuid,
	"validation_code" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"is_current" boolean DEFAULT true NOT NULL,
	"form" text,
	CONSTRAINT "submission_versions_pkey" PRIMARY KEY("tag","form_version","submission_index","form")
);
--> statement-breakpoint
CREATE INDEX "dataset_items_vector_idx" ON "dataset_items" USING gin (to_tsvector('simple', "label"));--> statement-breakpoint
CREATE INDEX "dataset_items_fuzzy_label_idx" ON "dataset_items" USING gin ("label" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "dataset_items_parent_value_index" ON "dataset_items" ("parent_value") WHERE ("parent_value" is not null);--> statement-breakpoint
CREATE UNIQUE INDEX "dataset_items_id_index" ON "dataset_items" ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "dataset_items_dataset_id_value_index" ON "dataset_items" ("dataset_id","value");--> statement-breakpoint
CREATE INDEX "dataset_ref_items_ref_index" ON "dataset_ref_items" ("ref");--> statement-breakpoint
CREATE INDEX "dataset_ref_items_item_id_index" ON "dataset_ref_items" ("item_id");--> statement-breakpoint
CREATE INDEX "dataset_ref_items_dataset_id_index" ON "dataset_ref_items" ("dataset_id");--> statement-breakpoint
CREATE INDEX "dataset_ref_items_dataset_id_item_id_index" ON "dataset_ref_items" ("dataset_id","item_id");--> statement-breakpoint
CREATE INDEX "dataset_ref_items_ref_item_id_index" ON "dataset_ref_items" ("ref","item_id");--> statement-breakpoint
CREATE INDEX "dataset_refs_dataset_index" ON "dataset_refs" ("dataset");--> statement-breakpoint
CREATE INDEX "datasets_parent_id_index" ON "datasets" ("parent_id") WHERE ("parent_id" is not null);--> statement-breakpoint
CREATE UNIQUE INDEX "datasets_key_index" ON "datasets" ("key");--> statement-breakpoint
CREATE INDEX "dataset_vector_search_idx" ON "datasets" USING gin ((
		setweight(to_tsvector('simple', "title"), 'A') ||
		setweight(to_tsvector('simple', "key"), 'B') ||
		setweight(to_tsvector('simple', "description"), 'C')
		));--> statement-breakpoint
CREATE INDEX "dataset_fuzzy_title_idx" ON "datasets" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "dataset_fuzzy_description_idx" ON "datasets" USING gin ("description" gin_trgm_ops) WHERE ("description" is not null);--> statement-breakpoint
CREATE INDEX "dataset_fuzzy_key_idx" ON "datasets" USING gin ("key" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "form_submissions_form_index" ON "form_submissions" ("form");--> statement-breakpoint
CREATE INDEX "form_submissions_form_version_index" ON "form_submissions" ("form_version");--> statement-breakpoint
CREATE INDEX "form_submissions_form_form_version_index" ON "form_submissions" ("form","form_version");--> statement-breakpoint
CREATE INDEX "form_version_items_item_id_index" ON "form_version_items" ("item_id");--> statement-breakpoint
CREATE INDEX "form_version_items_form_index" ON "form_version_items" ("form");--> statement-breakpoint
CREATE INDEX "form_version_items_form_version_index" ON "form_version_items" ("form_version");--> statement-breakpoint
CREATE INDEX "form_version_items_path_index" ON "form_version_items" ("path");--> statement-breakpoint
CREATE INDEX "form_version_items_parent_id_index" ON "form_version_items" ("parent_id");--> statement-breakpoint
CREATE INDEX "form_versions_form_index" ON "form_versions" ("form");--> statement-breakpoint
CREATE INDEX "form_versions_parent_id_index" ON "form_versions" ("parent_id") WHERE ("parent_id" is not null);--> statement-breakpoint
CREATE UNIQUE INDEX "form_definitions_slug_index" ON "form_definitions" ("slug");--> statement-breakpoint
CREATE INDEX "form_definitions_label_index" ON "form_definitions" ("label");--> statement-breakpoint
CREATE INDEX "form_definitions_description_index" ON "form_definitions" ("description") WHERE ("description" is not null);--> statement-breakpoint
CREATE INDEX "submission_responses_form_index" ON "submission_responses" ("form");--> statement-breakpoint
CREATE INDEX "submission_responses_field_id_index" ON "submission_responses" ("field_id");--> statement-breakpoint
CREATE INDEX "submission_responses_form_version_index" ON "submission_responses" ("form_version");--> statement-breakpoint
CREATE INDEX "submission_responses_submission_tag_index" ON "submission_responses" ("submission_tag");--> statement-breakpoint
CREATE INDEX "submission_versions_validation_code_index" ON "submission_versions" ("validation_code");--> statement-breakpoint
CREATE INDEX "submission_versions_tag_index" ON "submission_versions" ("tag");--> statement-breakpoint
CREATE INDEX "submission_versions_form_index" ON "submission_versions" ("form");--> statement-breakpoint
CREATE INDEX "submission_versions_submission_index_index" ON "submission_versions" ("submission_index");--> statement-breakpoint
CREATE INDEX "submission_versions_form_version_index" ON "submission_versions" ("form_version");--> statement-breakpoint
CREATE INDEX "submission_versions_submission_index_form_index" ON "submission_versions" ("submission_index","form");--> statement-breakpoint
CREATE INDEX "submission_versions_form_version_form_index" ON "submission_versions" ("form_version","form");--> statement-breakpoint
ALTER TABLE "dataset_items" ADD CONSTRAINT "dataset_items_dataset_id_datasets_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "dataset_ref_items" ADD CONSTRAINT "dataset_ref_items_ref_dataset_refs_slug_fkey" FOREIGN KEY ("ref") REFERENCES "dataset_refs"("slug") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dataset_ref_items" ADD CONSTRAINT "dataset_ref_items_RL4RtyL1RLth_fkey" FOREIGN KEY ("dataset_id","item_id") REFERENCES "dataset_items"("dataset_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dataset_refs" ADD CONSTRAINT "dataset_refs_dataset_datasets_id_fkey" FOREIGN KEY ("dataset") REFERENCES "datasets"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "datasets" ADD CONSTRAINT "datasets_parent_id_datasets_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "datasets"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_version_form_form_versions_id_form_fkey" FOREIGN KEY ("form_version","form") REFERENCES "form_versions"("id","form") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_form_definitions_slug_fkey" FOREIGN KEY ("form") REFERENCES "form_definitions"("slug") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "form_version_items" ADD CONSTRAINT "form_version_items_ouTNLkvQNAbQ_fkey" FOREIGN KEY ("form_version","parent_id") REFERENCES "form_version_items"("form_version","id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "form_version_items" ADD CONSTRAINT "form_version_items_item_id_form_items_id_fkey" FOREIGN KEY ("item_id") REFERENCES "form_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "form_version_items" ADD CONSTRAINT "form_version_items_form_form_definitions_slug_fkey" FOREIGN KEY ("form") REFERENCES "form_definitions"("slug") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "form_version_items" ADD CONSTRAINT "form_version_items_form_version_form_form_versions_id_form_fkey" FOREIGN KEY ("form_version","form") REFERENCES "form_versions"("id","form") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_parent_id_form_form_versions_id_form_fkey" FOREIGN KEY ("parent_id","form") REFERENCES "form_versions"("id","form") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_form_form_definitions_slug_fkey" FOREIGN KEY ("form") REFERENCES "form_definitions"("slug") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "submission_responses" ADD CONSTRAINT "submission_responses_uz4m945uEVUl_fkey" FOREIGN KEY ("submission_tag","form_version","submission_index","form") REFERENCES "submission_versions"("tag","form_version","submission_index","form") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "submission_responses" ADD CONSTRAINT "submission_responses_field_id_form_items_id_fkey" FOREIGN KEY ("field_id") REFERENCES "form_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "submission_responses" ADD CONSTRAINT "submission_responses_form_form_definitions_slug_fkey" FOREIGN KEY ("form") REFERENCES "form_definitions"("slug") ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "submission_versions" ADD CONSTRAINT "submission_versions_qHwtaP0jzrzD_fkey" FOREIGN KEY ("submission_index","form") REFERENCES "form_submissions"("_index","form") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "submission_versions" ADD CONSTRAINT "submission_versions_YhadBCm4auX1_fkey" FOREIGN KEY ("form_version","form") REFERENCES "form_versions"("id","form") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "submission_versions" ADD CONSTRAINT "submission_versions_form_form_definitions_slug_fkey" FOREIGN KEY ("form") REFERENCES "form_definitions"("slug") ON UPDATE CASCADE;