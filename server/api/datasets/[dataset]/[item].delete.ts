import { defineEventHandler, setResponseStatus } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import { deleteOption } from "~/utils/datasets";
import { validateZodRouterParams } from "~/utils/dto/zod";

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
	setResponseStatus(event, 204);
	return;
})