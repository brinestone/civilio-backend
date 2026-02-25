import { and, asc, count, desc, eq, getColumns, gt, ne, or, sql } from "drizzle-orm";
import _ from 'lodash';
import { provideDb } from "../db";
import { datasetItems, datasetRefItems, datasetRefs, datasets } from "../db/schema";
import { DatasetUpsertRequest, NewDatasetRefRequest } from "../dto/submission";
import { NotFoundError } from "../types/errors";
import { hashThese } from "../misc";
import Logger from "../logger";
import { ConnectionLike } from "../types/types";

export async function findDatasetRefItems(ref: string) {
	const db = provideDb();
	const refExists = await datasetRefExistsByIdTx(db, ref);
	if (!refExists) throw new NotFoundError('Ref does not exist');
	const [dataset] = await db.select({ title: datasets.title, id: datasets.id })
		.from(datasetRefs)
		.rightJoin(datasets, eq(datasetRefs.dataset, datasets.id))
		.where(eq(datasetRefs.slug, ref))
		.limit(1);
	const items = await db.select({
		..._.pick(getColumns(datasetItems), 'id', 'label', 'ordinal', 'value', 'parentValue')
	}).from(datasetRefItems)
		.rightJoin(datasetItems, eq(datasetItems.id, datasetRefItems.itemId))
		.where(eq(datasetRefItems.ref, ref))
		.orderBy(asc(datasetItems.ordinal));
	return { dataset, items };
}

export async function createDatasetReference({
	dataset, followDatasetUpdates, selectAll, selectedItems
}: NewDatasetRefRequest) {
	const db = provideDb();

	return await db.transaction(async tx => {
		const datasetExists = await datasetExistsByIdTx(tx, dataset);
		if (!datasetExists) throw new NotFoundError('Dataset does not exist with id: ' + dataset);

		const id = hashThese(dataset, String(followDatasetUpdates), String(selectAll), JSON.stringify(selectedItems));
		const refExists = await datasetRefExistsByIdTx(tx, id);
		if (!refExists) {
			await tx.transaction(tx => tx.insert(datasetRefs)
				.values({
					slug: id,
					type: followDatasetUpdates && selectAll ? 'all' : 'subset',
					dataset,
				}));

			if (!followDatasetUpdates && selectAll) {
				const currentItems = await tx.select({ id: datasetItems.id })
					.from(datasetItems)
					.where(eq(datasetItems.dataset, dataset));
				await tx.transaction(async tx => {
					for (const item of currentItems) {
						await tx.insert(datasetRefItems)
							.values({
								ref: id,
								dataset,
								itemId: item.id
							});
					}
				})
			} else
				await tx.transaction(async tx => {
					for (const item of selectedItems) {
						await tx.insert(datasetRefItems)
							.values({
								ref: id,
								dataset,
								itemId: item
							})
					}
				});
		}
		return id;
	})
}

export async function datasetRefExistsByIdTx(tx: ConnectionLike, id: string) {
	const result = await tx.execute<{ exists: boolean }>(sql`
		SELECT EXISTS(SELECT 1 FROM ${datasetRefs} WHERE ${eq(datasetRefs.slug, id)})
		`);
	return result.rows[0].exists;
}

export async function datasetExistsByIdTx(tx: ConnectionLike, id: string) {
	const result = await tx.execute<{ exists: boolean }>(sql`
		SELECT EXISTS(SELECT 1 FROM ${datasets} WHERE ${eq(datasets.id, id)})
		`);
	return result.rows[0].exists;
}

export async function lookupDatasetItems(dataset: string, page: number, size: number, filter?: string) {
	const db = provideDb();

	const baseFilters = [eq(datasetItems.dataset, dataset)];
	const columns = _.omit(getColumns(datasetItems), ['dataset']);
	if (filter) {
		// Prepare the tsquery string
		const formattedFilter = filter.trim().split(/\s+/).join(' & ') + ':*';

		const vector = sql`to_tsvector('simple', ${datasetItems.label})`;
		const query = sql`to_tsquery('simple', ${formattedFilter})`;

		// Combined filter: Exact/Prefix match OR Fuzzy similarity
		const searchFilter = and(
			...baseFilters,
			or(
				sql`${vector} @@ ${query}`,
				sql`${datasetItems.label} % ${filter}`
			)
		);

		const subQuery = db.select({
			...columns,
			rank: sql<number>`ts_rank(${vector}, ${query})`.as('rank'),
			similarity: sql<number>`similarity(${datasetItems.label}, ${filter})`.as('similarity')
		})
			.from(datasetItems)
			.where(searchFilter)
			.orderBy(() => [desc(sql`ts_rank(${vector}, ${query}) + similarity(${datasetItems.label}, ${filter})`),]).as('subQuery');

		const forwardedColumns = _.omit(getColumns(subQuery), ['rank', 'similarity']);
		const result = await db.select({
			...forwardedColumns
		}).from(subQuery)
			.offset(page * size)
			.limit(size);

		const totalRecords = await db.$count(datasetItems, searchFilter);

		return { totalRecords, data: result };
	} else {
		// Standard paginated list
		const result = await db.select({
			...columns
		})
			.from(datasetItems)
			.where(and(...baseFilters))
			.orderBy(asc(datasetItems.ordinal))
			.offset(page * size)
			.limit(size);

		const totalRecords = await db.$count(datasetItems, and(...baseFilters));

		return { totalRecords, data: result };
	}
}

