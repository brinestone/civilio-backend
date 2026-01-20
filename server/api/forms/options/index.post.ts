import { prettifyError } from "zod";

const bodySchema = FormOptionsUpsertRequestSchema;
// const paramsSchema = z.object({
//   form: z.string(),
// })
export default defineEventHandler(async event => {
  // const paramsResult = await getValidatedRouterParams(event, paramsSchema.safeParse);
  const bodyResult = await readValidatedBody(event, bodySchema.safeParse);

  if (!bodyResult.success) {
    setResponseStatus(event, 400, 'Bad Request');
    Logger.error(bodyResult.error);
    console.error(bodyResult.error);
    return { message: prettifyError(bodyResult.error) };
  }

  await upsertFormOptions(bodyResult.data);
  setResponseStatus(event, 202);
  return;
})