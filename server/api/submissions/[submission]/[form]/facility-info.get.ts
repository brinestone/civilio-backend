import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";

export default defineEventHandler(async event => {

});

defineRouteMeta({
	openAPI: {
		operationId: 'getFacilityInfo',
		tags: ['Submissions'],
		parameters: [
			{ name: 'submission', in: 'path', required: true, schema: { type: 'integer' }, description: "The submission's index" },
			{ name: 'form', in: 'path', required: true, schema: { type: 'string' }, description: "The form's slug" },
			{ name: 'sv', in: 'query', required: false, description: "The submission's version. Leave empty to use the latest version", schema: { type: 'string', format: 'uuid' } },
			{ name: 'fv', in: 'query', required: false, description: "The form version. Leave empty, to use the current form version", schema: { type: 'string', format: 'uuid' } },
			{ name: 'tags', in: 'query', required: false, description: "A list of additional tags to include alongside the standard facility tags", schema: { type: 'array', items: { type: 'string' } } }
		],
		summary: 'Get facility info',
		description: "Retrieve the facility information, via standard tags or custom tags",
		responses: {
			200: {
				description: 'The facility info were retrieved successfully',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['approved', 'extraInfo'],
							properties: {
								approved: { type: 'boolean' },
								extraInfo: {
									type: 'object',
									additionalProperties: true
								}
							}
						}
					}
				}
			}
		},
	}
})