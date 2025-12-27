import { prettifyError } from "zod";

export default defineEventHandler({
  onRequest: [requireAuthed, requireAdmin],
  handler: async (event) => {
    const { success, data, error } = await readValidatedBody(event, UpdateUserRequestSchema.safeParse);
    if (!success) {
      setResponseStatus(event, 400, 'Bad Request')
      return { message: prettifyError(error) };
    }

    const userId = getRouterParam(event, 'uid');
    if (!userId || !(await ldapUserExists(userId))) {
      setResponseStatus(event, 404, 'Not Found');
      return { message: 'No user exists with uid=' + userId };
    }

    await updateLdapUser(userId, data);
    await updateKnowageUserProfile(userId, data);
    return;
  }
});