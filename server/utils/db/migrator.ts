import { desc, sql } from "drizzle-orm";
import { bigint, mysqlTable, primaryKey, text, unique } from "drizzle-orm/mysql-core";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Database } from "../db";

const tableName = '__drizzle_migrations';
const migrations = mysqlTable(tableName, {
  id: bigint({ unsigned: true, mode: 'number' }).autoincrement().primaryKey(),
  hash: text(),
  createdAt: bigint('created_at', { mode: 'number' }),
}, t => [
  primaryKey({ columns: [t.id] }),
  unique().on(t.id)
]);

export class Migrator {
  constructor(private migrationsPath: string) { }

  async run(db: Database) {
    await db.transaction(async tx => {
      await tx.execute(sql`CREATE TABLE IF NOT EXISTS ${sql.identifier(tableName)} (
        id bigint unsigned NOT NULL,
        hash text NOT NULL,
        created_at bigint DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY id (id)
      )`);

      const [lastApplied] = await tx.select()
        .from(migrations)
        .orderBy(desc(migrations.createdAt))
        .limit(1);

      const files = readdirSync(this.migrationsPath)
        .filter(f => f.endsWith('.sql'))
        .map(f => {
          const path = join(this.migrationsPath, f);
          const [id] = f.split('_', 2);
          const content = readFileSync(path, 'utf8');
          return { id: Number(id), path, hash: hashFileContent(content) }
        })
        .filter(f => !lastApplied || f.id > Number(lastApplied.id))
        .sort((a, b) => a.id - b.id);

      for (const file of files) {
        Logger.info(`Applying migration file: '${file.path}'...`)
        const content = readFileSync(file.path, 'utf8');
        const statements = content.split('--> statement-breakpoint');
        // await tx.transaction(async txx => {
        for (const statement of statements) {
          await tx.execute(sql.raw(statement.trim()));
        }
        // });

        await tx.insert(migrations).values({
          id: file.id,
          createdAt: Date.now(),
          hash: file.hash
        });
        Logger.info(`Applied migration file: '${file.path}'`);
      }
    });
  }
}

function hashFileContent(content: string) {
  const cipher = createHash('sha256');
  cipher.update(content);
  return cipher.digest('hex');
}