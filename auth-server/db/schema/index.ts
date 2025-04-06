import {
	bigint,
	boolean,
	foreignKey,
	geometry,
	pgEnum,
	pgTable,
	primaryKey,
	real,
	serial,
	text,
	timestamp,
	uniqueIndex
} from 'drizzle-orm/pg-core';

// Enums
export const genders = pgEnum('genders', ['male', 'female']);
export const userRoles = pgEnum('user_roles', ['admin', 'employee', 'field_agent']);
export const localityType = pgEnum('locality_type', ['municipality', 'region', 'subdivision']);
export const formTypes = pgEnum('form_types', ['cec', 'fosa', 'chefferie']);

// Tables
export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	niu: text('niu').notNull(),
	cni: text('cni').notNull(),
	avatar: text('avatar'),
	givenNames: text('given_names'),
	lastName: text('last_name').notNull(),
	phone: text('phone').notNull(),
	email: text('email').notNull().unique(),
	role: userRoles('role').default('employee'),
	gender: genders('gender').notNull(),
	accessRevoked: boolean('access_revoked').default(false),
}, (table) => [
	uniqueIndex().on(table.niu, table.cni)
]);

export const accounts = pgTable('accounts', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	owner: bigint({ mode: 'number' }).references(() => users.id),
	shouldChangePassword: boolean('should_change_password').default(true),
});

export const userSessions = pgTable('user_sessions', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	ip: text('ip').notNull(),
	user: bigint({ mode: 'number' }).references(() => users.id),
	account: bigint({ mode: 'number' }).references(() => accounts.id),
});

export const localities = pgTable('localities', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
	location: geometry({mode: 'tuple', type: 'multipiont', }), // Using jsonb for geometry (PostGIS)
	type: localityType('type'),
	name: text('name').notNull(),
	description: text('description'),
	images: text('images').array(),
	parent: bigint({ mode: 'number' }),
}, t => [
	foreignKey({
		columns: [t.parent],
		foreignColumns: [t.id],
	}).onDelete('set null'),
]);

export const civilStatusCenters = pgTable('civil_status_centers', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	name: text('name').notNull(),
	images: text('images').array(),
	municipality: bigint({ mode: 'number' }).references(() => localities.id),
	location: geometry({ type: 'point', mode: 'tuple' }), // Point geometry
	addedBy: bigint({ mode: 'number' }).references(() => users.id),
});

export const equipment = pgTable('equipment', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	name: text('name').notNull().unique(),
	images: text('images').array(),
	description: text('description'),
	addedBy: bigint({ mode: 'number' }).references(() => users.id),
	lowerThreshold: real('lower_threshold').notNull(),
	upperThreshold: real('upper_threshold'),
});

export const equipmentUnits = pgTable('equipment_units', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	equipment: bigint({ mode: 'number' }).references(() => equipment.id),
	name: text('name').notNull().default('default'),
	scaleFactor: real('scaleFactor').notNull(),
});

export const equipmentFields = pgTable('equipment_fields', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	equipment: bigint({ mode: 'number' }).references(() => equipment.id),
	name: text('name').notNull(),
	value: text('value'),
	group: text('group'),
}, (table) => [
	uniqueIndex().on(table.equipment, table.name),
]);

export const inventories = pgTable('inventories', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	center: bigint({ mode: 'number' }).references(() => civilStatusCenters.id),
	createdBy: bigint({ mode: 'number' }).references(() => users.id),
	name: text('name').notNull(),
}, (table) => [
	uniqueIndex().on(table.name, table.center),
]);

export const inventoryItems = pgTable('inventory_items', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	addedBy: bigint({ mode: 'number' }).references(() => users.id),
	inventory: bigint({ mode: 'number' }).references(() => inventories.id),
	startingQuantity: real('starting_quantity').default(0),
	equipment: bigint({ mode: 'number' }).references(() => equipment.id),
});

export const inventoryMovements = pgTable('inventory_movements', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	quantity: real('quantity').notNull(),
	unit: bigint({ mode: 'number' }).references(() => equipmentUnits.id),
	item: bigint({ mode: 'number' }).references(() => inventoryItems.id),
	isInbound: boolean('is_inbound').notNull(),
	tags: text('tags').array().default([]),
	recordedBy: bigint({ mode: 'number' }).references(() => users.id),
});

export const inventoryItemFieldOverrides = pgTable('inventory_item_field_overrides', {
	inventoryItem: bigint({ mode: 'number' }).references(() => inventoryItems.id),
	field: bigint({ mode: 'number' }).references(() => equipmentFields.id),
	value: text('value'),
}, (table) => [primaryKey({ columns: [table.inventoryItem, table.field] })]);

export const formSubmissions = pgTable('form_submissions', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	type: formTypes('type').notNull(),
	center: bigint({ mode: 'number' }).references(() => civilStatusCenters.id),
	recordedBy: bigint({ mode: 'number' }).references(() => users.id),
	draft: boolean('draft').default(true),
});

export const submissionValues = pgTable('submission_values', {
	field: text('field').notNull(),
	submission: bigint({ mode: 'number' }).references(() => formSubmissions.id),
	value: text('value'),
}, (table) => [
	primaryKey({ columns: [table.field, table.submission] })
]);

export const properties = pgTable('properties', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	description: text('description'),
	name: text('name').notNull(),
});

export const propertyOptions = pgTable('property_options', {
	id: serial('id').primaryKey(),
	property: bigint({ mode: 'number' }).references(() => properties.id),
	code: text('code').notNull(),
	label: text('label'),
	group: text('group'),
}, (table) => ({
	propertyOptionUnique: uniqueIndex().on(table.property, table.code),
}));

export const propertyValues = pgTable('property_values', {
	id: serial('id').primaryKey(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	tableName: text('table_name').notNull(),
	property: bigint({ mode: 'number' }).references(() => properties.id),
	value: bigint({ mode: 'number' }).references(() => propertyOptions.id),
});