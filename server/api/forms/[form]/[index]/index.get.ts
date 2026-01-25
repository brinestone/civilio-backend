import { prettifyError, z } from "zod";

defineRouteMeta(
    {
      openAPI: {
        tags: ['Forms'],
        summary: 'Get submission form data',
        parameters: [
          { in: 'path', name: 'form', required: true, example: 'csc' },
          { in: 'path', name: 'index', required: true, example: 1 },
          { in: 'query', name: 'version', required: false }
        ],
      }
    }
);

const querySchema = z.object({
  version: z.string().optional(),
});
const paramsSchema = z.object({
  index: z.coerce.number().min(1),
  form: z.string()
})

export default defineEventHandler(async event => {
  const paramsValidationResult = await getValidatedRouterParams(event, paramsSchema.safeParse);
  const queryValidationResult = await getValidatedQuery(event, querySchema.safeParse);

  if (!paramsValidationResult.success) {
    setResponseStatus(event, 400, 'Bad Request');
    return { message: prettifyError(paramsValidationResult.error) };
  }

  if (!queryValidationResult.success) {
    setResponseStatus(event, 400, 'Bad Request');
    return { message: prettifyError(queryValidationResult.error) };
  }

  return await findFormSubmissionData(
      paramsValidationResult.data.index,
      paramsValidationResult.data.form,
      queryValidationResult.data.version
  );
});