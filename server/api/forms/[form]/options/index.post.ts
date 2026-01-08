import z, { prettifyError } from "zod"

const bodySchema = FormOptionsUpsertRequestSchema;
const paramsSchema = z.object({
  form: z.string(),
})
export default defineEventHandler(async event => {
  const paramsResult = await getValidatedRouterParams(event, paramsSchema.safeParse);
  const bodyResult = await readValidatedBody(event, bodySchema.safeParse);

  if (!paramsResult.success) {
    setResponseStatus(event, 400, 'Bad Request');
    Logger.error(paramsResult.error);
    return { message: prettifyError(paramsResult.error) };
  }

  if (!bodyResult.success) {
    setResponseStatus(event, 400, 'Bad Request');
    Logger.error(bodyResult.error);
    console.error(bodyResult.error);
    return { message: prettifyError(bodyResult.error) };
  }

  const { form } = paramsResult.data;
  const formExists = await formExistsByName(form);
  if (!formExists) {
    setResponseStatus(event, 409);
    return { message: 'Form does not exist with name: ' + form };
  }

  await upsertFormOptions(paramsResult.data.form, bodyResult.data);
  setResponseStatus(event, 202);
  return;
})