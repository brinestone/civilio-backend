CREATE TABLE "library_items" (
	"owner" text,
	"itemId" uuid,
	"added_at" timestamp with time zone,
	CONSTRAINT "library_items_pkey" PRIMARY KEY("itemId","owner")
);
--> statement-breakpoint
ALTER TABLE "form_items" DROP CONSTRAINT "form_items_ownerDevice_devices_id_fkey";--> statement-breakpoint
ALTER TABLE "form_definitions" DROP CONSTRAINT "form_definitions_ownerDevice_devices_id_fkey";--> statement-breakpoint
ALTER TABLE "form_items" DROP COLUMN "ownerDevice";--> statement-breakpoint
ALTER TABLE "form_definitions" DROP COLUMN "ownerDevice";--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_owner_devices_id_fkey" FOREIGN KEY ("owner") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_itemId_form_items_id_fkey" FOREIGN KEY ("itemId") REFERENCES "form_items"("id") ON DELETE CASCADE;