import { relations } from "drizzle-orm";
import { boolean, foreignKey, geometry, integer, pgEnum, pgTable, real, text, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

export const administrativeUnitTypes = pgEnum("administrative_unit_types", ['region', 'subdivision', 'municipality'])
export const userRoles = pgEnum("user_roles", ['admin', 'user']);

export const jwks = pgTable('jwks', {
	id: text().primaryKey().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	publicKey: text().notNull(),
	privateKey: text().notNull(),
});

export const variables = pgTable("variables", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: varchar().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique().on(table.code),
]);

export const centerInventories = pgTable("center_inventories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	center: uuid().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.center],
		foreignColumns: [civilStatusCenters.id],
	}),
]);

export const equipment = pgTable("equipment", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	images: text().array(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const inventoryItems = pgTable("inventory_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	equipment: uuid().notNull(),
	inventory: uuid().notNull(),
	startingQuantity: real().default(0),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	minThreshold: real(),
	maxThreshold: real(),
	addedBy: text().notNull(),
	lastUpdatedBy: text().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.equipment],
		foreignColumns: [equipment.id],
	}),
	foreignKey({
		columns: [table.inventory],
		foreignColumns: [centerInventories.id],
	}),
	foreignKey({
		columns: [table.addedBy],
		foreignColumns: [user.id],
	}),
	foreignKey({
		columns: [table.lastUpdatedBy],
		foreignColumns: [user.id],
	}),
]);

export const inventoryMovements = pgTable("inventory_movements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	item: uuid().notNull(),
	quantity: real().notNull(),
	outMovement: boolean().default(false),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	recordedBy: text().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.item],
		foreignColumns: [inventoryItems.id],
	}),
	foreignKey({
		columns: [table.recordedBy],
		foreignColumns: [user.id],
	}),
]);

export const civilStatusCenters = pgTable("civil_status_centers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	images: text().array(),
	municipality: uuid().notNull(),
	location: geometry({ type: "point" }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.municipality],
		foreignColumns: [administrativeUnits.id],
	}),
]);

export const administrativeUnits = pgTable("administrative_units", {
	parent: uuid(),
	type: administrativeUnitTypes().notNull(),
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	location: geometry({ type: "point" }),
	images: text().array(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.parent],
		foreignColumns: [table.id],
	}),
]);

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	username: text().unique(undefined, { nulls: 'not distinct' }),
	email: text().notNull().unique(),
	displayUsername: text(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	role: userRoles().default('user').notNull(),
	banned: boolean().default(false),
	banReason: text(),
	banExpires: integer()
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	impersonatedBy: text().references(() => user.id, { onDelete: 'set null' }),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
});


export const centerInventoriesRelations = relations(centerInventories, ({ one, many }) => ({
	civilStatusCenter: one(civilStatusCenters, {
		fields: [centerInventories.center],
		references: [civilStatusCenters.id]
	}),
	inventoryItems: many(inventoryItems),
}));

export const civilStatusCentersRelations = relations(civilStatusCenters, ({ one, many }) => ({
	centerInventories: many(centerInventories),
	administrativeUnit: one(administrativeUnits, {
		fields: [civilStatusCenters.municipality],
		references: [administrativeUnits.id]
	}),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
	equipment: one(equipment, {
		fields: [inventoryItems.equipment],
		references: [equipment.id]
	}),
	centerInventory: one(centerInventories, {
		fields: [inventoryItems.inventory],
		references: [centerInventories.id]
	}),
	user_addedBy: one(user, {
		fields: [inventoryItems.addedBy],
		references: [user.id],
	}),
	user_lastUpdatedBy: one(user, {
		fields: [inventoryItems.lastUpdatedBy],
		references: [user.id],
	}),
	inventoryMovements: many(inventoryMovements),
}));

export const equipmentRelations = relations(equipment, ({ many }) => ({
	inventoryItems: many(inventoryItems),
}));

export const usersRelations = relations(user, ({ many }) => ({
	inventoryItems_addedBy: many(inventoryItems),
	inventoryItems_lastUpdatedBy: many(inventoryItems),
	inventoryMovements: many(inventoryMovements),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
	inventoryItem: one(inventoryItems, {
		fields: [inventoryMovements.item],
		references: [inventoryItems.id]
	}),
	user: one(user, {
		fields: [inventoryMovements.recordedBy],
		references: [user.id]
	}),
}));

export const administrativeUnitsRelations = relations(administrativeUnits, ({ one, many }) => ({
	civilStatusCenters: many(civilStatusCenters),
	administrativeUnit: one(administrativeUnits, {
		fields: [administrativeUnits.parent],
		references: [administrativeUnits.id],
		relationName: "administrativeUnits_parent_administrativeUnits_id"
	}),
	administrativeUnits: many(administrativeUnits, {
		relationName: "administrativeUnits_parent_administrativeUnits_id"
	}),
}));
