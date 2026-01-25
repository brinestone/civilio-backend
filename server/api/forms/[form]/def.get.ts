import z from "zod";

const pathSchema = z.object({
	form: z.string().trim().nonempty()
})
const querySchema = z.object({
	version: z.string().trim().optional().pipe(z.uuid('version must be a UUID').optional())
});
defineRouteMeta({
	openAPI: {
		tags: ['Forms'],
		summary: 'Get form version definition',
		description: 'Get a form\'s definition by version',
		operationId: 'getFormDefinitionByVersion',
		parameters: [
			{ in: 'query', required: false, name: 'version' },
			{ in: 'path', required: true, name: 'form' }
		]
	}
});
export default defineEventHandler(async event => {
	const pathParams = await validateZodRouterParams(event, pathSchema);
	const queryParams = await validateZodQueryParams(event, querySchema);


	return await findFormDefinition(pathParams.form, queryParams.version);
})