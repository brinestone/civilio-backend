import z from "zod";

const querySchema = z.object({
	slug: z.string().trim().regex(/^[a-zA-Z0-9_]+$/g, 'Invalid slug value')
});

defineRouteMeta({
	openAPI: {
		tags: ['Forms'],
		summary: 'Check slug',
		description: 'Check whether a form slug is available',
		parameters: [
			{ in: 'query', name: 'slug', required: true, }
		],
		responses: {
			'200': {
				'description': 'OK',
				content: {
					'application/json': {
						schema: {
							$ref: '#/components/schemas/AvailabilityResponse'
						}
					}
				}
			},
		}
	}
})
export default defineEventHandler(async event => {
	const data = await validateZodQueryParams(event, querySchema);

	const result = await formSlugAvailable(data.slug);
	return { available: !result };
})