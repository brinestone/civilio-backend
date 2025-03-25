import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'postgresql',
    dbCredentials: {
        url: String(process.env['DB_URL'])
    },
    schema: 'db/schema',
    out: 'db/migrations'
});