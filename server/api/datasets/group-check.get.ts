import { z } from "zod";

defineRouteMeta({
	openAPI: {
		tags: ['Datasets'],
		description: 'Check if dataset key is available',
		summary: 'Key check',
		parameters: [
			{
				in: 'query',
				name: 'key',
				summary: 'Dataset Key',
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
	const data = await validateZodRouterParams(event, queryParams);

	return { available: await datasetGroupKeyAvailable(getRouterParam(event, 'form', { decode: true })!, data!.key) }
})