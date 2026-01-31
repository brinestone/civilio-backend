import { validateZodRouterParams, validateZodQueryParams } from "~/utils/dto/zod";
import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import { ExecutionError, fromExecutionError } from "~/utils/errors";
import { findSubmissionResponses } from "~/utils/submissions";

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
		$global: {
			components: {
				schemas: {
					SubmissionResponse: {
						type: 'object',
						description: 'A single submission response',
						properties: {
							submissionIndex: {
								type: 'integer',
								format: 'int64',
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
							submissionVersionId: {
								type: 'string',
								format: 'uuid',
								description: 'UUID of the submission version (response_id in database)'
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
						required: ['submissionIndex', 'fieldId', 'formVersion', 'submissionVersionId', 'form']
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
								$ref: '#/components/schema/SubmissionResponse'
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