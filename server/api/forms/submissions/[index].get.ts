import z from "zod";

const pathSchema = z.object({
	index: z.coerce.number()
});

const querySchema = z.object({
	form: z.string(),
	formVersion: z.string().trim().optional().pipe(z.uuid('Invalid UUID').optional()),
	submissionVersion: z.string().trim().optional().pipe(z.uuid('Invalid UUID').optional())
});

defineRouteMeta({
	openAPI: {
		summary: 'Get submission data',
		tags: ['Submissions'],
		description: 'Fetch the responses for a particular submission',
		operationId: 'getSubmissionData',
		parameters: [
			{ in: 'path', name: 'index', schema: { type: 'number' }, required: true },
			{ in: 'query', name: 'formVersion', schema: { type: 'string', format: 'uuid' }, required: false },
			{ in: 'query', name: 'submissionVersion', schema: { type: 'string', format: 'uuid' }, required: false },
			{ in: 'query', name: 'form', required: true }
		]
	}
})
export default defineEventHandler(async event => {
	const pathResult = await validateZodRouterParams(event, pathSchema);
	const queryResult = await validateZodQueryParams(event, querySchema);

	try {
		return await findSubmissionResponses(
			queryResult.form,
			pathResult.index,
			queryResult.formVersion,
			queryResult.submissionVersion
		);
	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
});