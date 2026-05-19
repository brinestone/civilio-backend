CREATE TABLE "devices" (
	"id" text PRIMARY KEY,
	"userAgent" text NOT NULL,
	"added_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "form_items" ADD COLUMN "ownerDevice" text;--> statement-breakpoint
ALTER TABLE "form_definitions" ADD COLUMN "ownerDevice" text;--> statement-breakpoint
ALTER TABLE "form_items" ADD CONSTRAINT "form_items_ownerDevice_devices_id_fkey" FOREIGN KEY ("ownerDevice") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "form_definitions" ADD CONSTRAINT "form_definitions_ownerDevice_devices_id_fkey" FOREIGN KEY ("ownerDevice") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;