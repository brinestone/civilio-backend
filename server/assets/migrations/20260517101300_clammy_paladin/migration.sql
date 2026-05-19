ALTER TABLE "doc_changes" ALTER COLUMN "data" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "doc_changes_collection_recorded_at_index" ON "doc_changes" ("collection","recorded_at");--> statement-breakpoint
CREATE INDEX "doc_changes_entity_key_recorded_at_index" ON "doc_changes" ("entity_key","recorded_at");--> statement-breakpoint
CREATE VIEW "vw_doc_changes" AS (select "id", "entity_key", "collection", "operation", "data", "recorded_at", "operation" = 'delete' from "doc_changes");