ALTER TABLE "civilio"."choice_groups"
  ADD CONSTRAINT "choice_groups_form_forms_name_fkey" FOREIGN KEY ("form") REFERENCES "civilio"."forms" ("name") ON DELETE CASCADE ON UPDATE CASCADE;