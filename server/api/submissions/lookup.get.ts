defineRouteMeta({
	openAPI: {
		summary: 'Lookup submissions',
		description: 'Lookup all form submissions, with paginated results',
		tags: ['Submissions'],
		operationId: 'lookupFormSubmissions',
		parameters: [
			{ in: 'query', required: false, schema: { type: 'integer', minimum: 0 }, name: 'page', description: 'Pagination page offset' },
			{ in: 'query', required: false, schema: { type: 'integer', minimum: 1 }, name: 'limit', description: 'Pagination result size' },
			{ in: 'query', required: false, schema: { type: 'string' }, name: 'form', description: 'A form identifier' },
			{ in: 'query', required: false, schema: { type: 'string', format: 'uuid' }, name: 'fv', description: 'A form version identifier' },
			{ in: 'query', required: false, schema: { type: 'string' }, name: 'sort', description: 'A JSON string expressing sorting orders' },
		],
		responses: {
			'200': {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: "array",
							items: {
								type: "object",
								required: ["updatedAt", "formVersion", "index", "recordedAt"],
								properties: {
									updatedAt: {
										type: "string",
										format: "date-time"
									},
									formVersion: {
										type: "string"
									},
									index: {
										type: "integer"
									},
									validationCode: {
										type: "string",
										nullable: true
									},
									recordedAt: {
										type: "string",
										format: "date-time"
									},
									currentVersion: {
										type: "object",
										nullable: true,
										properties: {
											id: {
												type: "string",
												format: "uuid"
											}
										}
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
	const { limit, page, form, fv, sort } = await validateZodQueryParams(event, LookupFormSubmissionsRequestSchema);

	try {
		return lookupFormSubmissions({
			page,
			limit,
			form,
			fv,
			sort
		})
	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
})