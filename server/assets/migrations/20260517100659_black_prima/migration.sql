CREATE TYPE "change_ops" AS ENUM('insert', 'update', 'delete');--> statement-breakpoint
CREATE TABLE "doc_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"entity_key" text NOT NULL,
	"collection" text NOT NULL,
	"operation" "change_ops" NOT NULL,
	"data" jsonb,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
