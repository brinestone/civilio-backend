import { defineEventHandler, setResponseStatus } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import { createDatasetReference } from "~/utils/datasets";
import { NewDatasetRefRequestSchema } from "~/utils/dto";
import { validateZodRequestBody } from "~/utils/dto/zod";
import { ExecutionError, fromExecutionError } from "~/utils/errors";

const bodySchema = NewDatasetRefRequestSchema;

defineRouteMeta({
	openAPI: {
		tags: ['Datasets'],
		summary: 'Create a dataset reference',
		operationId: 'createDatasetReference',
		$global: {
			components: {
				requestBodies: {
					NewDatasetRefRequest: {
						content: {
							'application/json': {
								schema: {
									type: 'object',
									additionalProperties: false,
									required: ['dataset', 'selectAll', 'followDatasetUpdates'],
									properties: {
										dataset: { description: 'The dataset ID', type: 'string', format: 'uuid' },
										selectedItems: {
											description: 'The item IDs under the referenced dataset',
											type: 'array',
											items: { type: 'string', format: 'uuid' }
										},
										selectAll: { description: 'Whether all items in the dataset should be used', type: 'boolean' },
										followDatasetUpdates: { description: 'Whether to update this reference if the dataset items updates. This is only relevant if the selectAll option is enabled', type: 'boolean' }
									}
								}
							}
						}
					}
				}
			}
		},
		requestBody: {
			$ref: '#/components/requestBodies/NewDatasetRefRequest'
		},
		responses: {
			'201': {
				description: 'Reference was created successfully',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							additionalProperties: false,
							required: ['ref'],
							properties: {
								ref: { type: 'string' }
							}
						}
					}
				}
			}
		}
	}
})

export default defineEventHandler(async event => {
	const dto = await validateZodRequestBody(event, bodySchema);
	try {
		const result = await createDatasetReference(dto);
		setResponseStatus(event, 201);
		return { ref: result };
	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
})