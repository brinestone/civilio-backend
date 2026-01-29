import { z } from "zod";

defineRouteMeta({
	openAPI: {
		tags: ['Datasets'],
		description: 'Check if dataset key is available',
		summary: 'Key check',
		$global: {
			components: {
				schemas: {
					AvailabilityResponse: {
						type: 'object',
						required: ['available'],
						properties: {
							available: {
								type: 'boolean'
							}
						}
					}
				}
			}
		},
		parameters: [
			{
				in: 'query',
				name: 'key',
				description: 'Dataset Key',
				required: true,
				example: 'commune'
			}
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
});

const queryParams = z.object({
	key: z.coerce.string()
})
export default defineEventHandler(async event => {
	const data = await validateZodRouterParams(event, queryParams);

	return { available: await datasetGroupKeyAvailable(getRouterParam(event, 'form', { decode: true })!, data!.key) }
})