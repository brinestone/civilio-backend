CREATE TYPE "civilio"."expression_operators" AS ENUM ('and', 'or');--> statement-breakpoint
CREATE TYPE "revisions"."change_op" AS ENUM ('INSERT', 'DELETE', 'UPDATE', 'REVERT');--> statement-breakpoint
CREATE TYPE "civilio"."relevance_operators" AS ENUM ('==', '>=', '<=', '>', '<', 'selected');--> statement-breakpoint
CREATE TYPE "revisions"."sync_status" AS ENUM ('pending', 'synced', 'failed');--> statement-breakpoint
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
CREATE TABLE IF NOT EXISTS "revisions"."ledger"
(
    "hash"             text                     NOT NULL,
    "form"             text                     NOT NULL,
    "timestamp"        timestamp with time zone NOT NULL,
    "submission_index" integer                  NOT NULL,
    "notes"            text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "civilio"."choices"
(
    "name"     text,
    "label"    text NOT NULL,
    "parent"   text,
    "group"    text,
    "i18n_key" text,
    "version"  text,
    CONSTRAINT "choices_pkey" PRIMARY KEY ("name", "group", "version")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "revisions"."deltas"
(
    "hash"             text,
    "submission_index" integer,
    "index"            integer,
    "form"             text,
    "table_name"       text,
    "changed_at"       timestamp with time zone  DEFAULT now() NOT NULL,
    "delta_data"       jsonb                                   NOT NULL,
    "changed_by"       text,
    "op"               "revisions"."change_op"                 NOT NULL,
    "parent"           text,
    "sync_status"      "revisions"."sync_status" DEFAULT 'pending'::"revisions"."sync_status",
    CONSTRAINT "deltas_pkey" PRIMARY KEY ("hash", "submission_index", "index", "form", "table_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "civilio"."form_field_mappings"
(
    "field"          text,
    "i18n_key"       text,
    "db_column"      text NOT NULL,
    "db_table"       text NOT NULL,
    "form"           text,
    "db_column_type" text NOT NULL,
    "alias_hash"     text GENERATED ALWAYS AS (md5
                                               ("civilio"."form_field_mappings"."field")) STORED,
    CONSTRAINT "field_db_column_db_table_form_pk" PRIMARY KEY ("field", "form")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "civilio"."forms"
(
    "name"        text PRIMARY KEY UNIQUE,
    "icon"        text,
    "label"       text                    NOT NULL,
    "description" text,
    "created_by"  text,
    "created_at"  timestamp DEFAULT now() NOT NULL,
    "updated_at"  timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "civilio"."form_fields"
(
    "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "created_at"   timestamp        DEFAULT now() NOT NULL,
    "updated_at"   timestamp        DEFAULT now() NOT NULL,
    "form_name"    text                           NOT NULL,
    "readonly"     boolean          DEFAULT false,
    "title"        text                           NOT NULL,
    "t_translated" text,
    "description"  text,
    "d_translated" text,
    "sectionKey"   text                           NOT NULL,
    "span"         integer          DEFAULT 12
);
--> statement-breakpoint
CREATE TABLE "civilio"."relevance_conditions"
(
    "operator"    "civilio"."expression_operators" NOT NULL,
    "expressions" uuid[] DEFAULT '{}'::uuid[]
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "civilio"."relevance_expressions"
(
    "field"    uuid                            NOT NULL,
    "operator" "civilio"."relevance_operators" NOT NULL,
    "value"    text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ledger_hash_form_submission_index_index" ON "revisions"."ledger" ("hash", "form", "submission_index");--> statement-breakpoint
CREATE INDEX "deltas_hash_index" ON "revisions"."deltas" ("hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deltas_submission_index_index" ON "revisions"."deltas" ("submission_index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deltas_index_index" ON "revisions"."deltas" ("index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deltas_form_index" ON "revisions"."deltas" ("form");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deltas_changed_at_index" ON "revisions"."deltas" ("changed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deltas_parent_index" ON "revisions"."deltas" ("parent") WHERE ("parent" is not null);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deltas_parent_hash_index" ON "revisions"."deltas" ("parent", "hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deltas_submission_index_form_changed_at_index" ON "revisions"."deltas" ("submission_index", "form", "changed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "forms_name_index" ON "civilio"."forms" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "forms_label_index" ON "civilio"."forms" ("label");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "forms_description_index" ON "civilio"."forms" ("description") WHERE ("description" is not null);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "form_fields_form_name_index" ON "civilio"."form_fields" ("form_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "form_fields_title_index" ON "civilio"."form_fields" ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "form_fields_description_index" ON "civilio"."form_fields" ("description") WHERE ("description" is not null);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "form_fields_t_translated_index" ON "civilio"."form_fields" ("t_translated") WHERE ("description" is not null);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "form_fields_d_translated_index" ON "civilio"."form_fields" ("d_translated") WHERE ("description" is not null);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "form_fields_sectionKey_index" ON "civilio"."form_fields" ("sectionKey");--> statement-breakpoint
ALTER TABLE "civilio"."form_fields"
    ADD CONSTRAINT "form_fields_form_name_forms_name_fkey" FOREIGN KEY ("form_name") REFERENCES "civilio"."forms" ("name") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "civilio"."relevance_expressions"
    ADD CONSTRAINT "relevance_expressions_field_form_fields_id_fkey" FOREIGN KEY ("field") REFERENCES "civilio"."form_fields" ("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE VIEW "civilio"."vw_db_columns" AS
(
SELECT c.column_name,
       c.data_type,
       c.table_name,
       CAST(c.table_schema as text) as form
FROM information_schema.columns c
    );
--> statement-breakpoint
CREATE VIEW "civilio"."vw_facilities" AS
(
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
                     'is_functional', COALESCE(c.q2_10_fonctionnel = '1', false),
                     'degree', deg_o.label,
                     'is_chiefdom', COALESCE(c.q2_1a_chefferie = '1', false),
                     'size', COALESCE(c_size.label, c.q2_06_taille_commune),
                     'village_count', COALESCE(v_counts.village_count, 0),
                     'employee_count', COALESCE(em_counts.employee_count, 1),
                     'equipment',
                     (
                         COALESCE(c.q6_01_computers::DOUBLE PRECISION::INTEGER, 0) +
                         COALESCE(c.q6_02_serveurs::DOUBLE PRECISION::INTEGER, 0) +
                         COALESCE(c.q6_03_printers::DOUBLE PRECISION::INTEGER, 0) +
                         COALESCE(c.q6_4_scanners::DOUBLE PRECISION::INTEGER, 0) +
                         COALESCE(c.q6_5_onduleur::DOUBLE PRECISION::INTEGER, 0) +
                         COALESCE(c.q6_6_climatiseur::DOUBLE PRECISION::INTEGER, 0) +
                         COALESCE(c.q6_7_ventilateur::DOUBLE PRECISION::INTEGER, 0) +
                         COALESCE(c.q6_9_tablea_bureau::DOUBLE PRECISION::INTEGER,
                                  0) +
                         COALESCE(c.q6_10_chaise::DOUBLE PRECISION::INTEGER, 0) +
                         COALESCE(c.q6_12_car::DOUBLE PRECISION::INTEGER, 0) +
                         COALESCE(c.q9_13_moto::DOUBLE PRECISION::INTEGER, 0)
                         ),
                     'has_internet', COALESCE(
                             c.q4_12_batiment_connecte::DOUBLE PRECISION::INTEGER = 1,
                             false),
                     'has_power', COALESCE(
                             c.q4_02_reseau_electrique::DOUBLE PRECISION::INTEGER = 1 OR
                             c.q4_5_autre_source::DOUBLE PRECISION::INTEGER = 1, false),
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
                         ON mil."group" = 'vb2qk85' AND mil.version = 'csc' AND
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
                             c.q7_04_any_source_of_backup::DOUBLE PRECISION::INTEGER = 1,
                             false),
                     'has_water', COALESCE(
                             c.q6_09aalimentation_eau::DOUBLE PRECISION::INTEGER = 1,
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
                            c_cat.name = c.q1_07_type_healt_facility::TEXT AND
                            c_cat.version = 'fosa'
               LEFT JOIN civilio.choices mda
                         ON mda."group" = 'district' AND
                            mda.name = c.ds_rattachement::TEXT AND
                            mda.version = 'fosa'
               LEFT JOIN civilio.choices mha ON mha."group" = 'airesante' AND
                                                mha.name =
                                                c.as_rattachement::TEXT AND
                                                mha.version = 'fosa' AND
                                                mha.parent = c.ds_rattachement::TEXT
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
                             c.q6_09aalimentation_eau::DOUBLE PRECISION::INTEGER = 1,
                             false),
                     'has_power',
                     COALESCE(c.q4_04_electricite::DOUBLE PRECISION::INTEGER = 1,
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
                            mu_ch.parent = c.q1_02_division::TEXT) AS info
    );
--> statement-breakpoint
CREATE VIEW "civilio"."vw_submissions" AS
(
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
                LEFT JOIN revisions.deltas rd ON rd.hash = df._version_
           AND rd.form = 'csc'::TEXT
           AND rd.submission_index = df._index
       GROUP BY df._id, df._index, rd.hash, rd.changed_by,
                df._validation_status, df.q2_4_officename,
                df.code_de_validation, df._submission_time, df._version_,
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
                LEFT JOIN revisions.deltas rd ON rd.hash = df._version_
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
               LEFT JOIN revisions.deltas rd ON rd.hash = df._version_
          AND rd.form = 'chefferie'::TEXT
          AND rd.submission_index = df._index
      GROUP BY df._id, df._index, rd.hash, rd.changed_by,
               df._validation_status, df.q1_12_officename,
               df.q14_02_validation_code, df._submission_time,
               df._version_, df._submitted_by) result
ORDER BY last_modified_at DESC
    );