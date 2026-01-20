import z, { prettifyError } from "zod";

defineRouteMeta({
	openAPI: {
		tags: ['Datasets'],
		summary: 'Delete an option',
		description: 'Delete an option from a group of options',
		parameters: [
			{ in: 'path', name: 'group', required: true },
			{ in: 'path', name: 'item', required: true }
		]
	}
})

const paramsSchema = z.object({
	group: z.uuid(),
	item: z.uuid()
});
export default defineEventHandler(async event => {
	const { success, data, error } = await getValidatedRouterParams(event, paramsSchema.safeParse);
	if (!success) {
		setResponseStatus(event, 400);
		return { message: prettifyError(error) };
	}

	await deleteOption(data.group, data.item);
	setResponseStatus(event, 202);
	return;
})