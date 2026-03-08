ALTER TABLE "form_version_items" DROP CONSTRAINT "form_version_items_uQN3IPdgvV5n_fkey";--> statement-breakpoint
ALTER TABLE "form_version_items" DROP COLUMN "parent_path";--> statement-breakpoint
ALTER TABLE "form_version_items" DROP CONSTRAINT "form_version_items_pkey";--> statement-breakpoint
ALTER TABLE "form_version_items" ADD PRIMARY KEY ("form_version","id");--> statement-breakpoint
ALTER TABLE "form_version_items" ADD CONSTRAINT "form_version_items_ouTNLkvQNAbQ_fkey" FOREIGN KEY ("form_version","parent_id") REFERENCES "form_version_items"("form_version","id") ON DELETE SET NULL ON UPDATE CASCADE;