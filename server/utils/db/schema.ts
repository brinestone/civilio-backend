import { defineRelations, isNotNull, sql } from "drizzle-orm";
import {
	bigint,
	bigserial,
	boolean,
	foreignKey,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid
} from "drizzle-orm/pg-core";

// export const civilio = pgSchema("civilio").existing();

export const datasets = pgTable('datasets', {
	title: text().notNull(),
	id: uuid().defaultRandom().primaryKey(),
	parentId: uuid('parent_id'),
	description: text(),
	key: text().notNull(),
	createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
	index().on(t.parentId).where(isNotNull(t.parentId)),
	uniqueIndex().on(t.key),
	index('dataset_vector_search_idx').using(
		'gin',
		sql`(
		setweight(to_tsvector('simple', ${t.title}), 'A') ||
		setweight(to_tsvector('simple', ${t.key}), 'B') ||
		setweight(to_tsvector('simple', ${t.description}), 'C')
		)`
	),
	index('dataset_fuzzy_title_idx').using('gin', t.title.op('gin_trgm_ops')),
	index('dataset_fuzzy_description_idx').using('gin', t.description.op('gin_trgm_ops')).where(isNotNull(t.description)),
	index('dataset_fuzzy_key_idx').using('gin', t.key.op('gin_trgm_ops')),
	foreignKey({
		columns: [t.parentId],
		foreignColumns: [t.id]
	}).onUpdate('cascade').onDelete('set null'),
]);

export const datasetItems = pgTable('dataset_items', {
	id: uuid().defaultRandom(),
	label: text().notNull(),
	value: text().notNull(),
	parentValue: text('parent_value'),
	dataset: uuid('dataset_id').notNull(),
	ordinal: integer(),
	createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
}, t => [
	index('dataset_items_vector_idx').using('gin', sql`to_tsvector('simple', ${t.label})`),
	index('dataset_items_fuzzy_label_idx').using('gin', t.label.op('gin_trgm_ops')),
	index().on(t.parentValue).where(isNotNull(t.parentValue)),
	uniqueIndex().on(t.id),
	uniqueIndex().on(t.dataset, t.value),
	primaryKey({
		columns: [t.dataset, t.id]
	}),
	foreignKey({
		columns: [t.dataset],
		foreignColumns: [datasets.id]
	}).onDelete('cascade').onUpdate('cascade')
]);

// export const choices = pgTable(
// 	"choices",
// 	{
// 		name: text().notNull(),
// 		label: text().notNull(),
// 		parentValue: text('parent_value'),
// 		parentGroup: text('parent_key'),
// 		group: text().notNull(),
// 		i18NKey: text("i18n_key"),
// 		version: text().notNull(),
// 		description: text()
// 	},
// 	(table) => [
// 		primaryKey({
// 			columns: [table.name, table.group, table.version],
// 			name: "choices_pkey",
// 		}),
// 	],
// );

