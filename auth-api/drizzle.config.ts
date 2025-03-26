import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'postgresql',
    dbCredentials: {
        url: String(process.env['DB_URL'])
    },
    schema: 'src/db/schema',
    out: 'src/db/migrations'
});