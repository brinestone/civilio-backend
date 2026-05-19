import { defineEventHandler } from "nitro/h3";
import { defineRouteMeta } from "nitro";
import z from "zod";
import { provideDb } from "~/utils/db";
import { validateZodQueryParams, validateZodRouterParams } from "~/utils/dto/zod";
import { pullDocumentChanges } from "~/utils/helpers/docs";

const queryParamsSchema = z.object({
	batchSize: z.coerce.number().int().positive().min(1).default(1),
	lastCheckpoint: z.coerce.date().nullish()
});
const pathParamsSchema = z.object({
	collection: z.string()
})

export default defineEventHandler(async event => {
	const { batchSize, lastCheckpoint } = await validateZodQueryParams(event, queryParamsSchema);
	const { collection } = await validateZodRouterParams(event, pathParamsSchema);
	const db = provideDb();
	const { documents, lastCheckpoint: checkpoint } = await pullDocumentChanges(db, collection, batchSize, lastCheckpoint);
	return { documents, checkpoint };
})

defineRouteMeta({
	openAPI: {
		tags: ['Documents'],
		summary: 'Pull document changes',
		description: 'Pull changes from after a checkpoint',
		operationId: 'pullDocumentChanges',
		parameters: [
			{ in: 'path', required: true, name: 'collection', schema: { type: 'string' }, description: 'The collection to filter from' },
			{ in: 'query', name: 'lastCheckpoint', schema: { type: 'number' }, description: 'The last checkpoint to begin pulling changes after expressed in milliseconds' },
			{ in: 'query', name: 'batchSize', schema: { type: 'integer', minimum: 1, default: 1 }, description: 'The size of the result set' }
		],
		responses: {
			200: {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							additionalProperties: false,
							required: ['documents', 'checkpoint'],
							properties: {
								checkpoint: { type: 'string', format: 'date-time' },
								documents: {
									type: 'array',
									items: { $ref: '#/components/schemas/DocumentChange' }
								}
							}
						}
					}
				}
			}
		},
		$global: {
			components: {
				schemas: {
					DocumentChange: {
						type: 'object',
						additionalProperties: true,
						required: [
							'isDeleted'
						],
						properties: {
							isDeleted: { type: 'boolean' }
						}
					}
				}
			}
		}
	}
})