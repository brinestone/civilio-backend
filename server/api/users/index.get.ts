export default defineEventHandler({
  onRequest: [requireAuthed],
  handler: async () => {
    const user = await usePrincipal();
    return await findAllLdapUsers(user.username);
  }
})