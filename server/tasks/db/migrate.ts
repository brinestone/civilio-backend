import { defineTask } from "nitropack/runtime";
import { provideDb } from "~/utils/db";
import { runMigrations } from "~/utils/db/migrator";

export default defineTask({
  meta: {
    name: 'db:migrate',
    description: 'Run database migrations',
  },
  run: async () => {
    const db = provideDb();
    runMigrations('migration', db)
    return { result: 'success' }
  }
})