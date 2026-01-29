import z from "zod";

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
					FormSection: {
						type: "object",
						properties: {
							key: {
								type: "string"
							},
							title: {
								type: "string"
							},
							relevance: {
								type: ["object", "null"]
							},
							createdAt: {
								type: "string",
								format: "date-time"
							},
							updatedAt: {
								type: "string",
								format: "date-time"
							},
							formVersion: {
								type: "string",
								format: "uuid"
							},
							fields: {
								type: "array",
								items: {
									$ref: "#/components/schemas/FormField"
								}
							}
						},
						required: ["key", "title", "createdAt", "updatedAt", "formVersion", "fields"]
					},
					RelevanceDefinition: {
						type: 'object',
						additionalProperties: { type: 'string' }
					},
					FormField: {
						type: "object",
						properties: {
							fieldId: {
								type: "string",
								format: "uuid"
							},
							createdAt: {
								type: "string",
								format: "date-time"
							},
							updatedAt: {
								type: "string",
								format: "date-time"
							},
							readonly: {
								type: "boolean"
							},
							title: {
								type: "string"
							},
							description: {
								type: ["string", "null"]
							},
							sectionKey: {
								type: ["string", "null"]
							},
							span: {
								type: "integer"
							},
							relevance: {
								$ref: '#/components/schemas/RelevanceDefinition'
							},
							formVersion: {
								type: "string",
								format: "uuid"
							},
							fieldType: {
								type: "string"
							}
						},
						required: ["fieldId", "createdAt", "updatedAt", "title", "formVersion", "fieldType"]
					},
					FormDefinition: {
						type: "object",
						properties: {
							id: {
								type: "string",
								format: "uuid"
							},
							label: {
								type: "string"
							},
							form: {
								type: "string"
							},
							createdAt: {
								type: "string",
								format: "date-time"
							},
							updatedAt: {
								type: "string",
								format: "date-time"
							},
							parentId: {
								type: ["string", "null"],
								format: "uuid"
							},
							isCurrent: {
								type: "boolean"
							},
							sections: {
								type: "array",
								items: {
									$ref: '#/components/schemas/FormSection'
								}
							},
							fields: {
								type: "array",
								items: {
									$ref: "#/components/schemas/FormField"
								}
							}
						},
						required: ["id", "label", "form", "createdAt", "updatedAt", "isCurrent", "sections", "fields"]
					},
				}
			}
		},
		responses: {
			200: {
				description: 'Form definition',
				content: {
					'application/json': {
						schema: {
							$ref: '#/components/schemas/FormDefinition'
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