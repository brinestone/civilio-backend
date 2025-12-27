import 'dotenv/config';
import { defineConfig } from 'drizzle-kit'
const url = new URL(process.env.NITRO_DATABASE_URL!);

export default defineConfig({
  dialect: 'mysql',
  dbCredentials: {
    url: url.toString(),
  },
  out: './server/migrations',
  schema: './server/utils/db/schema.ts',
  // schemaFilter: ['civilio']
})