import { defineEventHandler, setResponseStatus } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import { upsertFormOptions } from "~/utils/datasets";
import { DatasetUpsertRequestSchema } from "~/utils/dto";
import { validateZodRequestBody } from "~/utils/dto/zod";

const bodySchema = DatasetUpsertRequestSchema;
defineRouteMeta({
	openAPI: {
		summary: 'Create or update dataset',
		tags: ['Datasets'],
		description: 'Creates or updates a dataset',
		operationId: 'upsertDataset',
		$global: {
			components: {
				requestBodies: {
					UpsertFormDatasetRequest: {
						required: true,
						content: {
							'application/json': {
								schema: {
									type: 'array',
									items: {
										oneOf: [
											{ $ref: '#/components/schemas/DatasetInsert' },
											{ $ref: '#/components/schemas/DatasetUpdate' }
										],
										discriminator: {
											propertyName: 'isNew',
											mapping: {
												true: '#/components/schemas/DatasetInsert',
												false: '#/components/schemas/DatasetUpdate'
											}
										}
									}
								} as any
							}
						}
					}
				},
				schemas: {
					NewDatasetItem: {
						type: 'object',
						additionalProperties: false,
						required: ['value', 'ordinal', 'label', 'isNew'],
						properties: {
							isNew: { type: 'string', enum: ['true'] },
							label: { type: 'string' },
							parentValue: { type: 'string', nullable: true },
							value: { type: 'string' },
							ordinal: { type: 'integer' }
						}
					},
					ExistingDatasetItemUpdate: {
						type: 'object',
						additionalProperties: false,
						required: ['value', 'ordinal', 'label', 'isNew', 'id'],
						properties: {
							isNew: { type: 'string', enum: ['false'] },
							id: { type: 'string', format: 'uuid' },
							label: { type: 'string' },
							parentValue: { type: 'string', nullable: true },
							value: { type: 'string' },
							ordinal: { type: 'integer' }
						}
					},
					DatasetInsert: {
						type: 'object',
						additionalProperties: false,
						required: ['isNew', 'data'],
						properties: {
							isNew: { type: 'string', enum: ['true'] },
							data: {
								type: 'object',
								required: ['title', 'key', 'items'],
								additionalProperties: false,
								properties: {
									description: { type: 'string', nullable: true },
									title: { type: 'string', },
									parentId: { type: 'string', nullable: true },
									key: { type: 'string', },
									items: {
										type: 'array',
										default: [],
										items: {
											$ref: '#/components/schemas/NewDatasetItem'
										}
									}
								}
							}
						}
					},
					DatasetUpdate: {
						type: 'object',
						additionalProperties: false,
						required: ['isNew', 'data'],
						properties: {
							isNew: { type: 'string', enum: ['false'] },
							data: {
								type: 'object',
								additionalProperties: false,
								required: ['id'],
								properties: {
									id: { type: 'string', format: 'uuid' },
									description: { type: 'string', nullable: true },
									title: { type: 'string' },
									parentId: { type: 'string', nullable: true },
									key: { type: 'string', },
									items: {
										type: 'array',
										default: [],
										items: {
											oneOf: [
												{
													$ref: '#/components/schemas/NewDatasetItem'
												},
												{
													$ref: '#/components/schemas/ExistingDatasetItemUpdate'
												}
											]
										}
									}
								}
							} as any
						}
					}
				}
			},
		},
		requestBody: {
			$ref: '#/components/requestBodies/UpsertFormDatasetRequest'
		},
		responses: {
			'202': {
				description: 'Changes saved successfully'
			}
		}
	}
});
export default defineEventHandler(async event => {
	// const paramsResult = await getValidatedRouterParams(event, paramsSchema.safeParse);
	const bodyResult = await validateZodRequestBody(event, bodySchema);

	await upsertFormOptions(bodyResult);
	setResponseStatus(event, 202);
	return;
})