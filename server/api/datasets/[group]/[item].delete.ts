import z from "zod";

defineRouteMeta({
	openAPI: {
		tags: ['Datasets'],
		summary: 'Delete a dataset Item',
		description: 'Delete an item from a dataset',
		parameters: [
			{ summary: 'The dataset\'s ID', in: 'path', name: 'group', required: true },
			{ summary: 'The item\'s ID', in: 'path', name: 'item', required: true }
		]
	}
})

const paramsSchema = z.object({
	group: z.uuid(),
	item: z.uuid()
});
export default defineEventHandler(async event => {
	const data = await validateZodRouterParams(event, paramsSchema);

	await deleteOption(data.group, data.item);
	setResponseStatus(event, 202);
	return;
})