// export const fieldMappings = pgTable(
// 	"form_field_mappings",
// 	{
// 		field: text().notNull(),
// 		i18nKey: text("i18n_key"),
// 		dbColumn: text("db_column").notNull(),
// 		dbTable: text("db_table").notNull(),
// 		form: text().notNull(),
// 		dbColumnType: text("db_column_type").notNull(),
// 		aliasHash: text("alias_hash").generatedAlwaysAs(
// 			(): SQL => sql<string>`md5
// 				(${fieldMappings.field})`,
// 		),
// 	},
// 	(table) => [
// 		primaryKey({
// 			columns: [table.field, table.form],
// 			name: "field_db_column_db_table_form_pk",
// 		}),
// 	],
// );
// export const vwFormSubmissions = civilio
// 	.view("vw_submissions", {
// 		id: integer("_id"),
// 		index: integer("_index"),
// 		validationStatus: text("_validation_status"),
// 		validationCode: text("validation_code"),
// 		facilityName: text("facility_name"),
// 		submissionTime: date("_submission_time"),
// 		form: text(),
// 		next: integer(),
// 		prev: integer(),
// 		isValid: boolean("is_valid"),
// 		currentVersion: text('current_version'),
// 		lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }),
// 		lastModifiedBy: text("last_modified_by"),
// 	})
// 	.as(
// 		sql`
// 			SELECT _id,
// 				   _index,
// 				   _validation_status,
// 				   validation_code,
// 				   facility_name,
// 				   _submission_time,
// 				   form,
// 				   next,
// 				   prev,
// 				   lower(COALESCE(_validation_status, ''::text)) =
// 				   'validation_status_approved'::text AS is_valid,
// 				   current_version,
// 				   last_modified_at,
// 				   last_modified_by
// 			FROM ((SELECT df._id::double precision::integer                       AS _id,
// 						  df._index,
// 						  df._validation_status::text                             AS _validation_status,
// 						  df.code_de_validation::text                             AS validation_code,
// 						  df.q2_4_officename::text                                AS facility_name,
// 						  df._submission_time::date                               AS _submission_time,
// 						  (SELECT 'csc'::TEXT AS form_types)                      AS form,
// 						  lead(df._index) OVER (ORDER BY df._index)               AS next,
// 						  lag(df._index) OVER (ORDER BY df._index)                AS prev,
// 						  COALESCE(rd.hash, df._version_)                         AS current_version,
// 						  COALESCE(MAX(rd.changed_at),
// 								   df._submission_time::TIMESTAMP WITH TIME ZONE) AS last_modified_at,
// 						  COALESCE(rd.changed_by, df._submitted_by)               AS last_modified_by
// 				   FROM csc.data df
// 							LEFT JOIN revisions.deltas rd
// 									  ON rd.hash = df._version_
// 										  AND rd.form = 'csc'::TEXT
// 										  AND rd.submission_index = df._index
// 				   GROUP BY df._id, df._index, rd.hash, rd.changed_by,
// 							df._validation_status, df.q2_4_officename,
// 							df.code_de_validation, df._submission_time,
// 							df._version_,
// 							df._submitted_by)
// 				  UNION
// 				  (SELECT df._id::double precision::integer                       AS _id,
// 						  df._index,
// 						  df._validation_status::text                             AS _validation_status,
// 						  df.q14_02_validation_code::text                         AS validation_code,
// 						  df.q1_12_officename::text                               AS facility_name,
// 						  df._submission_time,
// 						  (SELECT 'fosa'::TEXT AS form_types)                     AS form,
// 						  lead(df._index) OVER (ORDER BY df._index)               AS next,
// 						  lag(df._index) OVER (ORDER BY df._index)                AS prev,
// 						  COALESCE(rd.hash, df._version_)                         AS current_version,
// 						  COALESCE(MAX(rd.changed_at),
// 								   df._submission_time::TIMESTAMP WITH TIME ZONE) AS last_modified_at,
// 						  COALESCE(rd.changed_by, df._submitted_by)               AS last_modified_by
// 				   FROM fosa.data df
// 							LEFT JOIN revisions.deltas rd
// 									  ON rd.hash = df._version_
// 										  AND rd.form = 'fosa'::TEXT
// 										  AND rd.submission_index = df._index
// 				   GROUP BY df._id, df._index, rd.hash, rd.changed_by,
// 							df.q1_12_officename, df._validation_status,
// 							df.q14_02_validation_code, df._submission_time,
// 							df._version_, df._submitted_by)
// 				  UNION
// 				  SELECT df._id::double precision::integer                       AS _id,
// 						 df._index,
// 						 df._validation_status::text                             AS _validation_status,
// 						 df.q14_02_validation_code::text                         AS validation_code,
// 						 df.q1_12_officename::text                               AS facility_name,
// 						 df._submission_time,
// 						 (SELECT 'chefferie'::TEXT AS form_types)                AS form,
// 						 lead(df._index) OVER (ORDER BY df._index)               AS next,
// 						 lag(df._index) OVER (ORDER BY df._index)                AS prev,
// 						 COALESCE(rd.hash, df._version_)                         AS current_version,
// 						 COALESCE(MAX(rd.changed_at),
// 								  df._submission_time::TIMESTAMP WITH TIME ZONE) AS last_modified_at,
// 						 COALESCE(rd.changed_by, df._submitted_by)               AS last_modified_by
// 				  FROM chefferie.data df
// 						   LEFT JOIN revisions.deltas rd
// 									 ON rd.hash = df._version_
// 										 AND rd.form = 'chefferie'::TEXT
// 										 AND rd.submission_index = df._index
// 				  GROUP BY df._id, df._index, rd.hash, rd.changed_by,
// 						   df._validation_status, df.q1_12_officename,
// 						   df.q14_02_validation_code, df._submission_time,
// 						   df._version_, df._submitted_by) result
// 			ORDER BY last_modified_at DESC
// 		`,
// 	);

