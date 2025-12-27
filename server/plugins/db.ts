export default defineNitroPlugin(app => {
  Logger.info('Initializing database connection...');
  initDb();
})