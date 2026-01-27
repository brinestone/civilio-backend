import z from "zod";

const pathSchema = z.object({
	form: z.string(),
});
const querySchema = z.object({
	index: z.coerce.number('Invalid index value'),
	version: z.string().trim().nonempty().pipe(z.uuid('Invalid UUID'))
});

defineRouteMeta({
	openAPI: {
		summary: 'Check version',
		tags: ['Submissions'],
		description: 'Check whether a submission version exists',
		operationId: 'checkSubmissionVersionExists',
		parameters: [
			{ in: 'path', required: true, name: 'form', description: 'The form slug to identify the form', schema: { type: 'string' } },
			{ in: 'query', required: true, name: 'index', description: 'The submission index', schema: { type: 'integer' } },
			{ in: 'query', required: true, name: 'version', description: 'The version of the submission', schema: { type: 'string' } }
		]
	}
});
export default defineEventHandler(async event => {
	const paramResult = await validateZodRouterParams(event, pathSchema);
	const queryResult = await validateZodQueryParams(event, querySchema);

	return await submissionVersionExists(
		paramResult.form,
		queryResult.index,
		queryResult.version
	);
})