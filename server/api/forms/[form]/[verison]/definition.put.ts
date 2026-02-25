import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import { FormItemDefinitionSchema } from "~/utils/dto/form";
import { validateZodRequestBody } from "~/utils/dto/zod";
import { fromExecutionError } from '~/utils/misc';
import { ExecutionError } from "~/utils/types/errors";

export default defineEventHandler(async event => {
	const body = await validateZodRequestBody(event, bodySchema);

	try {

	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
});

const bodySchema = z.object({
	addedItems: FormItemDefinitionSchema.array(),
	updatedItems: FormItemDefinitionSchema.array(),
	removedItems: z.uuid('Invalid Item ID. Must be UUID').array()
});

defineRouteMeta({
	openAPI: {
		tags: ['Forms'],
		summary: 'Update form definition',
		description: 'Update a form version\'s definition',
		$global: {
			components: {
				schemas: {
					UpdateFormDefinitionRequest: {
						type: 'object',
						additionalProperties: false,
						properties: {
							addedItems: {
								default: [],
								type: 'array',
								items: {
									$ref: '#/components/schemas/FormItemDefinition'
								}
							},
							updatedItems: {
								default: [],
								type: 'array',
								items: {
									$ref: '#/components/schemas/FormItemDefinition'
								}
							},
							removedItems: {
								type: 'array',
								items: {
									type: 'string', format: 'uuid'
								}
							}
						}
					}
				}
			}
		},
		requestBody: {
			description: 'Deltas payload',
			required: true,
			content: {
				'application/json': {
					schema: {
						$ref: '#/components/schemas/UpdateFormDefinitionRequest'
					}
				}
			}
		},
		responses: {
			202: {
				description: 'Update successful',
			}
		}
	}
});