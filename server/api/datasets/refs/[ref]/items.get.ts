import { defineEventHandler, setHeader } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import { findDatasetRefItems } from "~/utils/datasets";
import { validateZodRouterParams } from "~/utils/dto/zod";
import { ExecutionError, fromExecutionError } from "~/utils/errors";

const pathSchema = z.object({
	ref: z.string().trim().nonempty('ref cannot be empty')
});

defineRouteMeta({
	openAPI: {
		tags: ['Datasets'],
		summary: 'Get reference items',
		description: 'Get the items under a dataset reference',
		operationId: 'findDatasetRefItems',
		parameters: [
			{ in: 'path', name: 'ref', schema: { type: 'string' }, required: true, allowEmptyValue: false, description: 'The ID of the reference' }
		],
		responses: {
			'400': { description: 'Bad request' },
			'404': { description: 'Reference does not exist' },
			'200': {
				description: 'OK',
				headers: {
					'x-dataset-title': { description: 'The title of the referenced dataset', required: true, schema: { type: 'string' } },
					'x-dataset-id': { description: 'The ID of the referenced dataset', required: true, schema: { type: 'string', format: 'uuid' } },
				},
				content: {
					'application/json': {
						schema: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/DatasetItem'
							}
						}
					}
				}
			}
		}
	}
})
export default defineEventHandler(async event => {
	const path = await validateZodRouterParams(event, pathSchema);
	try {
		const { items, dataset } = await findDatasetRefItems(path.ref);
		setHeader(event, 'x-dataset-title', dataset.title);
		setHeader(event, 'x-dataset-id', dataset.id);
		return items;
	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
})