// export const vwDbColumns = civilio
// 	.view("vw_db_columns", {
// 		name: text("column_name"),
// 		dataType: text("data_type"),
// 		tableName: text("table_name"),
// 		form: text("form"),
// 	})
// 	.as(
// 		sql`SELECT c.column_name,
// 				   c.data_type,
// 				   c.table_name,
// 				   CAST(c.table_schema as text) as form
// 			FROM information_schema.columns c
// 		`,
// 	);

// export const vwFacilities = view("vw_facilities", {
// 	facilityName: text("facility_name"),
// 	index: integer('index'),
// 	type: text('form'),
// 	location: text('location'),
// 	coords: text('gps_coordinates'),
// 	extraInfo: jsonb('extra_info'),
// 	approved: boolean('approved'),
// 	createdAt: date('created_at', { mode: 'date' })
// }).as(sql`
// 	SELECT UPPER(info.facility_name) AS facility_name,
// 		   info.index,
// 		   info.form,
// 		   UPPER(info.location)      AS location,
// 		   info.gps_coordinates,
// 		   validated                 AS approved,
// 		   extra_info,
// 		   created_at
// 	FROM (SELECT c._index                                    as index,
// 				 'csc'::TEXT                                 as form,
// 				 c.q2_4_officename                           as facility_name,
// 				 CONCAT_WS(' - ', mu_ch.label, mu_div.label) as location,
// 				 c.q2_12_gps_coordinates                     as gps_coordinates,
// 				 COALESCE(c._validation_status = 'validation_status_approved',
// 						  false)                             as validated,
// 				 jsonb_build_object(
// 					 'milieu', mil.label,
// 					 'is_functional',
// 					 COALESCE(c.q2_10_fonctionnel = '1', false),
// 					 'degree', deg_o.label,
// 					 'is_chiefdom', COALESCE(c.q2_1a_chefferie = '1', false),
// 					 'size', COALESCE(c_size.label, c.q2_06_taille_commune),
// 					 'village_count', COALESCE(v_counts.village_count, 0),
// 					 'employee_count', COALESCE(em_counts.employee_count, 1),
// 					 'equipment',
// 					 (
// 						 COALESCE(c.q6_01_computers::DOUBLE PRECISION::INTEGER,
// 								  0) +
// 						 COALESCE(c.q6_02_serveurs::DOUBLE PRECISION::INTEGER,
// 								  0) +
// 						 COALESCE(c.q6_03_printers::DOUBLE PRECISION::INTEGER,
// 								  0) +
// 						 COALESCE(c.q6_4_scanners::DOUBLE PRECISION::INTEGER,
// 								  0) +
// 						 COALESCE(c.q6_5_onduleur::DOUBLE PRECISION::INTEGER,
// 								  0) +
// 						 COALESCE(c.q6_6_climatiseur::DOUBLE PRECISION::INTEGER,
// 								  0) +
// 						 COALESCE(c.q6_7_ventilateur::DOUBLE PRECISION::INTEGER,
// 								  0) +
// 						 COALESCE(
// 							 c.q6_9_tablea_bureau::DOUBLE PRECISION::INTEGER,
// 							 0) +
// 						 COALESCE(c.q6_10_chaise::DOUBLE PRECISION::INTEGER,
// 								  0) +
// 						 COALESCE(c.q6_12_car::DOUBLE PRECISION::INTEGER, 0) +
// 						 COALESCE(c.q9_13_moto::DOUBLE PRECISION::INTEGER, 0)
// 						 ),
// 					 'has_internet', COALESCE(
// 						 c.q4_12_batiment_connecte::DOUBLE PRECISION::INTEGER =
// 						 1,
// 						 false),
// 					 'has_power', COALESCE(
// 						 c.q4_02_reseau_electrique::DOUBLE PRECISION::INTEGER =
// 						 1 OR
// 						 c.q4_5_autre_source::DOUBLE PRECISION::INTEGER = 1,
// 						 false),
// 					 'has_water',
// 					 COALESCE(c.q4_7alimentation_eau::TEXT NOT IN ('1'), false)
// 				 )                                           as extra_info,
// 				 c.q0_06_date_creation                       AS created_at
// 		  FROM csc.data c
// 				   LEFT JOIN (SELECT _parent_index, COUNT(*) AS employee_count
// 							  FROM csc.data_personnel
// 							  GROUP BY _parent_index) em_counts
// 							 ON em_counts._parent_index = c._index
// 				   LEFT JOIN (SELECT _parent_index, COUNT(*) AS village_count
// 							  FROM csc.data_villages
// 							  GROUP BY _parent_index) v_counts
// 							 ON v_counts._parent_index = c._index
// 				   LEFT JOIN choices c_size
// 							 ON c_size."group" = 'pq1hw83' AND
// 								c_size.version = 'csc' AND
// 								c_size.name = c.q2_06_taille_commune
// 				   LEFT JOIN choices mil
// 							 ON mil."group" = 'vb2qk85' AND
// 								mil.version = 'csc' AND
// 								mil.name = c.milieu::TEXT
// 				   LEFT JOIN choices deg_o
// 							 ON deg_o."group" = 'sl95o71' AND
// 								deg_o.version = 'csc' AND deg_o.name = c.degr::TEXT
// 				   LEFT JOIN choices mu_div
// 							 ON mu_div."group" = 'division' AND
// 								mu_div.name = c.q2_01_division::TEXT AND
// 								mu_div.version = 'csc'
// 				   LEFT JOIN choices mu_ch
// 							 ON mu_ch."group" = 'commune' AND
// 								mu_ch.name = c.q2_02_municipality::TEXT AND
// 								mu_ch.version = 'csc' AND
// 								mu_ch.parent = c.q2_01_division::TEXT
// 		  UNION
// 		  SELECT c._index,
// 				 'fosa'::TEXT                                as form,
// 				 c.q1_12_officename                          as facility_name,
// 				 CONCAT_WS(' - ', mu_ch.label, mu_div.label) as location,
// 				 c.q1_13_gps_coordinates                     as gps_coordinates,
// 				 COALESCE(c._validation_status = 'validation_status_approved',
// 						  false)                             as validated,
// 				 jsonb_build_object(
// 					 'milieu', ml.label,
// 					 'health_area', mha.label,
// 					 'health_district', mda.label,
// 					 'category',
// 					 COALESCE(NULLIF(TRIM(BOTH ' ' FROM c.autre_cat_gorie), ''),
// 							  c_cat.label),
// 					 'status', c_status.label,
// 					 'employee_count', COALESCE(em_counts.employee_count, 1),
// 					 'has_internet', COALESCE(
// 						 c.q7_08_broadband_conn_available::DOUBLE PRECISION::INTEGER =
// 						 1, false),
// 					 'has_power', COALESCE(
// 						 c.q7_01_facility_conn_power_grid::DOUBLE PRECISION::INTEGER =
// 						 1,
// 						 c.q7_04_any_source_of_backup::DOUBLE PRECISION::INTEGER =
// 						 1,
// 						 false),
// 					 'has_water', COALESCE(
// 						 c.q6_09aalimentation_eau::DOUBLE PRECISION::INTEGER =
// 						 1,
// 						 false),
// 					 'equipment', (
// 						 COALESCE(c.q9_02_computers, 0) +
// 						 COALESCE(c.q9_03_printers, 0) +
// 						 COALESCE(c.q9_04_tablets, 0) +
// 						 COALESCE(c.q9_10_car, 0) +
// 						 COALESCE(c.q9_11_mopeds, 0)
// 						 ),
// 					 'stats_l_5', jsonb_build_object('births',
// 													 COALESCE(group_ce1sz98_ligne_colonne, 0) +
// 													 COALESCE(group_ce1sz98_ligne_1_colonne, 0) +
// 													 COALESCE(group_ce1sz98_ligne_2_colonne, 0) +
// 													 COALESCE(group_ce1sz98_ligne_3_colonne, 0) +
// 													 COALESCE(group_ce1sz98_ligne_4_colonne, 0),
// 													 'deaths',
// 													 COALESCE(group_ce1sz98_ligne_colonne_1, 0) +
// 													 COALESCE(group_ce1sz98_ligne_1_colonne_1, 0) +
// 													 COALESCE(group_ce1sz98_ligne_2_colonne_1, 0) +
// 													 COALESCE(group_ce1sz98_ligne_3_colonne_1, 0) +
// 													 COALESCE(group_ce1sz98_ligne_4_colonne_1, 0)
// 								  )
// 				 )                                           AS extra_info,
// 				 c.q0_06_date_creation                       AS created_at
// 		  FROM fosa.data c
// 				   LEFT JOIN (SELECT _parent_index, COUNT(*) AS employee_count
// 							  FROM fosa.data_personnel
// 							  GROUP BY _parent_index) em_counts
// 							 ON em_counts._parent_index = c._index
// 				   LEFT JOIN choices c_status
// 							 ON c_status."group" = 'qy7we33' AND
// 								c_status.name = c.statut_de_la_fosa::TEXT AND
// 								c_status.version = 'fosa'
// 				   LEFT JOIN choices c_cat
// 							 ON c_cat."group" = 'pa9ii12' AND
// 								c_cat.name =
// 								c.q1_07_type_healt_facility::TEXT AND
// 								c_cat.version = 'fosa'
// 				   LEFT JOIN choices mda
// 							 ON mda."group" = 'district' AND
// 								mda.name = c.ds_rattachement::TEXT AND
// 								mda.version = 'fosa'
// 				   LEFT JOIN choices mha
// 							 ON mha."group" = 'airesante' AND
// 								mha.name =
// 								c.as_rattachement::TEXT AND
// 								mha.version = 'fosa' AND
// 								mha.parent =
// 								c.ds_rattachement::TEXT
// 				   LEFT JOIN choices ml
// 							 ON ml."group" = 'vb2qk85' AND
// 								ml.name = c.milieu::TEXT AND ml.version = 'fosa'
// 				   LEFT JOIN choices mu_div
// 							 ON mu_div."group" = 'division' AND
// 								mu_div.name = c.q1_02_division::TEXT AND
// 								mu_div.version = 'fosa'
// 				   LEFT JOIN choices mu_ch
// 							 ON mu_ch."group" = 'commune' AND
// 								mu_ch.name = c.q1_03_municipality::TEXT AND
// 								mu_ch.version = 'fosa' AND
// 								mu_ch.parent = c.q1_02_division::TEXT
// 		  UNION
// 		  SELECT c._index,
// 				 'chefferie'::TEXT                           as form,
// 				 c.q1_12_officename                          as facility_name,
// 				 CONCAT_WS(' - ', mu_ch.label, mu_div.label) as location,
// 				 c.q1_13_gps_coordinates                     as gps_coordinates,
// 				 COALESCE(c._validation_status = 'validation_status_approved',
// 						  false)                             as validated,
// 				 jsonb_build_object(
// 					 'degree', c_deg.label,
// 					 'equipment', (COALESCE(c.q9_02_computers, 0) +
// 								   COALESCE(c.q9_03_printers, 0) +
// 								   COALESCE(c.q9_04_tablets, 0) +
// 								   COALESCE(c.q9_10_car, 0) +
// 								   COALESCE(c.q9_11_mopeds, 0)),
// 					 'has_internet', COALESCE(
// 						 c.q4_02_broadband_conn_available::DOUBLE PRECISION::INTEGER =
// 						 1, false),
// 					 'has_water', COALESCE(
// 						 c.q6_09aalimentation_eau::DOUBLE PRECISION::INTEGER =
// 						 1,
// 						 false),
// 					 'has_power',
// 					 COALESCE(
// 						 c.q4_04_electricite::DOUBLE PRECISION::INTEGER = 1,
// 						 false),
// 					 'employee_count', employee_count
// 				 )                                           AS extra_info,
// 				 c.q0_06_date_creation                       AS created_at
// 		  FROM chefferie.data c
// 				   LEFT JOIN (SELECT _parent_index, COUNT(*) AS employee_count
// 							  FROM chefferie.data_personnel
// 							  GROUP BY _parent_index) em_counts
// 							 ON em_counts._parent_index = c._index
// 				   LEFT JOIN choices c_deg
// 							 ON c_deg."group" = 'vb2qk85' AND
// 								c_deg.name = c.degre::TEXT AND
// 								c_deg.version = 'chefferie'
// 				   LEFT JOIN choices mu_div
// 							 ON mu_div."group" = 'division' AND
// 								mu_div.name = c.q1_02_division::TEXT AND
// 								mu_div.version = 'chefferie'
// 				   LEFT JOIN choices mu_ch
// 							 ON mu_ch."group" = 'commune' AND
// 								mu_ch.name = c.q1_03_municipality::TEXT AND
// 								mu_ch.version = 'chefferie' AND
// 								mu_ch.parent =
// 								c.q1_02_division::TEXT) AS info
// `);

