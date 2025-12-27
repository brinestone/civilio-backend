export default defineEventHandler({
  onRequest: [requireAuthed],
  handler: async (event) => {
    const { sessionSecret, sessionName } = useRuntimeConfig(useEvent());
    await clearSession(useEvent(), {
      password: sessionSecret
    });
    deleteCookie(event, sessionName);
    deleteCookie(event, 'h3');
  }
});