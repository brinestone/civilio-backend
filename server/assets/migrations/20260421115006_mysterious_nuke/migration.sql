CREATE TABLE "sync_changes" (
	"rev" bigserial PRIMARY KEY,
	"entity_id" uuid NOT NULL,
	"entity_table" varchar(63) NOT NULL,
	"type" integer NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
