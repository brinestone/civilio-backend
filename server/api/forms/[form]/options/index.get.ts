import { z } from "zod";
import { prettifyError } from "zod";

const responseSchema = FindFormOptionsResponseSchema.toJSONSchema({
  target: 'options',
})

defineRouteMeta({
  openAPI: {
    tags: ['Forms'],
    summary: 'Get Form Options',
    parameters: [
      { in: 'path', required: true, example: 'csc', name: 'form' }
    ],
    responses: {
      '200': {
        description: 'Form options payload',
        content: {
          'application/json': {
            schema: responseSchema as any
          }
        }
      }
    }
  }
})

const paramsSchema = z.object({
  form: z.string()
});

export default defineEventHandler(async event => {
  const {
    error,
    success,
    data
  } = await getValidatedRouterParams(event, paramsSchema.safeParse);

  if (!success) {
    setResponseStatus(event, 400, 'Bad Request');
    return { message: prettifyError(error) };
  }
  const groups = await findAllFormOptions(data.form);
  return FindFormOptionsResponseSchema.parse({ groups });
});