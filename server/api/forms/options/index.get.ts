const responseSchema = FindFormOptionsResponseSchema.toJSONSchema({
  target: 'openapi-3.0',
})

defineRouteMeta({
  openAPI: {
    tags: ['Forms'],
    summary: 'Get Form Options',
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
});

export default defineEventHandler(async () => {
  const groups = await findAllFormOptions();
  return FindFormOptionsResponseSchema.parse({ groups });
});