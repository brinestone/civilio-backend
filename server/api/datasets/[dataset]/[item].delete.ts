import { defineRouteMeta } from "nitro";
import { defineEventHandler } from "nitro/h3";
import z from "zod";
import { validateZodRouterParams } from "~/utils/dto/zod";
import { deleteOption } from "~/utils/helpers/datasets";

defineRouteMeta({
	openAPI: {
		tags: ['Datasets'],
		operationId: 'deleteDatasetItemById',
		summary: 'Delete a dataset Item',
		description: 'Delete an item from a dataset',
		parameters: [
			{ description: 'The dataset\'s ID', in: 'path', name: 'dataset', schema: { type: 'string', format: 'uuid' }, required: true },
			{ description: 'The item\'s ID', in: 'path', name: 'item', required: true, schema: { type: 'string', format: 'uuid' }, }
		],
		responses: {
			'204': {
				description: 'The dataset item was deleted successfully'
			}
		}
	}
})

const paramsSchema = z.object({
	dataset: z.uuid(),
	item: z.uuid()
});
export default defineEventHandler(async event => {
	const data = await validateZodRouterParams(event, paramsSchema);

	await deleteOption(data.dataset, data.item);
	event.res.status = 204
	return;
})