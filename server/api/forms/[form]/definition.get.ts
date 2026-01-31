import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import { validateZodQueryParams, validateZodRouterParams } from "~/utils/dto/zod";
import { ExecutionError, fromExecutionError, NotFoundError } from "~/utils/errors";
import { findFormDefinition } from "~/utils/forms";

const pathSchema = z.object({
	form: z.string().trim().nonempty()
})
const querySchema = z.object({
	version: z.string().trim().optional().pipe(z.uuid('version must be a UUID').optional())
});
defineRouteMeta({
	openAPI: {
		tags: ['Forms'],
		summary: 'Get form version definition',
		description: 'Get a form\'s definition by version',
		operationId: 'getFormDefinitionByVersion',
		parameters: [
			{ in: 'query', required: false, name: 'version' },
			{ in: 'path', required: true, name: 'form' }
		],
		$global: {
			components: {
				schemas: {
					FormVersionDefinition: {
						type: 'object',
						additionalProperties: false,
						properties: {
							id: { type: 'string', format: 'uuid' },
							parentId: { nullable: true, type: 'string', format: 'uuid' },
							items: { nullable: false, type: 'array', items: { $ref: '#/components/schemas/FormItemDefinition' } }
						},
						required: ['id', 'items']
					},
					FormItemParentRef: {
						type: 'object',
						additionalProperties: false,
						required: ['id'],
						properties: {
							id: { type: 'string', format: 'uuid' }
						}
					},
					FormItemDefinition: {
						type: 'object',
						additionalProperties: false,
						properties: {
							type: {
								type: 'string',
								enum: ["field", "note", "image", "group", "list", "separator"]
							},
							description: {
								type: 'string',
								nullable: true,
							},
							id: { type: 'string', format: 'uuid' },
							title: { type: 'string' },
							relevance: { $ref: '#/components/schemas/RelevanceDefinition', nullable: true },
							meta: { type: 'object', additionalProperties: true, },
							position: { type: 'integer' },
							parent: {
								type: 'object',
								nullable: true,
								$ref: '#/components/schemas/FormItemParentRef'
							}
						},
						required: ['id', 'type', 'title', 'position']
					},
					RelevanceDefinition: {
						type: 'object',
						additionalProperties: true,
						properties: {
							dependencies: {
								type: 'array',
								items: { type: 'string' }
							},
						},
						required: ['logic', 'dependencies']
					}
				}
			}
		},
		responses: {
			200: {
				description: 'Form definition',
				content: {
					'application/json': {
						schema: {
							$ref: '#/components/schemas/FormVersionDefinition'
						}
					}
				}
			},
			404: {
				description: 'Form definition not found'
			}
		}
	}
});
export default defineEventHandler(async event => {
	const pathParams = await validateZodRouterParams(event, pathSchema);
	const queryParams = await validateZodQueryParams(event, querySchema);

	try {
		const result = await findFormDefinition(pathParams.form, queryParams.version);

		if (!result)
			throw new NotFoundError('definition not found');
		return result;
	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
})