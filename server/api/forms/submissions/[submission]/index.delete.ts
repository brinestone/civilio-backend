import z from "zod";

const pathSchema = z.object({
	submission: z.string().trim().pipe(z.coerce.number()),
	form: z.string().trim().nonempty('form cannot be empty'),
});

const querySchema = z.object({
	fv: z.union([z.string().trim().pipe(z.uuid('Invalid UUID')), z.literal('current')]).optional(),
	sv: z.string().trim().optional().pipe(z.uuid('Invalid UUID').optional()),
});

defineRouteMeta({
	openAPI: {
		summary: 'Delete submission',
		description: 'Deletes a submission from a form, either from all form versions, or a for a particular form version or for a particular submission version',
		operationId: 'performSubmissionDeletion',
		tags: ['Submissions'],
		parameters: [
			{ in: 'path', required: true, name: 'submission', description: 'The submission index', schema: { type: 'integer' } },
			{ in: 'query', required: true, name: 'form', description: 'The form slug to identify the form', schema: { type: 'string' } },
			{ in: 'query', name: 'fv', example: 'current', schema: { type: 'string' }, required: false, summary: 'The form version UUID', description: 'The form version to use, leave empty to use the current version' },
			{ in: 'query', name: 'sv', example: 'current', schema: { type: 'string' }, required: false, summary: 'The submission version UUID', description: 'The submission version to use, leave empty to delete all versions, use "current" to delete the current version' },
		],
		responses: {
			'202': {
				description: 'Deletion successful',
				content: {
					'application/json': {
						schema: {
							required: ['versionsDeleted', 'responsesDeleted'],
							type: 'object',
							description: 'Summary of the deletion',
							properties: {
								versionsDeleted: {
									type: 'integer',
									default: 0,
									description: 'The number of submission versions deleted'
								},
								responsesDeleted: {
									type: 'integer',
									default: 0,
									description: 'The number of response values deleted'
								}
							}
						}
					}
				}
			}
		}
	}
})
export default defineEventHandler(async event => {
	const { form, submission } = await validateZodRouterParams(event, pathSchema);
	const { fv, sv } = await validateZodQueryParams(event, querySchema);
	try {
		setResponseStatus(event, 202);
		return await deleteSubmission({
			index: submission,
			form,
			formVersion: fv,
			submissionVersion: sv
		});
	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
});