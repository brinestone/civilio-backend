import { defineEventHandler, setResponseStatus } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import { deleteDataset } from "~/utils/datasets";
import { validateZodRouterParams } from "~/utils/dto/zod";

const paramsSchema = z.object({
	dataset: z.uuid(),
});

defineRouteMeta({
	openAPI: {
		tags: ['Datasets'],
		summary: 'Delete dataset',
		operationId: 'deleteDatasetById',
		description: 'Delete a dataset including its items, unlinking any dependent datasets',
		parameters: [
			{ in: 'path', required: true, name: 'dataset', schema: { type: 'string', format: 'uuid' }, }
		],
		responses: {
			'204': {
				description: 'The dataset was deleted successfully'
			}
		}
	}
})
export default defineEventHandler(async event => {
	const { dataset } = await validateZodRouterParams(event, paramsSchema);

	await deleteDataset(dataset);
	setResponseStatus(event, 204);
	return;
})