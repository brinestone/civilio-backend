export default defineEventHandler({
  onRequest: [requireAuthed],
  handler: async (event) => {
    const session = await getSessionManager();
    const dn = session.data?.principal?.dn;
    let user: UserInfo | null = null;
    if (dn) {
      user = await findLdapUserByDn(dn);
    }
    if (!user) {
      const { sessionSecret } = useRuntimeConfig(event);
      await clearSession(useEvent(), {
        password: sessionSecret
      });
      setResponseStatus(event, 401, 'Unauthorized');
      return;
    }
    return user;
  }
})