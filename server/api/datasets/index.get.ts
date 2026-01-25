const responseSchema = FindAllDatasetsResponseSchema.toJSONSchema({
	target: 'openapi-3.0',
})

defineRouteMeta({
	openAPI: {
		tags: ['Datasets'],
		summary: 'Get Datasets',
		responses: {
			'200': {
				description: 'Datasets payload',
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
	const groups = await findAllDatasets();
	return FindAllDatasetsResponseSchema.parse({ groups });
});