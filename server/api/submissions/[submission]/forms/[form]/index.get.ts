import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitro";
import z from "zod";
import { provideDb } from "~/utils/db";
import {
	validateZodQueryParams,
	validateZodRouterParams
} from "~/utils/dto/zod";
import { findSubmissionResponses } from "~/utils/helpers/submissions";
import { fromExecutionError } from "~/utils/misc";
import { ExecutionError, } from "~/utils/types/errors";

const pathSchema = z.object({
	submission: z.coerce.number(),
	form: z.string(),
});

const querySchema = z.object({
	fv: z.string().trim().optional().pipe(z.uuid('Invalid UUID').optional()),
	sv: z.string().trim().optional().pipe(z.uuid('Invalid UUID').optional())
});


export default defineEventHandler(async event => {
	const pathParams = await validateZodRouterParams(event, pathSchema);
	const queryParams = await validateZodQueryParams(event, querySchema);

	try {
		const db = provideDb();
		return await findSubmissionResponses(
			db,
			pathParams.form,
			pathParams.submission,
			queryParams.fv,
			queryParams.sv
		);
	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
});

defineRouteMeta({
	openAPI: {
		summary: 'Get submission data',
		tags: ['Submissions'],
		description: 'Fetch the responses for a particular submission',
		operationId: 'getSubmissionData',
		parameters: [
			{
				in: 'path',
				name: 'submission',
				schema: { type: 'number' },
				required: true
			},
			{
				in: 'query',
				name: 'fv',
				schema: { type: 'string', format: 'uuid' },
				required: false
			},
			{
				in: 'query',
				name: 'sv',
				schema: { type: 'string', format: 'uuid' },
				required: false
			},
			{
				in: 'path',
				name: 'form',
				required: true,
				schema: { type: 'string' }
			}
		],
		$global: {
			components: {
				schemas: {
					SubmissionData: {
						additionalProperties: true,
						type: 'object',
						description: 'A single submission response',
					},
					SubmissionMetaData: {
						type: 'object',
						additionalProperties: false,
						required: ['formVersion', 'submissionIndex', 'form', 'submissionVersion'],
						properties: {
							formVersion: { type: 'string', format: 'uuid' },
							submissionIndex: { type: 'integer', minimum: 1 },
							form: { type: 'string' },
							submissionVersion: { type: 'string', format: 'uuid' }
						}
					},
					SubmissionDataResponse: {
						type: 'object',
						additionalProperties: false,
						required: ['data', 'meta'],
						properties: {
							data: { $ref: '#/components/schemas/SubmissionData' },
							meta: { $ref: '#/components/schemas/SubmissionMetaData' }
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
							$ref: '#/components/schemas/SubmissionDataResponse'
						}
					}
				}
			}
		}
	}
});