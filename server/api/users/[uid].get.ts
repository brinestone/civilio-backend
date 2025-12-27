
// const attributesQuery = z.object({
//   attr: z.coerce.string().optional()
//     .transform(s => s?.split(',') ?? [])
//     .transform(attrs => {
//       const { ldapUserAttributes } = useRuntimeConfig(useEvent());
//       return _.intersection(attrs, ldapUserAttributes.split(','));  
//     })
// });
export default defineEventHandler({
  onRequest: [requireAuthed],
  handler: async (event) => {
    const uid = getRouterParam(event, 'uid', { decode: true });
    // const { data } = await getValidatedQuery(event, attributesQuery.safeParse);
    if (!uid) {
      setResponseStatus(event, 404, 'Not Found');
      return;
    }
    const result = await findLdapUser(uid, ...(['memberOf', 'mail', 'sn', 'uid']));
    if (!result) {
      setResponseStatus(event, 404, 'Not Found');
      return;
    }
    return ldapEntryToUser(result);
  }
})