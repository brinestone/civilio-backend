
export default defineEventHandler({
  onRequest: [requireAuthed],
  handler: async (event) => {
    const { arg } = getQuery(event);

    if (!arg) return { available: false };

    const result = await identifierExists(arg as string, 'username');
    return { available: !result };
  }
});