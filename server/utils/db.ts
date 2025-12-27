import { drizzle } from "drizzle-orm/mysql2";
import { createPool, Pool } from 'mysql2/promise';
import * as schema from './db/schema';

let pool: Pool;

export function initDb() {
  pool = createPool({
    uri: useRuntimeConfig().databaseUrl,
  });
}

export function provideDb() {
  return drizzle(pool,
    {
      schema,
      mode: 'default',
      logger: {
        logQuery: (query, params) => {
          Logger.verbose(`query: ${query} ${(params && params.length > 0) ? `-- ${JSON.stringify(params)}` : ''}`);
        }
      }
    })
}

export type Database = ReturnType<typeof provideDb>;