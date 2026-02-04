import { PgTable } from "drizzle-orm/pg-core";
import { useStorage } from "nitropack/runtime";
import Logger from "../logger";
import { Connection } from "../types";
import { datasetItems, datasets } from "./schema";
import { sql } from "drizzle-orm";

type SeedFile = {
	name: string;
	table: PgTable;
}
function readSeedFiles() {
	return [
		{ name: 'datasets.json', table: datasets },
		{ name: 'dataset_items.json', table: datasetItems, type: datasetItems }
	] as SeedFile[];
}

export async function seedDatabase(conn: Connection) {
	const seedFiles = readSeedFiles();
	Logger.info(`Seeding database with ${seedFiles.length} item${seedFiles.length != 1 ? 's' : ''}`);
	const base = useStorage('assets:server:seed');
	await conn.transaction(async tx => {
		try {
			await tx.execute(sql`SET session_replication_role = 'replica'`);
			for (const seed of seedFiles) {
				const rows = await base.getItem<any[]>(seed.name);
				if (rows === null) continue;
				Logger.info(`Seeding from ${seed.name} with ${rows.length} row${rows.length != 1 ? 's' : ''}`);
				await tx.transaction(async tx => {
					for (const row of rows) {
						await tx.insert(seed.table)
							.values(row)
							.onConflictDoNothing();
					}
				});
				Logger.info(`Seeding successful`);
			}
		} finally {
			await tx.execute(sql`SET session_replication_role = 'origin'`);
		}
	});
	Logger.info(`Database seeded successfully`);
}