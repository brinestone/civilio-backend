CREATE INDEX "form_versions_label_index" ON "civilio"."form_versions" ("label");--> statement-breakpoint
CREATE INDEX "form_versions_form_index" ON "civilio"."form_versions" ("form");--> statement-breakpoint
CREATE INDEX "form_versions_parent_id_index" ON "civilio"."form_versions" ("parent_id") WHERE ("parent_id" is not null);