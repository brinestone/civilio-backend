import crypto from 'crypto';
import { DrizzleError, sql } from 'drizzle-orm';
import { useStorage } from 'nitropack/runtime';
import Logger from '../logger';
import { Connection } from '../types';

const statementSeparator = '--> statement-breakpoint';

const DUPLICATE_OBJECT_ERROR_CODE = '42710';
const DUPLICATE_TABLE_ERROR_CODE = '42P07';
const DUPLICATE_COLUMN_ERROR_CODE = '42701';

const IDEMPOTENT_ERROR_CODES = new Set([
	DUPLICATE_OBJECT_ERROR_CODE,
	DUPLICATE_TABLE_ERROR_CODE,
	DUPLICATE_COLUMN_ERROR_CODE
]);

type MigrationFile = {
	name: string;
	content: string;
	hash: string;
	timestamp: number;
};

async function readMigrationFiles(): Promise<MigrationFile[]> {
	try {
		const base = useStorage('assets:server:migrations');
		const files = await base.getKeys();
		const sqlFiles = files.filter(f => f.endsWith('.sql'));

		const migrations: MigrationFile[] = [];

		for (const fileName of sqlFiles) {
			const content = await base.getItem<string>(fileName);
			if (!content) continue;

			const hash = generateHash(content);
			const timestamp = parseInt(fileName.split('_', 2)[0]) || 0;

			migrations.push({
				name: fileName,
				content,
				hash,
				timestamp
			});
		}

		// Sort by the prefix number to ensure linear execution
		return migrations.sort((a, b) => a.timestamp - b.timestamp);
	} catch (error) {
		throw error;
	}
}

async function checkMigrations(table: string, db: Connection): Promise<{
	needsMigration: boolean;
	pending: MigrationFile[];
	appliedCount: number;
	lastAppliedName: string | null;
}> {
	// 1. Read and sort all local migration files
	const migrationFiles = await readMigrationFiles();

	// 2. Ensure tracking table exists
	await ensureMigrationsTable(table, db);

	// 3. Get the "latest" migration applied by sequence/name
	const appliedData = await db.execute(sql`
    SELECT name
    FROM ${sql.identifier(table,)}
    ORDER BY name DESC
    LIMIT 1
  `);

	const lastAppliedName = appliedData.rows.length > 0
		? (appliedData.rows[0].name as string)
		: null;

	// Extract sequence number (e.g., "0001_name.sql" -> 1)
	const lastSequence = lastAppliedName
		? parseInt(lastAppliedName.split('_')[0])
		: -1;

	// 4. Filter: Only migrations with a prefix GREATER than the last applied sequence
	const pendingMigrations = migrationFiles.filter(file => {
		const currentSequence = parseInt(file.name.split('_')[0]);
		return currentSequence > lastSequence;
	});

	return {
		needsMigration: pendingMigrations.length > 0,
		pending: pendingMigrations,
		appliedCount: migrationFiles.length - pendingMigrations.length,
		lastAppliedName
	};
}

function generateHash(content: string): string {
	return crypto
		.createHash('sha256')
		.update(content)
		.digest('hex');
}

async function ensureMigrationsTable(table: string, db: Connection): Promise<void> {
	await db.transaction(async tx => {
		await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS ${sql.identifier(table)}
      (
        id         SERIAL PRIMARY KEY,
        hash       VARCHAR(64) UNIQUE NOT NULL,
        name       VARCHAR(255)       NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
		if (import.meta.dev) {
			await tx.execute(sql`CREATE SCHEMA IF NOT EXISTS drizzle`);
			await tx.execute(sql`
        CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations
        (
          id         SERIAL PRIMARY KEY,
          hash       TEXT NOT NULL,
          created_at BIGINT
        )
      `);
		}
	})
}

export async function runMigrations(table: string, db: Connection) {
	await ensureMigrationsTable(table, db);
	const status = await checkMigrations(table, db);

	if (!status.needsMigration) {
		Logger.info('No new migrations to apply.');
		return;
	}

	Logger.info(`Applying ${status.pending.length} new migration${status.pending.length != 1 ? 's' : ''} (starting after ${status.lastAppliedName ?? 'beginning'})...`);

	for (const migration of status.pending) {
		await db.transaction(async (tx) => {
			try {
				// Execute statements split by the Drizzle breakpoint
				const statements = migration.content
					.split(statementSeparator)
					.map(v => v.trim())
					.filter(v => v.length > 0);

				for (const statement of statements) {
					try {
						await tx.transaction(async sp => {
							await sp.execute(sql.raw(statement));
						})
					} catch (e) {
						const err = e as DrizzleError;
						if (IDEMPOTENT_ERROR_CODES.has((err.cause as Error & {
							code: string
						}).code)) {
							Logger.warn(`Migration ${migration.name} skipped a statement (Object already exists).`);
						} else {
							throw e; // Rollback
						}
					}
				}

				// Record the migration success
				await tx.execute(sql`
          INSERT INTO ${sql.identifier(table)} (hash, name, created_at)
          VALUES (${migration.hash.substring(0, 16)}, ${migration.name},
                  ${new Date().toISOString()})
          ON CONFLICT (hash) DO UPDATE SET name = EXCLUDED.name
        `);

				if (import.meta.dev) {
					await tx.execute(sql`
            INSERT INTO drizzle.__drizzle_migrations(id, hash, created_at)
            VALUES (DEFAULT,
                    ${migration.hash},
                    ${Date.now()})
            ON CONFLICT DO NOTHING
          `);
				}

				Logger.info(`✓ Applied migration: ${migration.name}`);
			} catch (error) {
				Logger.error(`✗ Failed to apply migration ${migration.name}:`, { error });
				throw error;
			}
		});
	}
}
