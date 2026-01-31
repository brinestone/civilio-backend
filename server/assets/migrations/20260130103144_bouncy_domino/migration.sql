CREATE TYPE "revisions"."change_op" AS ENUM('INSERT', 'DELETE', 'UPDATE', 'REVERT');--> statement-breakpoint
CREATE TYPE "civilio"."form_field_type" AS ENUM('text', 'multiline', 'date', 'date-time', 'email', 'url', 'geo-point', 'single-select', 'multi-select', 'file', 'number', 'phone', 'boolean');--> statement-breakpoint
CREATE TYPE "civilio"."form_item_type" AS ENUM('field', 'note', 'image', 'group', 'list', 'separator');--> statement-breakpoint
CREATE TYPE "revisions"."sync_status" AS ENUM('pending', 'synced', 'failed');--> statement-breakpoint
CREATE SEQUENCE "civilio"."chefferie_index_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 324 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."chefferie_personnel_index_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 186 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."csc_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 475016321 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."csc_index_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 445 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."csc_personnel_index_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 774 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."csc_pieces_index_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 543 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."csc_statistics_index_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1463 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."csc_villages_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 2344 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."fosa_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 484119070 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."fosa_index_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 971 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "civilio"."fosa_personnel_index_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1261 CACHE 1;--> statement-breakpoint
CREATE TABLE "revisions"."ledger" (
	"hash" text NOT NULL,
	"form" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"submission_index" integer NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "civilio"."choices" (
	"name" text,
	"label" text NOT NULL,
	"parent_value" text,
	"parent_key" text,
	"group" text,
	"i18n_key" text,
	"version" text,
	"description" text,
	CONSTRAINT "choices_pkey" PRIMARY KEY("name","group","version")
);
--> statement-breakpoint
CREATE TABLE "civilio"."dataset_items" (
	"id" uuid DEFAULT gen_random_uuid(),
	"label" text NOT NULL,
	"value" text NOT NULL,
	"parent_value" text,
	"i18n_key" text,
	"dataset_id" uuid,
	"ordinal" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dataset_items_pkey" PRIMARY KEY("dataset_id","id")
);
--> statement-breakpoint
CREATE TABLE "civilio"."datasets" (
	"title" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"parent_id" uuid,
	"description" text,
	"key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revisions"."deltas" (
	"hash" text,
	"submission_index" integer,
	"index" integer,
	"form" text,
	"table_name" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delta_data" jsonb NOT NULL,
	"changed_by" text,
	"op" "revisions"."change_op" NOT NULL,
	"parent" text,
	"sync_status" "revisions"."sync_status" DEFAULT 'pending'::"revisions"."sync_status",
	CONSTRAINT "deltas_pkey" PRIMARY KEY("hash","submission_index","index","form","table_name")
);
--> statement-breakpoint
CREATE TABLE "civilio"."form_field_mappings" (
	"field" text,
	"i18n_key" text,
	"db_column" text NOT NULL,
	"db_table" text NOT NULL,
	"form" text,
	"db_column_type" text NOT NULL,
	"alias_hash" text GENERATED ALWAYS AS (md5
				("civilio"."form_field_mappings"."field")) STORED,
	CONSTRAINT "field_db_column_db_table_form_pk" PRIMARY KEY("field","form")
);
--> statement-breakpoint
CREATE TABLE "civilio"."form_definitions" (
	"slug" text PRIMARY KEY,
	"logo" text,
	"label" text NOT NULL,
	"description" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "civilio"."form_items" (
	"title" text NOT NULL,
	"description" text,
	"type" "civilio"."form_item_type" NOT NULL,
	"relevance" jsonb,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"meta" jsonb,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "civilio"."form_submissions" (
	"_index" bigserial,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"form_version" uuid NOT NULL,
	"form" text,
	CONSTRAINT "form_submissions_pkey" PRIMARY KEY("_index","form")
);
--> statement-breakpoint
CREATE TABLE "civilio"."form_version_items" (
	"item_id" uuid,
	"form" text NOT NULL,
	"form_version" uuid,
	"parent_id" uuid,
	"meta" jsonb,
	CONSTRAINT "form_version_items_pkey" PRIMARY KEY("form_version","item_id")
);
--> statement-breakpoint
CREATE TABLE "civilio"."form_versions" (
	"id" uuid DEFAULT gen_random_uuid(),
	"form" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"parent_id" uuid,
	"is_current" boolean DEFAULT true NOT NULL,
	CONSTRAINT "form_versions_pkey" PRIMARY KEY("id","form")
);
--> statement-breakpoint
CREATE TABLE "civilio"."submission_responses" (
	"submission_index" bigint,
	"field_id" uuid,
	"form_version" uuid,
	"response_id" uuid,
	"form" text NOT NULL,
	"value" text,
	CONSTRAINT "submission_responses_pkey" PRIMARY KEY("submission_index","field_id","form_version","response_id")
);
--> statement-breakpoint
CREATE TABLE "civilio"."submission_versions" (
	"id" uuid DEFAULT gen_random_uuid(),
	"submission_index" bigint,
	"form_version" uuid,
	"validation_code" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"is_current" boolean DEFAULT true NOT NULL,
	"form" text,
	CONSTRAINT "submission_versions_pkey" PRIMARY KEY("id","form_version","submission_index","form")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_hash_form_submission_index_index" ON "revisions"."ledger" ("hash","form","submission_index");--> statement-breakpoint
CREATE INDEX "dataset_items_parent_value_index" ON "civilio"."dataset_items" ("parent_value") WHERE ("parent_value" is not null);--> statement-breakpoint
CREATE UNIQUE INDEX "dataset_items_id_index" ON "civilio"."dataset_items" ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "dataset_items_dataset_id_value_index" ON "civilio"."dataset_items" ("dataset_id","value");--> statement-breakpoint
CREATE INDEX "datasets_parent_id_index" ON "civilio"."datasets" ("parent_id") WHERE ("parent_id" is not null);--> statement-breakpoint
CREATE UNIQUE INDEX "datasets_key_index" ON "civilio"."datasets" ("key");--> statement-breakpoint
CREATE INDEX "deltas_hash_index" ON "revisions"."deltas" ("hash");--> statement-breakpoint
CREATE INDEX "deltas_submission_index_index" ON "revisions"."deltas" ("submission_index");--> statement-breakpoint
CREATE INDEX "deltas_index_index" ON "revisions"."deltas" ("index");--> statement-breakpoint
CREATE INDEX "deltas_form_index" ON "revisions"."deltas" ("form");--> statement-breakpoint
CREATE INDEX "deltas_changed_at_index" ON "revisions"."deltas" ("changed_at");--> statement-breakpoint
CREATE INDEX "deltas_parent_index" ON "revisions"."deltas" ("parent") WHERE ("parent" is not null);--> statement-breakpoint
CREATE INDEX "deltas_parent_hash_index" ON "revisions"."deltas" ("parent","hash");--> statement-breakpoint
CREATE INDEX "deltas_submission_index_form_changed_at_index" ON "revisions"."deltas" ("submission_index","form","changed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "form_definitions_slug_index" ON "civilio"."form_definitions" ("slug");--> statement-breakpoint
CREATE INDEX "form_definitions_label_index" ON "civilio"."form_definitions" ("label");--> statement-breakpoint
CREATE INDEX "form_definitions_description_index" ON "civilio"."form_definitions" ("description") WHERE ("description" is not null);--> statement-breakpoint
CREATE INDEX "form_items_title_index" ON "civilio"."form_items" ("title");--> statement-breakpoint
CREATE INDEX "form_items_description_index" ON "civilio"."form_items" ("description") WHERE ("description" is not null);--> statement-breakpoint
CREATE INDEX "form_submissions_form_index" ON "civilio"."form_submissions" ("form");--> statement-breakpoint
CREATE INDEX "form_submissions_form_version_index" ON "civilio"."form_submissions" ("form_version");--> statement-breakpoint
CREATE INDEX "form_submissions_form_form_version_index" ON "civilio"."form_submissions" ("form","form_version");--> statement-breakpoint
CREATE INDEX "form_version_items_item_id_index" ON "civilio"."form_version_items" ("item_id");--> statement-breakpoint
CREATE INDEX "form_version_items_form_index" ON "civilio"."form_version_items" ("form");--> statement-breakpoint
CREATE INDEX "form_version_items_form_version_index" ON "civilio"."form_version_items" ("form_version");--> statement-breakpoint
CREATE INDEX "form_version_items_parent_id_index" ON "civilio"."form_version_items" ("parent_id") WHERE ("parent_id" is not null);--> statement-breakpoint
CREATE INDEX "form_versions_form_index" ON "civilio"."form_versions" ("form");--> statement-breakpoint
CREATE INDEX "form_versions_parent_id_index" ON "civilio"."form_versions" ("parent_id") WHERE ("parent_id" is not null);--> statement-breakpoint
CREATE INDEX "submission_responses_form_index" ON "civilio"."submission_responses" ("form");--> statement-breakpoint
CREATE INDEX "submission_responses_field_id_index" ON "civilio"."submission_responses" ("field_id");--> statement-breakpoint
CREATE INDEX "submission_responses_form_version_index" ON "civilio"."submission_responses" ("form_version");--> statement-breakpoint
CREATE INDEX "submission_responses_response_id_index" ON "civilio"."submission_responses" ("response_id");--> statement-breakpoint
CREATE INDEX "submission_versions_validation_code_index" ON "civilio"."submission_versions" ("validation_code");--> statement-breakpoint
CREATE INDEX "submission_versions_form_index" ON "civilio"."submission_versions" ("form");--> statement-breakpoint
CREATE INDEX "submission_versions_submission_index_index" ON "civilio"."submission_versions" ("submission_index");--> statement-breakpoint
CREATE INDEX "submission_versions_form_version_index" ON "civilio"."submission_versions" ("form_version");--> statement-breakpoint
CREATE INDEX "submission_versions_submission_index_form_index" ON "civilio"."submission_versions" ("submission_index","form");--> statement-breakpoint
CREATE INDEX "submission_versions_form_version_form_index" ON "civilio"."submission_versions" ("form_version","form");--> statement-breakpoint
ALTER TABLE "civilio"."dataset_items" ADD CONSTRAINT "dataset_items_dataset_id_datasets_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "civilio"."datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."datasets" ADD CONSTRAINT "datasets_parent_id_datasets_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "civilio"."datasets"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."form_submissions" ADD CONSTRAINT "form_submissions_form_version_form_form_versions_id_form_fkey" FOREIGN KEY ("form_version","form") REFERENCES "civilio"."form_versions"("id","form") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."form_submissions" ADD CONSTRAINT "form_submissions_form_form_definitions_slug_fkey" FOREIGN KEY ("form") REFERENCES "civilio"."form_definitions"("slug") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."form_version_items" ADD CONSTRAINT "form_version_items_item_id_form_items_id_fkey" FOREIGN KEY ("item_id") REFERENCES "civilio"."form_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."form_version_items" ADD CONSTRAINT "form_version_items_fU9TFYVa3lSA_fkey" FOREIGN KEY ("form_version","parent_id") REFERENCES "civilio"."form_version_items"("form_version","item_id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "civilio"."form_version_items" ADD CONSTRAINT "form_version_items_form_form_definitions_slug_fkey" FOREIGN KEY ("form") REFERENCES "civilio"."form_definitions"("slug") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."form_version_items" ADD CONSTRAINT "form_version_items_form_version_form_form_versions_id_form_fkey" FOREIGN KEY ("form_version","form") REFERENCES "civilio"."form_versions"("id","form") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."form_versions" ADD CONSTRAINT "form_versions_parent_id_form_form_versions_id_form_fkey" FOREIGN KEY ("parent_id","form") REFERENCES "civilio"."form_versions"("id","form") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."form_versions" ADD CONSTRAINT "form_versions_form_form_definitions_slug_fkey" FOREIGN KEY ("form") REFERENCES "civilio"."form_definitions"("slug") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."submission_responses" ADD CONSTRAINT "submission_responses_tPteqUmlUlJA_fkey" FOREIGN KEY ("response_id","form_version","submission_index","form") REFERENCES "civilio"."submission_versions"("id","form_version","submission_index","form") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."submission_responses" ADD CONSTRAINT "submission_responses_field_id_form_items_id_fkey" FOREIGN KEY ("field_id") REFERENCES "civilio"."form_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."submission_responses" ADD CONSTRAINT "submission_responses_form_form_definitions_slug_fkey" FOREIGN KEY ("form") REFERENCES "civilio"."form_definitions"("slug") ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."submission_versions" ADD CONSTRAINT "submission_versions_qHwtaP0jzrzD_fkey" FOREIGN KEY ("submission_index","form") REFERENCES "civilio"."form_submissions"("_index","form") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."submission_versions" ADD CONSTRAINT "submission_versions_YhadBCm4auX1_fkey" FOREIGN KEY ("form_version","form") REFERENCES "civilio"."form_versions"("id","form") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."submission_versions" ADD CONSTRAINT "submission_versions_form_form_definitions_slug_fkey" FOREIGN KEY ("form") REFERENCES "civilio"."form_definitions"("slug") ON UPDATE CASCADE;--> statement-breakpoint
CREATE VIEW "civilio"."vw_db_columns" AS (SELECT c.column_name,
				   c.data_type,
				   c.table_name,
				   CAST(c.table_schema as text) as form
			FROM information_schema.columns c
		);--> statement-breakpoint
CREATE VIEW "civilio"."vw_facilities" AS (
	SELECT UPPER(info.facility_name) AS facility_name,
		   info.index,
		   info.form,
		   UPPER(info.location)      AS location,
		   info.gps_coordinates,
		   validated                 AS approved,
		   extra_info,
		   created_at
	FROM (SELECT c._index                                    as index,
				 'csc'::TEXT                                 as form,
				 c.q2_4_officename                           as facility_name,
				 CONCAT_WS(' - ', mu_ch.label, mu_div.label) as location,
				 c.q2_12_gps_coordinates                     as gps_coordinates,
				 COALESCE(c._validation_status = 'validation_status_approved',
						  false)                             as validated,
				 jsonb_build_object(
					 'milieu', mil.label,
					 'is_functional',
					 COALESCE(c.q2_10_fonctionnel = '1', false),
					 'degree', deg_o.label,
					 'is_chiefdom', COALESCE(c.q2_1a_chefferie = '1', false),
					 'size', COALESCE(c_size.label, c.q2_06_taille_commune),
					 'village_count', COALESCE(v_counts.village_count, 0),
					 'employee_count', COALESCE(em_counts.employee_count, 1),
					 'equipment',
					 (
						 COALESCE(c.q6_01_computers::DOUBLE PRECISION::INTEGER,
								  0) +
						 COALESCE(c.q6_02_serveurs::DOUBLE PRECISION::INTEGER,
								  0) +
						 COALESCE(c.q6_03_printers::DOUBLE PRECISION::INTEGER,
								  0) +
						 COALESCE(c.q6_4_scanners::DOUBLE PRECISION::INTEGER,
								  0) +
						 COALESCE(c.q6_5_onduleur::DOUBLE PRECISION::INTEGER,
								  0) +
						 COALESCE(c.q6_6_climatiseur::DOUBLE PRECISION::INTEGER,
								  0) +
						 COALESCE(c.q6_7_ventilateur::DOUBLE PRECISION::INTEGER,
								  0) +
						 COALESCE(
							 c.q6_9_tablea_bureau::DOUBLE PRECISION::INTEGER,
							 0) +
						 COALESCE(c.q6_10_chaise::DOUBLE PRECISION::INTEGER,
								  0) +
						 COALESCE(c.q6_12_car::DOUBLE PRECISION::INTEGER, 0) +
						 COALESCE(c.q9_13_moto::DOUBLE PRECISION::INTEGER, 0)
						 ),
					 'has_internet', COALESCE(
						 c.q4_12_batiment_connecte::DOUBLE PRECISION::INTEGER =
						 1,
						 false),
					 'has_power', COALESCE(
						 c.q4_02_reseau_electrique::DOUBLE PRECISION::INTEGER =
						 1 OR
						 c.q4_5_autre_source::DOUBLE PRECISION::INTEGER = 1,
						 false),
					 'has_water',
					 COALESCE(c.q4_7alimentation_eau::TEXT NOT IN ('1'), false)
				 )                                           as extra_info,
				 c.q0_06_date_creation                       AS created_at
		  FROM csc.data c
				   LEFT JOIN (SELECT _parent_index, COUNT(*) AS employee_count
							  FROM csc.data_personnel
							  GROUP BY _parent_index) em_counts
							 ON em_counts._parent_index = c._index
				   LEFT JOIN (SELECT _parent_index, COUNT(*) AS village_count
							  FROM csc.data_villages
							  GROUP BY _parent_index) v_counts
							 ON v_counts._parent_index = c._index
				   LEFT JOIN civilio.choices c_size
							 ON c_size."group" = 'pq1hw83' AND
								c_size.version = 'csc' AND
								c_size.name = c.q2_06_taille_commune
				   LEFT JOIN civilio.choices mil
							 ON mil."group" = 'vb2qk85' AND
								mil.version = 'csc' AND
								mil.name = c.milieu::TEXT
				   LEFT JOIN civilio.choices deg_o
							 ON deg_o."group" = 'sl95o71' AND
								deg_o.version = 'csc' AND deg_o.name = c.degr::TEXT
				   LEFT JOIN civilio.choices mu_div
							 ON mu_div."group" = 'division' AND
								mu_div.name = c.q2_01_division::TEXT AND
								mu_div.version = 'csc'
				   LEFT JOIN civilio.choices mu_ch
							 ON mu_ch."group" = 'commune' AND
								mu_ch.name = c.q2_02_municipality::TEXT AND
								mu_ch.version = 'csc' AND
								mu_ch.parent = c.q2_01_division::TEXT
		  UNION
		  SELECT c._index,
				 'fosa'::TEXT                                as form,
				 c.q1_12_officename                          as facility_name,
				 CONCAT_WS(' - ', mu_ch.label, mu_div.label) as location,
				 c.q1_13_gps_coordinates                     as gps_coordinates,
				 COALESCE(c._validation_status = 'validation_status_approved',
						  false)                             as validated,
				 jsonb_build_object(
					 'milieu', ml.label,
					 'health_area', mha.label,
					 'health_district', mda.label,
					 'category',
					 COALESCE(NULLIF(TRIM(BOTH ' ' FROM c.autre_cat_gorie), ''),
							  c_cat.label),
					 'status', c_status.label,
					 'employee_count', COALESCE(em_counts.employee_count, 1),
					 'has_internet', COALESCE(
						 c.q7_08_broadband_conn_available::DOUBLE PRECISION::INTEGER =
						 1, false),
					 'has_power', COALESCE(
						 c.q7_01_facility_conn_power_grid::DOUBLE PRECISION::INTEGER =
						 1,
						 c.q7_04_any_source_of_backup::DOUBLE PRECISION::INTEGER =
						 1,
						 false),
					 'has_water', COALESCE(
						 c.q6_09aalimentation_eau::DOUBLE PRECISION::INTEGER =
						 1,
						 false),
					 'equipment', (
						 COALESCE(c.q9_02_computers, 0) +
						 COALESCE(c.q9_03_printers, 0) +
						 COALESCE(c.q9_04_tablets, 0) +
						 COALESCE(c.q9_10_car, 0) +
						 COALESCE(c.q9_11_mopeds, 0)
						 ),
					 'stats_l_5', jsonb_build_object('births',
													 COALESCE(group_ce1sz98_ligne_colonne, 0) +
													 COALESCE(group_ce1sz98_ligne_1_colonne, 0) +
													 COALESCE(group_ce1sz98_ligne_2_colonne, 0) +
													 COALESCE(group_ce1sz98_ligne_3_colonne, 0) +
													 COALESCE(group_ce1sz98_ligne_4_colonne, 0),
													 'deaths',
													 COALESCE(group_ce1sz98_ligne_colonne_1, 0) +
													 COALESCE(group_ce1sz98_ligne_1_colonne_1, 0) +
													 COALESCE(group_ce1sz98_ligne_2_colonne_1, 0) +
													 COALESCE(group_ce1sz98_ligne_3_colonne_1, 0) +
													 COALESCE(group_ce1sz98_ligne_4_colonne_1, 0)
								  )
				 )                                           AS extra_info,
				 c.q0_06_date_creation                       AS created_at
		  FROM fosa.data c
				   LEFT JOIN (SELECT _parent_index, COUNT(*) AS employee_count
							  FROM fosa.data_personnel
							  GROUP BY _parent_index) em_counts
							 ON em_counts._parent_index = c._index
				   LEFT JOIN civilio.choices c_status
							 ON c_status."group" = 'qy7we33' AND
								c_status.name = c.statut_de_la_fosa::TEXT AND
								c_status.version = 'fosa'
				   LEFT JOIN civilio.choices c_cat
							 ON c_cat."group" = 'pa9ii12' AND
								c_cat.name =
								c.q1_07_type_healt_facility::TEXT AND
								c_cat.version = 'fosa'
				   LEFT JOIN civilio.choices mda
							 ON mda."group" = 'district' AND
								mda.name = c.ds_rattachement::TEXT AND
								mda.version = 'fosa'
				   LEFT JOIN civilio.choices mha
							 ON mha."group" = 'airesante' AND
								mha.name =
								c.as_rattachement::TEXT AND
								mha.version = 'fosa' AND
								mha.parent =
								c.ds_rattachement::TEXT
				   LEFT JOIN civilio.choices ml
							 ON ml."group" = 'vb2qk85' AND
								ml.name = c.milieu::TEXT AND ml.version = 'fosa'
				   LEFT JOIN civilio.choices mu_div
							 ON mu_div."group" = 'division' AND
								mu_div.name = c.q1_02_division::TEXT AND
								mu_div.version = 'fosa'
				   LEFT JOIN civilio.choices mu_ch
							 ON mu_ch."group" = 'commune' AND
								mu_ch.name = c.q1_03_municipality::TEXT AND
								mu_ch.version = 'fosa' AND
								mu_ch.parent = c.q1_02_division::TEXT
		  UNION
		  SELECT c._index,
				 'chefferie'::TEXT                           as form,
				 c.q1_12_officename                          as facility_name,
				 CONCAT_WS(' - ', mu_ch.label, mu_div.label) as location,
				 c.q1_13_gps_coordinates                     as gps_coordinates,
				 COALESCE(c._validation_status = 'validation_status_approved',
						  false)                             as validated,
				 jsonb_build_object(
					 'degree', c_deg.label,
					 'equipment', (COALESCE(c.q9_02_computers, 0) +
								   COALESCE(c.q9_03_printers, 0) +
								   COALESCE(c.q9_04_tablets, 0) +
								   COALESCE(c.q9_10_car, 0) +
								   COALESCE(c.q9_11_mopeds, 0)),
					 'has_internet', COALESCE(
						 c.q4_02_broadband_conn_available::DOUBLE PRECISION::INTEGER =
						 1, false),
					 'has_water', COALESCE(
						 c.q6_09aalimentation_eau::DOUBLE PRECISION::INTEGER =
						 1,
						 false),
					 'has_power',
					 COALESCE(
						 c.q4_04_electricite::DOUBLE PRECISION::INTEGER = 1,
						 false),
					 'employee_count', employee_count
				 )                                           AS extra_info,
				 c.q0_06_date_creation                       AS created_at
		  FROM chefferie.data c
				   LEFT JOIN (SELECT _parent_index, COUNT(*) AS employee_count
							  FROM chefferie.data_personnel
							  GROUP BY _parent_index) em_counts
							 ON em_counts._parent_index = c._index
				   LEFT JOIN civilio.choices c_deg
							 ON c_deg."group" = 'vb2qk85' AND
								c_deg.name = c.degre::TEXT AND
								c_deg.version = 'chefferie'
				   LEFT JOIN civilio.choices mu_div
							 ON mu_div."group" = 'division' AND
								mu_div.name = c.q1_02_division::TEXT AND
								mu_div.version = 'chefferie'
				   LEFT JOIN civilio.choices mu_ch
							 ON mu_ch."group" = 'commune' AND
								mu_ch.name = c.q1_03_municipality::TEXT AND
								mu_ch.version = 'chefferie' AND
								mu_ch.parent =
								c.q1_02_division::TEXT) AS info
);--> statement-breakpoint
CREATE VIEW "civilio"."vw_submissions" AS (
			SELECT _id,
				   _index,
				   _validation_status,
				   validation_code,
				   facility_name,
				   _submission_time,
				   form,
				   next,
				   prev,
				   lower(COALESCE(_validation_status, ''::text)) =
				   'validation_status_approved'::text AS is_valid,
				   current_version,
				   last_modified_at,
				   last_modified_by
			FROM ((SELECT df._id::double precision::integer                       AS _id,
						  df._index,
						  df._validation_status::text                             AS _validation_status,
						  df.code_de_validation::text                             AS validation_code,
						  df.q2_4_officename::text                                AS facility_name,
						  df._submission_time::date                               AS _submission_time,
						  (SELECT 'csc'::TEXT AS form_types)                      AS form,
						  lead(df._index) OVER (ORDER BY df._index)               AS next,
						  lag(df._index) OVER (ORDER BY df._index)                AS prev,
						  COALESCE(rd.hash, df._version_)                         AS current_version,
						  COALESCE(MAX(rd.changed_at),
								   df._submission_time::TIMESTAMP WITH TIME ZONE) AS last_modified_at,
						  COALESCE(rd.changed_by, df._submitted_by)               AS last_modified_by
				   FROM csc.data df
							LEFT JOIN revisions.deltas rd
									  ON rd.hash = df._version_
										  AND rd.form = 'csc'::TEXT
										  AND rd.submission_index = df._index
				   GROUP BY df._id, df._index, rd.hash, rd.changed_by,
							df._validation_status, df.q2_4_officename,
							df.code_de_validation, df._submission_time,
							df._version_,
							df._submitted_by)
				  UNION
				  (SELECT df._id::double precision::integer                       AS _id,
						  df._index,
						  df._validation_status::text                             AS _validation_status,
						  df.q14_02_validation_code::text                         AS validation_code,
						  df.q1_12_officename::text                               AS facility_name,
						  df._submission_time,
						  (SELECT 'fosa'::TEXT AS form_types)                     AS form,
						  lead(df._index) OVER (ORDER BY df._index)               AS next,
						  lag(df._index) OVER (ORDER BY df._index)                AS prev,
						  COALESCE(rd.hash, df._version_)                         AS current_version,
						  COALESCE(MAX(rd.changed_at),
								   df._submission_time::TIMESTAMP WITH TIME ZONE) AS last_modified_at,
						  COALESCE(rd.changed_by, df._submitted_by)               AS last_modified_by
				   FROM fosa.data df
							LEFT JOIN revisions.deltas rd
									  ON rd.hash = df._version_
										  AND rd.form = 'fosa'::TEXT
										  AND rd.submission_index = df._index
				   GROUP BY df._id, df._index, rd.hash, rd.changed_by,
							df.q1_12_officename, df._validation_status,
							df.q14_02_validation_code, df._submission_time,
							df._version_, df._submitted_by)
				  UNION
				  SELECT df._id::double precision::integer                       AS _id,
						 df._index,
						 df._validation_status::text                             AS _validation_status,
						 df.q14_02_validation_code::text                         AS validation_code,
						 df.q1_12_officename::text                               AS facility_name,
						 df._submission_time,
						 (SELECT 'chefferie'::TEXT AS form_types)                AS form,
						 lead(df._index) OVER (ORDER BY df._index)               AS next,
						 lag(df._index) OVER (ORDER BY df._index)                AS prev,
						 COALESCE(rd.hash, df._version_)                         AS current_version,
						 COALESCE(MAX(rd.changed_at),
								  df._submission_time::TIMESTAMP WITH TIME ZONE) AS last_modified_at,
						 COALESCE(rd.changed_by, df._submitted_by)               AS last_modified_by
				  FROM chefferie.data df
						   LEFT JOIN revisions.deltas rd
									 ON rd.hash = df._version_
										 AND rd.form = 'chefferie'::TEXT
										 AND rd.submission_index = df._index
				  GROUP BY df._id, df._index, rd.hash, rd.changed_by,
						   df._validation_status, df.q1_12_officename,
						   df.q14_02_validation_code, df._submission_time,
						   df._version_, df._submitted_by) result
			ORDER BY last_modified_at DESC
		);