import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import { lookupDatasetItems } from "~/utils/helpers/datasets";
import { validateZodQueryParams, validateZodRouterParams } from "~/utils/dto/zod";

const pathSchema = z.object({
	dataset: z.string().trim().nonempty('dataset cannot be empty').pipe(z.uuid('Invalid UUID'))
});

/* DatasetItem: {
						type: 'object',
						additionalProperties: false,
						required: ['id', 'label', 'ordinal', 'value'],
						properties: {
							id: { type: 'string', 'format': 'uuid' },
							label: { type: 'string' },
							parentValue: { type: 'string' },
							ordinal: { type: 'integer', minimum: 0 },
							value: { type: 'string' },
						}
					} */

const querySchema = z.object({
	page: z.string().trim().optional().default('0').pipe(z.coerce.number()).pipe(z.int('Value must be a positive integer').min(0, 'Value cannot be less than 0')),
	size: z.string().trim().optional().default('10').pipe(z.coerce.number()).pipe(z.int('Value must be a positive integer').min(1, 'Value cannot be less than 1')),
	filter: z.string().trim().optional()
});

defineRouteMeta({
	openAPI: {
		summary: 'Lookup dataset items',
		operationId: 'lookupDatasetItems',
		tags: ['Datasets'],
		description: 'Fetches a paginated set of dataset items under a particular dataset',
		parameters: [
			{ in: 'path', name: 'dataset', schema: { type: 'string', format: 'uuid' }, required: true, description: 'The dataset ID' },
			{ in: 'query', name: 'page', schema: { type: 'integer', minimum: 0, default: 0 }, required: false },
			{ in: 'query', name: 'size', schema: { type: 'integer', minimum: 1, default: 10 }, required: false },
			{ in: 'query', name: 'filter', schema: { type: 'string' }, required: false },
		],
		responses: {
			'200': {
				description: 'Response payload',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							additionalProperties: false,
							required: ['data', 'totalRecords'],
							properties: {
								totalRecords: { type: 'integer' },
								data: {
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
		}
	}
})

export default defineEventHandler(async event => {
	const path = await validateZodRouterParams(event, pathSchema);
	const query = await validateZodQueryParams(event, querySchema);

	return await lookupDatasetItems(path.dataset, query.page, query.size, query.filter);
})