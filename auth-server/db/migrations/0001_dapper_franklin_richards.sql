CREATE TYPE "public"."form_types" AS ENUM('cec', 'fosa', 'chefferie');--> statement-breakpoint
CREATE TYPE "public"."genders" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."locality_type" AS ENUM('municipality', 'region', 'subdivision');--> statement-breakpoint
CREATE TYPE "public"."user_roles" AS ENUM('admin', 'employee', 'field_agent');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"owner" bigint,
	"should_change_password" boolean DEFAULT true,
	CONSTRAINT "accounts_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "civil_status_centers" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"name" text NOT NULL,
	"images" text[],
	"municipality" bigint,
	"location" geometry(point),
	"addedBy" bigint
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"name" text NOT NULL,
	"images" text[],
	"description" text,
	"addedBy" bigint,
	"lower_threshold" real NOT NULL,
	"upper_threshold" real,
	CONSTRAINT "equipment_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "equipment_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"equipment" bigint,
	"name" text NOT NULL,
	"value" text,
	"group" text
);
--> statement-breakpoint
CREATE TABLE "equipment_units" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"equipment" bigint,
	"name" text DEFAULT 'default' NOT NULL,
	"scaleFactor" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"type" "form_types" NOT NULL,
	"center" bigint,
	"recordedBy" bigint,
	"draft" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "inventories" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"center" bigint,
	"createdBy" bigint,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_item_field_overrides" (
	"inventoryItem" bigint,
	"field" bigint,
	"value" text,
	CONSTRAINT "inventory_item_field_overrides_inventoryItem_field_pk" PRIMARY KEY("inventoryItem","field")
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"addedBy" bigint,
	"inventory" bigint,
	"starting_quantity" real DEFAULT 0,
	"equipment" bigint
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"quantity" real NOT NULL,
	"unit" bigint,
	"item" bigint,
	"is_inbound" boolean NOT NULL,
	"tags" text[] DEFAULT '{}',
	"recordedBy" bigint
);
--> statement-breakpoint
CREATE TABLE "localities" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"location" geometry(point),
	"type" "locality_type",
	"name" text NOT NULL,
	"description" text,
	"images" text[],
	"parent" bigint
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"description" text,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"property" bigint,
	"code" text NOT NULL,
	"label" text,
	"group" text
);
--> statement-breakpoint
CREATE TABLE "property_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"table_name" text NOT NULL,
	"property" bigint,
	"value" bigint
);
--> statement-breakpoint
CREATE TABLE "submission_values" (
	"field" text NOT NULL,
	"submission" bigint,
	"value" text,
	CONSTRAINT "submission_values_field_submission_pk" PRIMARY KEY("field","submission")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"ip" text NOT NULL,
	"user" bigint,
	"account" bigint
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"niu" text NOT NULL,
	"cni" text NOT NULL,
	"avatar" text,
	"given_names" text,
	"last_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_roles" DEFAULT 'employee',
	"gender" "genders" NOT NULL,
	"access_revoked" boolean DEFAULT false,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "civil_status_centers" ADD CONSTRAINT "civil_status_centers_municipality_localities_id_fk" FOREIGN KEY ("municipality") REFERENCES "public"."localities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "civil_status_centers" ADD CONSTRAINT "civil_status_centers_addedBy_users_id_fk" FOREIGN KEY ("addedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_addedBy_users_id_fk" FOREIGN KEY ("addedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_fields" ADD CONSTRAINT "equipment_fields_equipment_equipment_id_fk" FOREIGN KEY ("equipment") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_units" ADD CONSTRAINT "equipment_units_equipment_equipment_id_fk" FOREIGN KEY ("equipment") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_center_civil_status_centers_id_fk" FOREIGN KEY ("center") REFERENCES "public"."civil_status_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_recordedBy_users_id_fk" FOREIGN KEY ("recordedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_center_civil_status_centers_id_fk" FOREIGN KEY ("center") REFERENCES "public"."civil_status_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_item_field_overrides" ADD CONSTRAINT "inventory_item_field_overrides_inventoryItem_inventory_items_id_fk" FOREIGN KEY ("inventoryItem") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_item_field_overrides" ADD CONSTRAINT "inventory_item_field_overrides_field_equipment_fields_id_fk" FOREIGN KEY ("field") REFERENCES "public"."equipment_fields"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_addedBy_users_id_fk" FOREIGN KEY ("addedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_inventory_inventories_id_fk" FOREIGN KEY ("inventory") REFERENCES "public"."inventories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_equipment_equipment_id_fk" FOREIGN KEY ("equipment") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_unit_equipment_units_id_fk" FOREIGN KEY ("unit") REFERENCES "public"."equipment_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_item_inventory_items_id_fk" FOREIGN KEY ("item") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_recordedBy_users_id_fk" FOREIGN KEY ("recordedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "localities" ADD CONSTRAINT "localities_parent_localities_id_fk" FOREIGN KEY ("parent") REFERENCES "public"."localities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_options" ADD CONSTRAINT "property_options_property_properties_id_fk" FOREIGN KEY ("property") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_values" ADD CONSTRAINT "property_values_property_properties_id_fk" FOREIGN KEY ("property") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_values" ADD CONSTRAINT "property_values_value_property_options_id_fk" FOREIGN KEY ("value") REFERENCES "public"."property_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_values" ADD CONSTRAINT "submission_values_submission_form_submissions_id_fk" FOREIGN KEY ("submission") REFERENCES "public"."form_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_account_accounts_id_fk" FOREIGN KEY ("account") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "equipment_fields_equipment_name_index" ON "equipment_fields" USING btree ("equipment","name");--> statement-breakpoint
CREATE UNIQUE INDEX "inventories_name_center_index" ON "inventories" USING btree ("name","center");--> statement-breakpoint
CREATE UNIQUE INDEX "property_options_property_code_index" ON "property_options" USING btree ("property","code");--> statement-breakpoint
CREATE UNIQUE INDEX "users_niu_cni_index" ON "users" USING btree ("niu","cni");