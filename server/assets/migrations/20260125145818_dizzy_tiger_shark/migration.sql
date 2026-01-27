CREATE TYPE "civilio"."form_field_type" AS ENUM('text', 'multiline', 'date', 'date-time', 'email', 'url', 'geo-point', 'single-select', 'multi-select', 'file', 'number', 'phone', 'boolean');--> statement-breakpoint
ALTER TABLE "civilio"."choice_items" RENAME TO "dataset_items";--> statement-breakpoint
ALTER TABLE "civilio"."choice_groups" RENAME TO "datasets";--> statement-breakpoint
ALTER TABLE "civilio"."form_fields" DROP CONSTRAINT "form_fields_form_name_form_definitions_name_fkey";--> statement-breakpoint
ALTER TABLE "civilio"."form_fields" DROP CONSTRAINT "form_fields_section_key_form_name_form_sections_key_form_fkey";--> statement-breakpoint
ALTER TABLE "civilio"."form_sections" DROP CONSTRAINT "form_sections_form_form_definitions_name_fkey";--> statement-breakpoint
DROP TABLE "civilio"."form_definitions";--> statement-breakpoint
DROP TABLE "civilio"."form_fields";--> statement-breakpoint
DROP TABLE "civilio"."form_sections";