import z from "zod"

const pathSchema = z.object({
	submission: z.coerce.number()
});

const querySchema = z.object({
	form: z.string().trim().nonempty(),
	fv: z.string().trim().optional().pipe(z.uuid('Invalid UUID').optional()),
	sv: z.string().trim().optional().pipe(z.uuid('Invalid UUID').optional())
})

defineRouteMeta({
	openAPI: {
		tags: ['Submissions'],
		summary: 'Toggle approval status',
		operationId: 'toggleSubmissionApprovalStatus',
		description: 'Toggles the approval status of a submission for a given form and index.',
		parameters: [
			{ in: 'query', name: 'form', schema: { type: 'string' }, required: true, description: 'The form identifier' },
			{ in: 'path', name: 'submission', schema: { type: 'integer' }, required: true, description: 'The submission index' },
			{ in: 'query', name: 'fv', schema: { type: 'string' }, required: false, description: 'The form version to use, leave empty to use the latest or current version' },
			{ in: 'query', name: 'sv', schema: { type: 'string' }, required: false, description: 'The submission version to use, leave empty to use the latest or current version' },
		],
		responses: {
			'202': {
				description: 'The status for the submission was toggled successfully',
			}
		}
	}
});
export default defineEventHandler(async event => {
	const { submission } = await validateZodRouterParams(event, pathSchema);
	const { form, fv, sv } = await validateZodQueryParams(event, querySchema);
	try {
		await toggleApprovalStatus({
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
	setResponseStatus(event, 202);
})