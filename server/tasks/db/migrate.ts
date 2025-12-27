import { join } from "node:path"

export default defineTask({
  meta: {
    name: 'db:migrate',
    description: 'Run database migrations',
  },
  run: async () => {
    Logger.info('Running database migrations');
    const migrator = new Migrator(join(process.cwd(), 'server', 'migrations'));
    const db = provideDb();
    await migrator.run(db);
    Logger.info('All migrations applied successfully ✔');
    return { result: 'success' }
  }
})