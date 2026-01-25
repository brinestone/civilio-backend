import z from "zod";

const paramsSchema = z.object({
	group: z.uuid(),
});

defineRouteMeta({
	openAPI: {
		tags: ['Datasets'],
		summary: 'Delete dataset',
		description: 'Delete a dataset including its items, unlinking any dependent datasets',
		parameters: [
			{ in: 'path', required: true, name: 'group' }
		]
	}
})
export default defineEventHandler(async event => {
	const { error, success, data } = await getValidatedRouterParams(event, paramsSchema.safeParse);
	if (!success) {
		setResponseStatus(event, 400);
		return { message: z.treeifyError(error) };
	}

	await deleteGroup(data.group);
	setResponseStatus(event, 202);
	return;
})