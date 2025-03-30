import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from './db/schema';
import logger from "./logger";

const pool = new Pool({
    connectionString: process.env.DB_URL
});

export const db = drizzle(pool, {
    schema, logger: {
        logQuery(query, params) {
            logger.verbose(query, ...params);
        },
    }
})