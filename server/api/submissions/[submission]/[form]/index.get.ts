import {
	validateZodRouterParams,
	validateZodQueryParams
} from "~/utils/dto/zod";
import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import { ExecutionError, } from "~/utils/types/errors";
import { findSubmissionResponses } from "~/utils/helpers/submissions";
import { fromExecutionError } from "~/utils/misc";

const pathSchema = z.object({
	submission: z.coerce.number()
});

const querySchema = z.object({
	form: z.string(),
	fv: z.string().trim().optional().pipe(z.uuid('Invalid UUID').optional()),
	sv: z.string().trim().optional().pipe(z.uuid('Invalid UUID').optional())
});


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
					SubmissionResponse: {
						additionalProperties: false,
						type: 'object',
						description: 'A single submission response',
						properties: {
							submissionIndex: {
								type: 'integer',
								description: 'The index of the submission'
							},
							fieldId: {
								type: 'string',
								format: 'uuid',
								description: 'UUID of the form field'
							},
							formVersion: {
								type: 'string',
								format: 'uuid',
								description: 'UUID of the form version'
							},
							submissionTag: {
								type: 'string',
							},
							form: {
								type: 'string',
								description: 'The form identifier/slug'
							},
							value: {
								type: ['string', 'null'],
								description: 'The response value for the field'
							}
						},
						required: ['submissionIndex', 'fieldId', 'formVersion', 'submissionTag', 'form']
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
							type: 'array',
							description: 'Array of submission responses',
							items: {
								$ref: '#/components/schemas/SubmissionResponse'
							}
						}
					}
				}
			}
		}
	}
});