export default defineEventHandler({
  onRequest: [requireAuthed, requireAdmin],
  handler: async (event) => {
    const uid = getRouterParam(event, 'uid') as string;

    const exists = await ldapUserExists(uid);
    if (!exists) {
      setResponseStatus(event, 404, 'Not Found');
      return { message: 'User not found' };
    }
    await deleteLdapUser(uid);
    await deleteFromKnowage(uid);
    return;
  }
});