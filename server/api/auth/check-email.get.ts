import { H3Event } from "h3";

export default defineEventHandler({
  onRequest: [requireAuthed],
  handler: async (event: H3Event) => {
    const { arg, ctxOwner } = getQuery(event);

    if (!arg) return { available: false };
    const result = await identifierExists(arg as string, 'email', ctxOwner as string);
    return { available: !result };
  }
});