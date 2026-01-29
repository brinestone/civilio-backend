import z from "zod";

const pathSchema = z.object({
	submission: z.coerce.number()
});

const querySchema = z.object({
	form: z.string(),
	fv: z.string().trim().optional().pipe(z.uuid('Invalid UUID').optional()),
	sv: z.string().trim().optional().pipe(z.uuid('Invalid UUID').optional())
});

defineRouteMeta({
	openAPI: {
		summary: 'Get submission data',
		tags: ['Submissions'],
		description: 'Fetch the responses for a particular submission',
		operationId: 'getSubmissionData',
		parameters: [
			{ in: 'path', name: 'submission', schema: { type: 'number' }, required: true },
			{ in: 'query', name: 'fv', schema: { type: 'string', format: 'uuid' }, required: false },
			{ in: 'query', name: 'sv', schema: { type: 'string', format: 'uuid' }, required: false },
			{ in: 'query', name: 'form', required: true }
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
								required: ["formVersion", "fieldId", "submissionIndex", "responseVersionId", "value", "field"],
								properties: {
									formVersion: { type: "string" },
									fieldId: { type: "string" },
									submissionIndex: { type: "number" },
									responseVersionId: { type: "string" },
									value: { type: "string", nullable: true },
									field: {
										type: "object",
										nullable: true,
										required: [
											"formVersion", "readonly", "description", "createdAt", "updatedAt",
											"fieldId", "title", "sectionKey", "span", "relevance", "fieldType"
										],
										properties: {
											formVersion: { type: "string" },
											readonly: { type: "boolean", nullable: true },
											description: { type: "string", nullable: true },
											createdAt: { type: "string", format: "date-time" },
											updatedAt: { type: "string", format: "date-time" },
											fieldId: { type: "string" },
											title: { type: "string" },
											sectionKey: { type: "string", nullable: true },
											span: { type: "number", nullable: true },
											relevance: { type: "object" },
											fieldType: {
												type: "string",
												enum: [
													"number", "boolean", "date", "file", "url", "text",
													"multiline", "date-time", "email", "geo-point",
													"single-select", "multi-select", "phone"
												]
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
	const pathResult = await validateZodRouterParams(event, pathSchema);
	const queryResult = await validateZodQueryParams(event, querySchema);

	try {
		return await findSubmissionResponses(
			queryResult.form,
			pathResult.submission,
			queryResult.fv,
			queryResult.sv
		);
	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
});