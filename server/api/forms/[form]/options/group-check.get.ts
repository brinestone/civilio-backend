import { prettifyError, z } from "zod";
import { optionGroupKeyAvailable } from "../../../../utils/options";

defineRouteMeta({
  openAPI: {
    tags: ['Forms'],
    description: 'Check if group key is available',
    summary: 'Group key check',
    parameters: [
      {
        in: 'path',
        name: 'form',
        summary: 'Form ID',
        required: true,
        example: 'csc'
      },
      {
        in: 'query',
        name: 'key',
        summary: 'Group Key',
        required: true,
        example: 'commune'
      }
    ]
  }
});

const queryParams = z.object({
  key: z.coerce.string()
})
export default defineEventHandler(async event => {
  const {
    success,
    data,
    error
  } = await getValidatedQuery(event, queryParams.safeParse);

  if (!success) {
    setResponseStatus(event, 400, 'Bad request');
    return { message: prettifyError(error) };
  }

  return { available: await optionGroupKeyAvailable(getRouterParam(event, 'form', { decode: true })!, data!.key) }
})