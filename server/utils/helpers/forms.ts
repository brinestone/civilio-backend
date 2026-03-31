import { and, eq, inArray, isNotNull, isNull, ne, not, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import _ from "lodash";
import { excluded, provideDb } from "../db";
import { formItems, forms, formVersionItems, formVersions } from "../db/schema";
import { FormItemDefinitionUpdate, NewFormItemDefinition, Tag } from "../dto/form";
import Logger from "../logger";
import { randomString } from "../misc";
import { UnprocessibleError } from "../types/errors";
import { ConnectionLike } from "../types/types";

export async function removeFormItems(tx: ConnectionLike, slug: string, version: string, ids: string[]) {
	const fvi = formVersionItems;
	return await tx.transaction(async tx => {
		let deleted = 0;
		const result = await tx.delete(fvi)
			.where(and(
				eq(fvi.form, slug),
				eq(fvi.formVersion, version),
				inArray(fvi.id, ids)
			));
		deleted += result.rowCount ?? 0;
		if (deleted > 0) {
			const now = new Date();
			await tx.update(fvi)
				.set({ updatedAt: now }).where(and(
					eq(fvi.form, slug),
					eq(fvi.id, version)
				));
			await tx.update(forms)
				.set({
					updatedAt: now
				})
				.where(eq(forms.slug, slug));
		}
		return deleted;
	});
}

export async function updateFormItems(tx: ConnectionLike, slug: string, version: string, items: FormItemDefinitionUpdate[], parentId?: string) {
	Logger.info(`Attempting to update ${items.length} form item(s) under form: ${slug}`);
	// const fvi = alias(formVersionItems, 'fvi');
	const ids = Array<string>();
	await tx.transaction(async tx => {
		for (const item of items) {
			const { config, path, relevance, itemId, tags, id: linkId, metaTag, } = item;
			let _itemId = itemId
			if (!itemId) {
				const [{ id }] = await tx.insert(formItems)
					.values({
						type: item.type,
						config,
						tags
					}).returning({ id: formItems.id });
				_itemId = id;
			}
			if (item.type == 'field' && item.parentId) {
				const parentIsInFom = await formVersionHasItemTx(tx, version, slug, item.parentId);
				if (!parentIsInFom) throw new UnprocessibleError(`Specified parent item for item: ${linkId} was not found under form: ${slug}, version: ${version}`);
			}
			const [{ returnedId }] = await tx.insert(formVersionItems)
				.values({
					id: linkId,
					path,
					relevance,
					parentId: (item.type == 'field' ? item.parentId ?? parentId : parentId) ?? undefined,
					tags,
					metaTag,
					config,
					form: slug,
					formVersion: version,
					itemId: _itemId ?? null
				})
				.onConflictDoUpdate({
					target: [formVersionItems.formVersion, formVersionItems.id],
					set: {
						tags: excluded(formVersionItems.tags),
						parentId: excluded(formVersionItems.parentId),
						relevance: excluded(formVersionItems.relevance),
						path: excluded(formVersionItems.path),
						config: excluded(formVersionItems.config),
						itemId: excluded(formVersionItems.itemId),
						metaTag: excluded(formVersionItems.metaTag)
					}
				}).returning({ returnedId: formVersionItems.id });
			ids.push(returnedId);
		}
		if (ids.length > 0) {
			const now = new Date();
			await tx.update(formVersionItems)
				.set({ updatedAt: now }).where(and(
					eq(formVersionItems.form, slug),
					eq(formVersionItems.id, version)
				));
			await tx.update(forms)
				.set({
					updatedAt: now
				})
				.where(eq(forms.slug, slug));
		}
	});
	return ids;
}

export async function formVersionHasItemTx(conn: ConnectionLike, formVersion: string, slug: string, id: string) {
	const result = await conn.execute<{ exists: boolean }>(sql`
		SELECT EXISTS(SELECT 1
					  FROM ${formVersionItems}
					  WHERE ${and(
		eq(formVersionItems.formVersion, formVersion),
		eq(formVersionItems.form, slug),
		eq(formVersionItems.id, id),
		// eq(formVersionItems.itemId, itemId)
	)})
	`);
	return result.rows[0].exists;
}

export async function createFormItems(tx: ConnectionLike, slug: string, version: string, items: NewFormItemDefinition[], parentId?: string) {
	const now = new Date();
	return await tx.transaction(async tx => {
		const ids = Array<string>();
		for (const item of items) {
			const [{ id: itemId }] = await tx.insert(formItems)
				.values({
					type: item.type,
					id: item.itemId || undefined,
					tags: item.tags,
					config: _.omit(item.config, ['dataKey']),
				}).onConflictDoNothing({
					target: [formItems.id]
				}).returning({ id: formItems.id });

			const [{ ref }] = await tx.insert(formVersionItems)
				.values(({
					itemId: itemId,
					form: slug,
					formVersion: version,
					tags: item.tags,
					path: item.path,
					parentId: parentId ?? (item.type === 'field' ? item.parentId : null),
					config: item.config,
					relevance: item.relevance,
				} as typeof formVersionItems.$inferInsert))
				.returning({ ref: formVersionItems.id });
			ids.push(ref)
		}
		if (ids.length > 0) {
			await tx.update(formVersions)
				.set({ updatedAt: now }).where(and(
					eq(formVersions.form, slug),
					eq(formVersions.id, version)
				));
			await tx.update(forms)
				.set({
					updatedAt: now
				})
				.where(eq(forms.slug, slug));
		}
		return ids;
	});
}

export async function toggleFormArchived(slug: string) {
	const db = provideDb();
	await db.transaction(tx => tx.update(forms)
		.set({ archived: not(forms.archived) })
		.where(eq(forms.slug, slug))
	)
}

export async function createForm(title: string, description?: string) {
	const db = provideDb();
	const newSlug = randomString(16);
	return await db.transaction(async tx => {
		const [formInfo] = await tx.insert(forms).values({
			slug: newSlug,
			title,
			description,
		}).returning();

		const [versionInfo] = await tx.insert(formVersions).values({
			form: newSlug,
			isCurrent: true,
		}).returning();

		await tx.update(formVersions).set({ isCurrent: false }).where(and(
			eq(formVersions.form, newSlug),
			ne(formVersions.id, versionInfo.id),
		));
		return { formInfo, versionInfo };
	})
}

export async function formTitleAvailable(title: string) {
	const db = provideDb();
	const result = await db.execute<{ available: boolean }>(sql`
		SELECT NOT EXISTS(SELECT 1 FROM ${forms} WHERE ${eq(forms.title, title)}) AS "available"
	`);
	return result.rows[0];
}

export async function getCurrentFormVersionTx(conn: ConnectionLike, form: string) {
	const result = await conn.query.formVersions.findFirst({
		columns: { id: true },
		where: {
			form,
			isCurrent: true,
		},
		orderBy: {
			updatedAt: 'desc'
		}
	});
	return result || null;
}

export async function formVersionExistsTx(tx: ConnectionLike, slug: string, version: string) {
	const result = await tx.execute<{ exists: boolean }>(sql`
		SELECT EXISTS (SELECT 1 FROM ${formVersions} WHERE ${and(eq(formVersions.id, version), eq(formVersions.form, slug))}) AS "exists"
	`);
	return result.rows[0]?.exists ?? false;
}

/**
 * Finds a form definition by slug and optional version.
 *
 * @param slug - The form slug identifier
 * @param version - Optional specific version ID. If not provided, returns the current version
 * @returns A promise that resolves to the form version with its items and children, or undefined if not found
 *
 * @example
 * // Get current form version
 * const form = await findFormDefinition('contact-form');
 *
 * @example
 * // Get specific form version
 * const form = await findFormDefinition('contact-form', 'v1.2.0');
 */
export async function findFormVersionDefinition(slug: string, includeArchived = false, version?: string) {
	const db = provideDb();
	const fv = alias(formVersions, 'fv');
	const fvi = alias(formVersionItems, 'fvi');
	const children = alias(formVersionItems, 'ch');
	const childItems = alias(formItems, 'chi');
	const fi = alias(formItems, 'fi');

	const formItemsFilters = [
		eq(fv.id, fvi.formVersion),
		isNull(fvi.parentId)
	];

	// const childItems = db.select().from(children)

	const formItemsQuery = db.select({
		type: fi.type,
		id: fvi.id,
		itemId: fi.id.as('itemId'),
		path: fvi.path,
		relevance: fvi.relevance,
		config: sql`
			COALESCE(${fi.config}, '{}'::JSONB) ||
			COALESCE(${fvi.config}, '{}'::JSONB) ||
			(
				CASE WHEN ${eq(fi.type, 'group')} THEN
					jsonb_build_object(
						'fields', COALESCE(jsonb_agg(jsonb_build_object(
							'type', ${childItems.type},
							'id', ${children.id},
							'path', ${children.path},
							'relevance', ${children.relevance},
							'config', COALESCE(${childItems.config}, '{}'::JSONB) || COALESCE(${children.config}, '{}'::JSONB),
							'tags', COALESCE(${childItems.tags}, '[]'::JSONB) || COALESCE(${children.tags}, '[]'::JSONB),
							'addedAt', ${children.addedAt},
							'updatedAt', ${children.updatedAt},
							'metaTag', ${children.metaTag},
							'parentId', ${children.parentId},
							'itemId', ${children.itemId}
						)) FILTER (WHERE ${isNotNull(children.id)}), '[]'::JSONB)
					)
				ELSE
					'{}'::JSONB
				END
			)`.as('config'),
		tags: sql<Tag[]>`COALESCE(${fi.tags}, '[]'::JSONB) || COALESCE(${fvi.tags}, '[]'::JSONB)`.as('tags'),
		addedAt: fvi.addedAt.as('addedAt'),
		updatedAt: fvi.updatedAt.as('updatedAt'),
		metaTag: fvi.metaTag.as('metaTag')
	}).from(fi)
		.innerJoin(fvi, eq(fvi.itemId, fi.id))
		.leftJoin(children, eq(children.parentId, fvi.id))
		.leftJoin(childItems, eq(childItems.id, children.itemId))
		.where(and(...formItemsFilters))
		.groupBy(
			fi.type, fvi.id, fi.id, fvi.path, fvi.relevance, fvi.config, fi.config, fvi.tags, fvi.addedAt, fvi.updatedAt, fvi.metaTag
		)
		.orderBy(fvi.path)
		.as('t');

	const aggregatedItemsQuery = db.select({
		r: sql`COALESCE(json_agg(row_to_json(t.*)), '[]')`.as('r')
	}).from(formItemsQuery)
		.as('items');

	const mainQueryFilters = [
		eq(fv.form, slug),
		version ? eq(fv.id, version) : eq(fv.isCurrent, true)
	];
	if (includeArchived) {
		// formItemsFilters.push(isNull(fvi.))
		mainQueryFilters.push(isNull(fv.archivedAt));
	}
	const [result] = await db.select({
		id: fv.id,
		parentId: fv.parentId,
		items: sql`items.r`.as('items')
	}).from(fv)
		.leftJoinLateral(
			aggregatedItemsQuery, sql`${true}`
		).where(and(...mainQueryFilters));
	return result;
}

export async function formSlugAvailable(slug: string) {
	const db = provideDb();
	const result = await db.execute<{ exists: boolean }>(sql`
		SELECT NOT EXISTS(SELECT 1
						  FROM ${forms}
						  WHERE ${eq(forms.slug, slug)}) AS "exists"
	`);
	return result.rows[0].exists;
}

export async function lookupFormVersionsByFormSlug(slug: string) {
	const db = provideDb();

	return await db.query.formVersions.findMany({
		where: {
			form: slug
		},
	});
}

export async function lookupForms() {
	const db = provideDb();
	return await db.query.formDefinitions.findMany({
		columns: {
			slug: true,
			updatedAt: true,
			title: true,
		},
		with: {
			currentVersion: {
				columns: {
					id: true
				}
			}
		},
		orderBy: {
			updatedAt: 'desc'
		},
		where: {
			archived: {
				ne: true
			}
		}
	});
}