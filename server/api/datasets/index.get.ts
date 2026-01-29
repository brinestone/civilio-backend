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
							type: 'object',
							required: ['groups'],
							properties: {
								groups: {
									type: 'array',
									items: {
										$ref: '#/components/schemas/Dataset'
									}
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
					DatasetItem: {
						type: 'object',
						required: ['id', 'label', 'ordinal', 'value'],
						properties: {
							id: { type: 'string', 'format': 'uuid' },
							label: { type: 'string' },
							parentValue: { type: 'string' },
							ordinal: { type: 'integer', minimum: 0 },
							value: { type: 'string' },
							i18nKey: { type: 'string' }
						}
					},
					DatasetParentRef: {
						type: 'object',
						required: ['key', 'title'],
						properties: {
							title: { type: 'string' },
							description: { type: 'string' },
							key: { type: 'string' },
						}
					},
					Dataset: {
						type: 'object',
						required: ['title', 'id', 'key', 'createdAt', 'updatedAt', 'items'],
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
	const groups = await findAllDatasets();
	return FindAllDatasetsResponseSchema.parse({ groups });
});