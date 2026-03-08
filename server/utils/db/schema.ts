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
	uuid,
	varchar
} from "drizzle-orm/pg-core";

export const datasets = pgTable('datasets', {
	title: text().notNull(),
	id: uuid().defaultRandom().primaryKey(),
	parentId: uuid('parent_id'),
	description: text(),
	key: text().notNull(),
	createdAt: timestamp('created_at', {
		mode: 'date',
		withTimezone: true
	}).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', {
		mode: 'date',
		withTimezone: true
	}).defaultNow().notNull().$onUpdate(() => new Date()),
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
	id: uuid().defaultRandom().notNull(),
	label: text().notNull(),
	value: text().notNull(),
	parentValue: text('parent_value'),
	dataset: uuid('dataset_id').notNull(),
	ordinal: integer().notNull(),
	createdAt: timestamp('created_at', {
		mode: 'date',
		withTimezone: true
	}).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', {
		mode: 'date',
		withTimezone: true
	}).notNull().defaultNow().$onUpdate(() => new Date()),
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

export const refType = pgEnum('dataset_ref_types', ['all', 'subset']);
export const datasetRefs = pgTable('dataset_refs', {
	slug: varchar({ length: 64 }).notNull().primaryKey(),
	type: refType().notNull().default('all'),
	inUse: boolean('in_use').default(false).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
	dataset: uuid().notNull()
}, t => [
	index().on(t.dataset),
	foreignKey({
		columns: [t.dataset],
		foreignColumns: [datasets.id]
	}).onDelete('cascade')
]);

export const datasetRefItems = pgTable('dataset_ref_items', {
	ref: text().notNull(),
	dataset: uuid('dataset_id').notNull(),
	itemId: uuid('item_id').notNull(),
}, t => [
	index().on(t.ref),
	index().on(t.itemId),
	index().on(t.dataset),
	index().on(t.dataset, t.itemId),
	index().on(t.ref, t.itemId),
	foreignKey({
		columns: [t.ref],
		foreignColumns: [datasetRefs.slug]
	}).onDelete('cascade'),
	foreignKey({
		columns: [t.dataset, t.itemId],
		foreignColumns: [datasetItems.dataset, datasetItems.id]
	}).onDelete('cascade')
]);

export const forms = pgTable('form_definitions', {
	slug: text().notNull(),
	logo: text(),
	title: text('label').notNull(),
	description: text(),
	createdBy: text('created_by'),
	archived: boolean().notNull().default(false),
	createdAt: timestamp('created_at', {
		mode: 'date',
		withTimezone: true
	}).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', {
		mode: 'date',
		withTimezone: true
	}).notNull().defaultNow().$onUpdate(() => new Date()),
}, t => [
	uniqueIndex().on(t.slug),
	index().on(t.title),
	index().on(t.description).where(isNotNull(t.description)),
	primaryKey({ columns: [t.slug] })
]);

export const formVersions = pgTable('form_versions', {
	id: uuid().notNull().defaultRandom(),
	form: text().notNull(),
	createdAt: timestamp('created_at', {
		mode: 'date',
		withTimezone: true
	}).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', {
		mode: 'date',
		withTimezone: true
	}).notNull().defaultNow().$onUpdate(() => new Date()),
	parentId: uuid('parent_id'),
	isCurrent: boolean('is_current').notNull().default(true),
	archivedAt: timestamp('archived_at', { mode: 'date', withTimezone: true })
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
	type: formItemType().notNull(),
	id: uuid().notNull().defaultRandom().primaryKey(),
	config: jsonb(),
	// dataKey: text('data_key'),
	tags: text().array().default([]),
}, t => [
	// index().on(t.dataKey).where(isNotNull(t.dataKey)),
]);

export const formVersionItems = pgTable('form_version_items', {
	itemId: uuid('item_id').notNull(),
	parentId: uuid('parent_id'),
	// parentPath: text('parent_path'),
	form: text().notNull(),
	formVersion: uuid('form_version').notNull(),
	path: text().notNull(),
	relevance: jsonb(),
	config: jsonb(),
	tags: text().array().default([]),
	id: uuid().notNull().defaultRandom(),
	addedAt: timestamp('added_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date())
}, t => [
	index().on(t.itemId),
	index().on(t.form),
	index().on(t.formVersion),

	index().on(t.path),
	index().on(t.parentId),
	foreignKey({
		columns: [t.formVersion, t.parentId],
		foreignColumns: [t.formVersion, t.id]
	}).onDelete('set null').onUpdate('cascade'),
	foreignKey({
		columns: [t.itemId],
		foreignColumns: [formItems.id]
	}).onDelete('cascade').onUpdate('cascade'),
	foreignKey({
		columns: [t.form],
		foreignColumns: [forms.slug]
	}).onDelete('cascade').onUpdate('cascade'),
	foreignKey({
		columns: [t.formVersion, t.form],
		foreignColumns: [formVersions.id, formVersions.form]
	}).onDelete('cascade').onUpdate('cascade'),
	primaryKey({
		columns: [t.formVersion, t.id]
	})
]);

export const formSubmissions = pgTable('form_submissions', {
	index: bigserial('_index', { mode: 'number' }).notNull(),
	recordedAt: timestamp('recorded_at', {
		mode: 'date',
		withTimezone: true
	}).notNull().defaultNow(),
	formVersion: uuid('form_version').notNull(),
	form: text().notNull(),
	archivedAt: timestamp('archived_at', { withTimezone: true }),
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
	changeNotes: text('change_notes').notNull(),
	// id: uuid().notNull().defaultRandom(),
	tag: text().notNull(),
	index: bigint('submission_index', { mode: 'number' }).notNull(),
	formVersion: uuid('form_version').notNull(),
	validationCode: text('validation_code').notNull(),
	recordedAt: timestamp('recorded_at', {
		mode: 'date',
		withTimezone: true
	}).notNull().defaultNow(),
	archivedAt: timestamp('archived_at', { withTimezone: true }),
	approvedAt: timestamp('approved_at', { withTimezone: true }),
	isCurrent: boolean('is_current').notNull().default(true),
	form: text().notNull(),
}, t => [
	index().on(t.validationCode),
	index().on(t.tag),
	index().on(t.form),
	index().on(t.index),
	index().on(t.formVersion),
	index().on(t.index, t.form),
	index().on(t.formVersion, t.form),
	primaryKey({
		columns: [t.tag, t.formVersion, t.index, t.form]
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
	submissionTag: text('submission_tag').notNull(),
	form: text().notNull(),
	value: text(),
}, t => [
	index().on(t.form),
	index().on(t.fieldId),
	index().on(t.formVersion),
	index().on(t.submissionTag),
	primaryKey({ columns: [t.submissionIndex, t.fieldId, t.formVersion, t.submissionTag] }),
	foreignKey({
		columns: [t.submissionTag, t.formVersion, t.submissionIndex, t.form],
		foreignColumns: [submissionVersions.tag, submissionVersions.formVersion, submissionVersions.index, submissionVersions.form]
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
			to: r.formItems.id.through(r.formVersionItems.itemId),
		}),
		submissions: r.many.formSubmissions({
			from: r.formVersions.id,
			to: r.formSubmissions.formVersion
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