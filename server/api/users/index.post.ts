import { H3Event } from "h3";
import { prettifyError } from "zod";

export default defineEventHandler({
  onRequest: [requireAuthed, requireAdmin],
  handler: async (event: H3Event) => {
    const { success, data, error } = await readValidatedBody(event, CreateUserRequestSchema.safeParse);
    if (!success) {
      setResponseStatus(event, 400, 'Bad Request');
      return { message: prettifyError(error) };
    }

    const syncUser = {
      role: data.role,
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password
    };

    await addUserToLdap(syncUser);
    await syncToKnowage(syncUser);
    setResponseStatus(event, 201, 'Created');
    return;
  }
});