export const forms = pgTable('form_definitions', {
	slug: text().notNull(),
	logo: text(),
	label: text().notNull(),
	description: text(),
	createdBy: text('created_by'),
	createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
}, t => [
	uniqueIndex().on(t.slug),
	index().on(t.label),
	index().on(t.description).where(isNotNull(t.description)),
	primaryKey({ columns: [t.slug] })
]);

export const formVersions = pgTable('form_versions', {
	id: uuid().notNull().defaultRandom(),
	form: text().notNull(),
	createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
	parentId: uuid('parent_id'),
	isCurrent: boolean('is_current').notNull().default(true),
}, t => [
	primaryKey({ columns: [t.id, t.form] }),
	foreignKey({
		columns: [t.parentId, t.form],
		foreignColumns: [t.id, t.form]
	}).onDelete('set null')
		.onUpdate('cascade'),
	foreignKey({
		columns: [t.form],
		foreignColumns: [forms.slug]
	}).onDelete('cascade')
		.onUpdate('cascade'),
	index().on(t.form),
	index().on(t.parentId).where(isNotNull(t.parentId))
]);

export const formItemType = pgEnum('form_item_type', ['field', 'note', 'image', 'group', 'list', 'separator']);
export const formItems = pgTable('form_items', {
	title: text().notNull(),
	description: text(),
	type: formItemType().notNull(),
	relevance: jsonb(),
	id: uuid().notNull().defaultRandom().primaryKey(),
	meta: jsonb(),
	position: integer().notNull()
}, t => [
	index().on(t.title),
	index().on(t.description).where(isNotNull(t.description)),
]);

