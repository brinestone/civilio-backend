import z from "zod"

const pathSchema = z.object({
	index: z.coerce.number(),
	form: z.string()
});

defineRouteMeta({
	openAPI: {
		tags: ['Submissions'],
		summary: 'Toggle approval status',
		description: 'Toggles the approval status of a submission for a given form and index.',
		parameters: [
			{ in: 'path', name: 'form', schema: { type: 'string' }, required: true, description: 'The form identifier' },
			{ in: 'path', name: 'index', schema: { type: 'integer' }, required: true, description: 'The submission index' }
		]
	}
});
export default defineEventHandler(async event => {
	const args = await validateZodRouterParams(event, pathSchema);
	await toggleApprovalStatus(args);
})