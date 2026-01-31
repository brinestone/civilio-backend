import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from 'pg';
import * as schema from './db/schema';
import Logger from "./logger";

let pool: Pool;

export async function initPool(connectionString: string) {
  pool = new Pool({
    connectionString
  });
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT NOW() as now`);
    Logger.debug(`Database is reachable. Time is ${res.rows[0].now}`);
  } finally {
    client.release();
  }
}

export async function closePool() {
  pool.end();
}

export function provideDb() {
  return drizzle({
    client: pool,
    logger: {
      logQuery: (query, params) => {
        Logger.verbose(`query: ${query} ${(params && params.length > 0) ? `-- ${JSON.stringify(params)}` : ''}`);
      }
    },
    relations: schema.relations,
    schema
  })
}

export type Database = ReturnType<typeof provideDb>;