export const formVersionItems = pgTable('form_version_items', {
	itemId: uuid('item_id').notNull(),
	form: text().notNull(),
	formVersion: uuid('form_version').notNull(),
	parentId: uuid('parent_id'),
	meta: jsonb(),
}, t => [
	index().on(t.itemId),
	index().on(t.form),
	index().on(t.formVersion),
	foreignKey({
		columns: [t.itemId],
		foreignColumns: [formItems.id]
	}).onDelete('cascade').onUpdate('cascade'),
	foreignKey({
		columns: [t.formVersion, t.parentId],
		foreignColumns: [t.formVersion, t.itemId],
	}).onDelete('set null'),
	index().on(t.parentId).where(isNotNull(t.parentId)),
	foreignKey({
		columns: [t.form],
		foreignColumns: [forms.slug]
	}).onDelete('cascade').onUpdate('cascade'),
	foreignKey({
		columns: [t.formVersion, t.form],
		foreignColumns: [formVersions.id, formVersions.form]
	}).onDelete('cascade').onUpdate('cascade'),
	primaryKey({
		columns: [t.formVersion, t.itemId]
	})
]);

export const formSubmissions = pgTable('form_submissions', {
	index: bigserial('_index', { mode: 'number' }).notNull(),
	recordedAt: timestamp('recorded_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
	formVersion: uuid('form_version').notNull(),
	form: text().notNull()
}, t => [
	index().on(t.form),
	index().on(t.formVersion),
	index().on(t.form, t.formVersion),
	primaryKey({ columns: [t.index, t.form] }),
	foreignKey({
		columns: [t.formVersion, t.form],
		foreignColumns: [formVersions.id, formVersions.form]
	}).onDelete('cascade').onUpdate('cascade'),
	foreignKey({
		columns: [t.form],
		foreignColumns: [forms.slug]
	}).onDelete('cascade').onUpdate('cascade')
]);

export const submissionVersions = pgTable('submission_versions', {
	id: uuid().notNull().defaultRandom(),
	index: bigint('submission_index', { mode: 'number' }).notNull(),
	formVersion: uuid('form_version').notNull(),
	validationCode: text('validation_code').notNull(),
	recordedAt: timestamp('recorded_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
	approvedAt: timestamp('approved_at', { withTimezone: true }),
	isCurrent: boolean('is_current').notNull().default(true),
	form: text().notNull(),
}, t => [
	index().on(t.validationCode),
	index().on(t.form),
	index().on(t.index),
	index().on(t.formVersion),
	index().on(t.index, t.form),
	index().on(t.formVersion, t.form),
	primaryKey({
		columns: [t.id, t.formVersion, t.index, t.form]
	}),
	foreignKey({
		columns: [t.index, t.form],
		foreignColumns: [formSubmissions.index, formSubmissions.form]
	}).onDelete('cascade').onUpdate('cascade'),
	foreignKey({
		columns: [t.formVersion, t.form],
		foreignColumns: [formVersions.id, formVersions.form]
	}).onUpdate('cascade').onDelete('cascade'),
	foreignKey({
		columns: [t.form],
		foreignColumns: [forms.slug]
	}).onUpdate('cascade')
]);

export const submissionResponses = pgTable('submission_responses', {
	submissionIndex: bigint('submission_index', { mode: 'number' }).notNull(),
	fieldId: uuid('field_id').notNull(),
	formVersion: uuid('form_version').notNull(),
	submissionVersionId: uuid('response_id').notNull(),
	form: text().notNull(),
	value: text(),
}, t => [
	index().on(t.form),
	index().on(t.fieldId),
	index().on(t.formVersion),
	index().on(t.submissionVersionId),
	primaryKey({ columns: [t.submissionIndex, t.fieldId, t.formVersion, t.submissionVersionId] }),
	foreignKey({
		columns: [t.submissionVersionId, t.formVersion, t.submissionIndex, t.form],
		foreignColumns: [submissionVersions.id, submissionVersions.formVersion, submissionVersions.index, submissionVersions.form]
	}).onDelete('cascade'),
	foreignKey({
		columns: [t.fieldId],
		foreignColumns: [formItems.id]
	}).onDelete('cascade')
		.onUpdate('cascade'),
	foreignKey({
		columns: [t.form],
		foreignColumns: [forms.slug]
	}).onUpdate('cascade'),
]);

export const relations = defineRelations({
	formDefinitions: forms,
	formVersions,
	formItems,
	formSubmissions,
	formVersionItems,
	submissionVersions,
	submissionResponses,
	datasets,
	datasetItems,
}, r => ({
	datasets: {
		items: r.many.datasetItems({
			from: r.datasets.id,
			to: r.datasetItems.dataset
		}),
		parent: r.one.datasets({
			optional: true,
			from: r.datasets.parentId,
			to: r.datasets.id
		})
	},
	datasetItems: {
		parentDataset: r.one.datasets({
			from: r.datasetItems.dataset,
			to: r.datasets.id,
			optional: true,
		})
	},
	formDefinitions: {
		versions: r.many.formVersions({
			from: r.formDefinitions.slug,
			to: r.formVersions.form
		}),
		currentVersion: r.one.formVersions({
			from: r.formDefinitions.slug,
			to: r.formVersions.form,
			optional: true,
			where: {
				isCurrent: true
			},
		}),
	},
	formVersions: {
		formRef: r.one.formDefinitions({
			from: r.formVersions.form,
			to: r.formDefinitions.slug,
		}),
		parent: r.one.formVersions({
			from: r.formVersions.parentId,
			to: r.formVersions.id,
			optional: true,
		}),
		items: r.many.formItems({
			from: r.formVersions.id.through(r.formVersionItems.formVersion),
			to: r.formItems.id.through(r.formVersionItems.itemId)
		}),
		submissions: r.many.formSubmissions({
			from: r.formVersions.id,
			to: r.formSubmissions.formVersion
		})
	},
	formItems: {
		children: r.many.formItems({
			from: r.formItems.id.through(r.formVersionItems.itemId),
			to: r.formItems.id.through(r.formVersionItems.parentId)
		}),
		parent: r.one.formItems({
			from: r.formItems.id.through(r.formVersionItems.parentId),
			to: r.formItems.id.through(r.formVersionItems.itemId),
			optional: true
		})
	},
	formSubmissions: {
		versions: r.many.submissionVersions({
			from: [r.formSubmissions.formVersion, r.formSubmissions.index, r.formSubmissions.form],
			to: [r.submissionVersions.formVersion, r.submissionVersions.index, r.submissionVersions.form],
		}),
		currentVersion: r.one.submissionVersions({
			from: [r.formSubmissions.formVersion, r.formSubmissions.index, r.formSubmissions.form],
			to: [r.submissionVersions.formVersion, r.submissionVersions.index, r.submissionVersions.form],
			optional: true,
			where: {
				isCurrent: true
			}
		})
	}
}));