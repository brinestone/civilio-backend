import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import { findAllDatasets } from "~/utils/datasets";

defineRouteMeta({
	openAPI: {
		tags: ['Datasets'],
		summary: 'Get Datasets',
		responses: {
			'200': {
				description: 'Datasets payload',
				content: {
					'application/json': {
						schema: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/Dataset'
							}
						}
					}
				}
			}
		},
		$global: {
			components: {
				responses: {
					NotFound: {
						description: 'Dataset not found'
					},
					Unauthorized: {
						description: 'Unauthorized access'
					},
					BadRequest: {
						description: 'Invalid request parameters'
					}
				},
				schemas: {
					DatasetItem: {
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
					},
					DatasetParentRef: {
						type: 'object',
						required: ['key', 'title'],
						additionalProperties: false,
						properties: {
							title: { type: 'string' },
							description: { type: 'string' },
							key: { type: 'string' },
						}
					},
					Dataset: {
						type: 'object',
						required: ['title', 'id', 'key', 'createdAt', 'updatedAt', 'items'],
						additionalProperties: false,
						properties: {
							description: { type: 'string' },
							title: { type: 'string' },
							id: { type: 'string', format: 'uuid' },
							key: { type: 'string' },
							parentId: { type: 'string', format: 'uuid' },
							createdAt: { type: 'string', format: 'date-time' },
							updatedAt: { type: 'string', format: 'date-time' },
							items: {
								type: 'array',
								items: {
									$ref: '#/components/schemas/DatasetItem'
								}
							},
							parent: {
								nullable: true,
								$ref: '#/components/schemas/DatasetParentRef'
							}
						}
					}
				}
			}
		}
	}
});

export default defineEventHandler(async () => {
	return await findAllDatasets();
});