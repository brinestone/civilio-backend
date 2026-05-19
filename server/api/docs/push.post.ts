import { defineRouteMeta } from "nitro";
import { defineEventHandler } from "nitro/h3";
import z from "zod";
import { provideDb } from "~/utils/db";
import { validateZodRequestBody } from "~/utils/dto/zod";
import { pushDocumentChanges } from "~/utils/helpers/docs";

const bodySchema = z.object({
	collection: z.string().trim(),
	entityKey: z.string().trim(),
	operation: z.enum(['insert', 'update', 'delete']),
	data: z.record(z.string(), z.unknown())
}).array();

export default defineEventHandler(async event => {
	const body = await validateZodRequestBody(event, bodySchema);
	const db = provideDb();
	const { documents } = await db.transaction(tx => pushDocumentChanges(tx, body));
	event.res.status = 202;
	return documents
})

defineRouteMeta({
	openAPI: {
		tags: ['Documents'],
		summary: 'Push document changes',
		operationId: 'pushDocumentChanges',
		$global: {
			components: {
				schemas: {
					PushDocumentChangeData: {
						type: 'object',
						additionalProperties: true
					},
					PushDocumentChange: {
						type: 'object',
						additionalProperties: false,
						properties: {
							collection: { type: 'string' },
							entityKey: { type: 'string' },
							operation: { type: 'string', enum: ['insert', 'update', 'delete'] },
							data: { $ref: '#/components/schemas/PushDocumentChangeData' }
						}
					},
					ChangedDocumentItem: {
						type: 'object',
						additionalProperties: false,
						required: ['collection', 'data'],
						properties: {
							collection: { type: 'string' },
							data: { type: 'object', additionalProperties: true }
						}
					}
				}
			}
		},
		responses: {
			202: {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: 'array',
							items: { $ref: '#/components/schemas/ChangedDocumentItem' }
						}
					}
				}
			}
		},
		requestBody: {
			required: true,
			content: {
				'application/json': {
					schema: {
						type: 'array',
						items: {
							$ref: '#/components/schemas/PushDocumentChange'
						}
					}
				}
			}
		}
	}
})