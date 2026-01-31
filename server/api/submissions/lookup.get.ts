import { validateZodQueryParams } from "~/utils/dto/zod";
import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import { LookupFormSubmissionsRequestSchema } from "~/utils/dto";
import { ExecutionError, fromExecutionError } from "~/utils/errors";
import { lookupFormSubmissions } from "~/utils/submissions";

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
		$global: {
			components: {
				schemas: {
					SubmissionVersionLookup: {
						type: 'object',
						required: ['id', 'recordedAt', 'validationCode', 'isCurrent'],
						properties: {
							id: { type: 'string', format: 'uuid' },
							isCurrent: { type: 'boolean' },
							recordedAt: { type: 'string', format: 'date-time' },
							validationCode: { type: 'string' },
							approvedAt: { type: 'string', format: 'date-time' }
						}
					},
					SubmissionLookup: {
						type: 'object',
						required: ['form', 'formVersion', 'index', 'recordedAt', 'versions'],
						properties: {
							form: { type: 'string' },
							formVersion: { type: 'string', format: 'uuid' },
							index: { type: 'integer' },
							recordedAt: { type: 'string', format: 'date-time' },
							versions: {
								type: 'array',
								items: {
									$ref: '#/components/schemas/SubmissionVersionLookup'
								}
							}
						}
					}
				}
			}
		},
		responses: {
			'200': {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: "array",
							items: {
								$ref: '#/components/schemas/SubmissionLookup'
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