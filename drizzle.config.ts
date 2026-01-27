import 'dotenv/config';
import { defineConfig } from 'drizzle-kit'
const url = new URL(process.env.NITRO_DATABASE_URL!);

export default defineConfig({
  dialect: 'postgresql',
  dbCredentials: {
    url: url.toString(),
    ssl: url.searchParams.has('sslmode', 'require')
  },
  out: './server/assets/migrations',
  schema: './server/utils/db/schema.ts',
  schemaFilter: ['civilio', 'revisions'],
})