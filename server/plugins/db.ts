export default defineNitroPlugin(async app => {
  let priorFail = false;
  while (true) {
    try {
      Logger.info(`${priorFail ? 'Re-' : ''}Initializing database connection pool...`);
      const { databaseUrl } = useRuntimeConfig();
      await initPool(databaseUrl);
      Logger.info('Database connection pool initialized.');
      app.hooks.hook('close', async () => {
        Logger.info('Shutting down database connection pool...');
        await closePool();
        Logger.info('Database connection pool closed');
      });
      break;
    } catch (e) {
      Logger.error(e);
      priorFail = true;
    }
    Logger.info('Retrying in 5s...');
    await pause(5000);
  }
  try {
    Logger.info('Running database migrations');
    await runTask('db:migrate');
    Logger.info('Database migrations completed successfully');
  } catch (e) {
    Logger.error(e);
    throw e;
  }
})