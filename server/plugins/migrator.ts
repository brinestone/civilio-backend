export default defineNitroPlugin(app => {
    runTask('db:migrate');
})