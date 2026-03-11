import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import { validateZodQueryParams, validateZodRouterParams } from "~/utils/dto/zod";
import { lookupSubmissionVersions } from "~/utils/helpers/submissions";
import { fromExecutionError } from "~/utils/misc";
import { ExecutionError } from "~/utils/types/errors";

export default defineEventHandler(async event => {
	const query = await validateZodQueryParams(event, querySchema);
	const path = await validateZodRouterParams(event, pathSchema);

	try {
		return await lookupSubmissionVersions(path.submission, path.form, query.includeArchived, query.fv);
	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
});

const pathSchema = z.object({
	submission: z.string().trim().nonempty().pipe(z.coerce.number()),
	form: z.string().trim().nonempty()
});
const querySchema = z.object({
	fv: z.string().trim().optional().pipe(z.uuid().optional()),
	sv: z.string().trim().optional().pipe(z.uuid().optional()),
	includeArchived: z.coerce.boolean().optional().default(false)
})

defineRouteMeta({
	openAPI: {
		tags: ['Submissions'],
		summary: 'Lookup submission versions',
		description: 'Lookup the versions for a submission',
		operationId: 'lookupSubmissionVersions',
		parameters: [
			{ name: 'submission', schema: { type: 'integer' }, in: 'path', required: true },
			{ name: 'form', schema: { type: 'string' }, in: 'path', required: true },
			{ name: 'fv', schema: { type: 'string', format: 'uuid' }, in: 'query', required: false, description: 'The form version. Leave empty to use the current form version' },
			// { name: 'sv', schema: { type: 'string', format: 'uuid' }, in: 'query', required: false, description: 'The submission version. Leave empty to use the current submission version' },
			{ name: 'includeArchived', schema: { type: 'boolean', default: false }, in: 'query', required: false, description: 'Whether to include archived submissions/submission versions in the results' }
		],
		responses: {
			200: {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/SubmissionVersionLookup'
							}
						}
					}
				}
			}
		},
		$global: {
			components: {
				schemas: {
					SubmissionVersionLookup: {
						type: 'object',
						additionalProperties: false,
						required: [
							'isCurrent',
							'index',
							'recordedAt',
							'tag',
							'validationCode',
							'changeNotes'
						],
						properties: {
							next: { type: 'integer', nullable: true },
							prev: { type: 'integer', nullable: true },
							tag: { type: 'string' },
							form: { type: 'string' },
							changeNotes: { type: 'string' },
							isCurrent: { type: 'boolean' },
							archivedAt: { type: 'string', format: 'date-time' },
							formVersion: { type: 'string', format: 'uuid' },
							index: { type: 'number' },
							recordedAt: { type: 'string', format: 'date-time' },
							validationCode: { type: 'string' },
							approvedAt: { type: 'string', format: 'date-time' }
						}
					}
				}
			}
		}
	}
})