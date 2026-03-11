import { validateZodQueryParams } from "~/utils/dto/zod";
import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import { LookupFormSubmissionsRequestSchema } from "~/utils/dto/submission";
import { ExecutionError, } from "~/utils/types/errors";
import { lookupFormSubmissions } from "~/utils/helpers/submissions";
import { fromExecutionError } from "~/utils/misc";

export default defineEventHandler(async event => {
	const {
		limit,
		page,
		includeArchived,
		form,
		version,
		filter,
		// sort
	} = await validateZodQueryParams(event, LookupFormSubmissionsRequestSchema);

	try {
		return lookupFormSubmissions({
			page,
			limit,
			form,
			includeArchived,
			version,
			filter,
			// sort
		})
	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
});

defineRouteMeta({
	openAPI: {
		summary: 'Lookup submissions',
		description: 'Lookup all form submissions, with paginated results',
		tags: ['Submissions'],
		operationId: 'lookupFormSubmissions',
		parameters: [
			{
				in: 'query',
				name: 'includeArchived',
				required: false,
				schema: { type: 'boolean', default: false },
				description: 'Whether or not archived submissions should be included'
			},
			{
				in: 'query',
				required: false,
				schema: { type: 'string' },
				description: 'A filter to filter the results',
				name: 'filter'
			},
			{
				in: 'query',
				required: false,
				schema: { type: 'integer', minimum: 0 },
				name: 'page',
				description: 'Pagination page offset'
			},
			{
				in: 'query',
				required: false,
				schema: { type: 'integer', minimum: 1 },
				name: 'limit',
				description: 'Pagination result size'
			},
			{
				in: 'query',
				required: false,
				schema: { type: 'string' },
				name: 'form',
				description: 'A form identifier'
			},
			{
				in: 'query',
				required: false,
				schema: { type: 'string', format: 'uuid' },
				name: 'fv',
				description: 'A form version identifier'
			},
		],
		$global: {
			components: {
				schemas: {
					SubmissionLookup: {
						additionalProperties: false,
						type: 'object',
						required: ['form', 'formVersion', 'index', 'recordedAt', 'versionCount'],
						properties: {
							slug: { type: 'string' },
							form: { type: 'string' },
							formVersion: { type: 'string', format: 'uuid' },
							index: { type: 'integer' },
							recordedAt: { type: 'string', format: 'date-time' },
							lastUpdatedAt: { type: 'string', format: 'date-time' },
							versionCount: {
								type: 'integer',
								minimum: 0,
								default: 0
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
							type: 'object',
							additionalProperties: false,
							required: ['data', 'totalRecords'],
							properties: {
								totalRecords: { type: 'integer', minimum: 0 },
								data: {
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
		}
	}
});