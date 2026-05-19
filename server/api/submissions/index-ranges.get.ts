import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitro";
import z from "zod";
import { validateZodQueryParams } from "~/utils/dto/zod";
import { findSparseSubmissionIndexRanges } from "~/utils/helpers/submissions";
import { fromExecutionError } from "~/utils/misc";
import { ExecutionError } from "~/utils/types/errors";

export default defineEventHandler(async event => {
	const query = await validateZodQueryParams(event, querySchema);
	// const path = await validateZodRouterParams(event, pathSchema);
	try {
		return findSparseSubmissionIndexRanges(query.form, query.limit, query.includeArchived, query.after);
	} catch (e) {
		if (e instanceof ExecutionError) throw fromExecutionError(e);
		throw e;
	}
});

const querySchema = z.object({
	after: z.coerce.number().optional().default(0),
	includeArchived: z.coerce.boolean().optional(),
	form: z.string().trim().nonempty(),
	limit: z.coerce.number().optional().default(5)
});

defineRouteMeta({
	openAPI: {
		operationId: 'findSparseIndexRanges',
		tags: ['Submissions'],
		parameters: [
			{ name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1 } },
			{ name: 'after', in: 'query', required: false, schema: { type: 'string' } },
			{ name: 'form', in: 'query', required: true, schema: { type: 'string' } },
			{ name: 'includeArchived', in: 'query', required: false, schema: { type: 'boolean', default: false } },
		],
		summary: 'Find index ranges',
		description: 'Find sparse submission index ranges',
		responses: {
			200: {
				description: 'The ranges of submission indexes for the form',
				content: {
					'application/json': {
						schema: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/IndexRange'
							}
						}
					}
				}
			}
		},
		$global: {
			components: {
				schemas: {
					IndexRange: {
						type: 'object',
						additionalProperties: false,
						required: ['start', 'end', 'count', 'hasMore'],
						properties: {
							start: { type: 'number' },
							count: { type: 'number' },
							end: { type: 'number' },
							// hasMore: { type: 'boolean' },
							// nextCursor: { type: 'number' }
						}
					}
				}
			}
		}
	}
})