export async function lookupDatasets(page: number, size: number, excludeEmpty: boolean, filter?: string) {
	const db = provideDb();
	const columns = {
		...getColumns(datasets),
		itemCount: count(datasetItems.id).as('itemCount')
	};
	const groupByExp = [datasets.id];

	if (filter) {
		// Format filter for tsquery (e.g., "word1 & word2:*")
		const formattedFilter = filter.trim().split(/\s+/).join(' & ') + ':*';

		const vector = sql`(
            setweight(to_tsvector('simple', ${datasets.title}), 'A') ||
            setweight(to_tsvector('simple', ${datasets.key}), 'B') ||
            setweight(to_tsvector('simple', ${datasets.description}), 'C')
        )`;
		const query = sql`to_tsquery('simple', ${formattedFilter})`;

		// Combined logic: TSVector Match OR Trigram Similarity
		const sqlFilter = or(
			sql`${vector} @@ ${query}`,
			sql`${datasets.title} % ${filter}`,
			sql`${datasets.key} % ${filter}`
		);

		const subQuery = db.select({
			...columns,
			rank: sql<number>`ts_rank(${vector}, ${query})`.as('rank'),
			// Add trigram similarity to the score if TS rank is low
			similarity: sql<number>`similarity(${datasets.title}, ${filter})`.as('similarity'),
		})
			.from(datasets)
			.leftJoin(datasetItems, eq(datasetItems.dataset, datasets.id))
			.where(sqlFilter)
			.having(excludeEmpty ? gt(count(datasetItems.id), 0) : eq(sql`${1}`, 1))
			.groupBy(...groupByExp)
			.orderBy(() => desc(sql`ts_rank(${vector}, ${query}) + similarity(${datasets.title}, ${filter})`)).as('subQuery');
		const forwardedColumns = _.omit(getColumns(subQuery), ['similarity', 'rank']);
		const result = await db.select({
			...forwardedColumns
		}).from(subQuery)
			.offset(page * size)
			.limit(size);

		const totalRecords = await db.$count(datasets, sqlFilter);
		return { totalRecords, data: result };
	} else {
		const result = await db.select(columns)
			.from(datasets)
			.leftJoin(datasetItems, eq(datasetItems.dataset, datasets.id))
			.having(excludeEmpty ? gt(count(datasetItems.id), 0) : eq(sql`${1}`, 1))
			.groupBy(...groupByExp)
			.orderBy(desc(datasets.updatedAt))
			.offset(page * size)
			.limit(size);

		const totalRecords = await db.$count(datasets);
		return { totalRecords, data: result };
	}
}

export async function deleteDataset(id: string) {
	const db = provideDb();
	Logger.info(`Deleting dataset group`, { dataset: id });
	const { rowCount } = await db.transaction(tx => tx.delete(datasets)
		.where(eq(datasets.id, id))
	);
	Logger.info(`Dataset group deleted`, { affectedRows: rowCount });
}

export async function deleteOption(id: string, itemId: string) {
	const db = provideDb();
	await db.transaction(async tx => {
		await tx.delete(datasetItems)
			.where(and(
				eq(datasetItems.id, itemId),
				eq(datasetItems.dataset, id)
			));
	});
}

export async function upsertFormOptions(param: DatasetUpsertRequest) {
	const db = provideDb();
	await db.transaction(async tx => {
		for (const group of param) {
			await tx.transaction(async ttx => {
				let datasetId: string;
				if (group.isNew == 'true') {
					const [result] = await ttx.insert(datasets)
						.values({
							title: group.data.title,
							description: group.data.description || null,
							key: group.data.key,
							parentId: group.data.parentId,
						}).returning({
							id: datasets.id
						});
					datasetId = result.id;

					for (const option of group.data.items) {
						await ttx.insert(datasetItems)
							.values({
								dataset: datasetId,
								label: option.label,
								value: option.value,
								ordinal: option.ordinal,
								parentValue: option.parentValue || null
							});
					}
				} else {
					const change = _.omit(group.data, ['id', 'items']);
					await ttx.update(datasets)
						.set(change)
						.where(
							eq(datasets.id, group.data.id)
						).returning({
							id: datasets.id
						});
					datasetId = group.data.id;
					for (const option of group.data.items) {
						if (option.isNew == 'true') {
							await ttx.insert(datasetItems)
								.values({
									dataset: datasetId,
									label: option.label,
									ordinal: option.ordinal,
									value: option.value,
									parentValue: option.parentValue || null
								});
						} else {
							await ttx.update(datasetItems)
								.set({
									value: option.value,
									label: option.label,
									ordinal: option.ordinal,
									parentValue: option.parentValue || null
								}).where(and(
									eq(datasetItems.dataset, datasetId),
									eq(datasetItems.id, option.id)
								))
						}
					}
				}
			});
		}
	})
}

export async function datasetKeyAvailable(key: string, refDatasetId?: string) {
	const db = provideDb();
	const filters = [
		eq(datasets.key, key)
	];
	if (refDatasetId) {
		filters.push(ne(datasets.id, refDatasetId))
	} else {
		sql`${true}`
	}
	const count = await db.$count(datasets, and(
		...filters
	));
	return count == 0;
}

export async function findAllDatasets() {
	const db = provideDb();

	return await db.query.datasets.findMany({
		orderBy: {
			title: 'asc',
			createdAt: 'desc',
			updatedAt: 'desc',
		},
		with: {
			parent: {
				columns: {
					title: true,
					description: true,
					key: true
				}
			},
			items: {
				orderBy: {
					ordinal: 'asc'
				}
			}
		},
	});
}