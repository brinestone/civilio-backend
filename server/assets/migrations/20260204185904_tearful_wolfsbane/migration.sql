CREATE TYPE "dataset_ref_types" AS ENUM('all', 'subset');--> statement-breakpoint
CREATE TABLE "dataset_ref_items" (
	"ref" text NOT NULL,
	"dataset_id" uuid NOT NULL,
	"item_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dataset_refs" (
	"slug" text PRIMARY KEY,
	"type" "dataset_ref_types" DEFAULT 'all'::"dataset_ref_types" NOT NULL,
	"inUse" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dataset" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dataset_items" DROP COLUMN "i18n_key";--> statement-breakpoint
CREATE INDEX "dataset_ref_items_ref_index" ON "dataset_ref_items" ("ref");--> statement-breakpoint
CREATE INDEX "dataset_ref_items_item_id_index" ON "dataset_ref_items" ("item_id");--> statement-breakpoint
CREATE INDEX "dataset_ref_items_dataset_id_index" ON "dataset_ref_items" ("dataset_id");--> statement-breakpoint
CREATE INDEX "dataset_ref_items_dataset_id_item_id_index" ON "dataset_ref_items" ("dataset_id","item_id");--> statement-breakpoint
CREATE INDEX "dataset_ref_items_ref_item_id_index" ON "dataset_ref_items" ("ref","item_id");--> statement-breakpoint
CREATE INDEX "dataset_refs_dataset_index" ON "dataset_refs" ("dataset");--> statement-breakpoint
ALTER TABLE "dataset_ref_items" ADD CONSTRAINT "dataset_ref_items_ref_dataset_refs_slug_fkey" FOREIGN KEY ("ref") REFERENCES "dataset_refs"("slug") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dataset_ref_items" ADD CONSTRAINT "dataset_ref_items_RL4RtyL1RLth_fkey" FOREIGN KEY ("dataset_id","item_id") REFERENCES "dataset_items"("dataset_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dataset_refs" ADD CONSTRAINT "dataset_refs_dataset_datasets_id_fkey" FOREIGN KEY ("dataset") REFERENCES "datasets"("id") ON DELETE CASCADE;