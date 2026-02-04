import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import { lookupDatasets } from "~/utils/datasets";
import { validateZodQueryParams } from "~/utils/dto/zod";

const querySchema = z.object({
	page: z.string().trim().optional().default('0').pipe(z.coerce.number()),
	size: z.string().trim().optional().default('10').pipe(z.coerce.number()),
	filter: z.string().trim().optional()
});

defineRouteMeta({
	openAPI: {
		tags: ['Datasets'],
		operationId: 'lookupDatasets',
		summary: 'Lookup datasets',
		description: 'Returns a paginated set of ',
		$global: {
			components: {
				schemas: {
					DatasetLookup: {
						type: 'object',
						additionalProperties: false,
						required: ['id', 'title', 'key', 'createdAt', 'updatedAt', 'itemCount'],
						properties: {
							id: { type: 'string', format: 'uuid' },
							title: { type: 'string' },
							description: { type: 'string', nullable: true },
							createdAt: { type: 'string', format: 'date-time' },
							updatedAt: { type: 'string', format: 'date-time' },
							itemCount: { type: 'integer', minimum: 0 }
						}
					}
				}
			}
		},
		parameters: [
			{ in: 'query', required: false, schema: { type: 'integer', minimum: 0, default: 0 }, name: 'page', },
			{ in: 'query', required: false, schema: { type: 'integer', minimum: 1, default: 10 }, name: 'size', },
			{ in: 'query', required: false, schema: { type: 'string' }, name: 'filter' }
		],
		responses: {
			'200': {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							additionalProperties: false,
							required: ['totalRecords', 'data'],
							properties: {
								totalRecords: { type: 'integer', minimum: 0 },
								data: {
									type: 'array',
									items: {
										$ref: '#/components/schemas/DatasetLookup'
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
	const query = await validateZodQueryParams(event, querySchema);
	return await lookupDatasets(query.page, query.size, query.filter);
})