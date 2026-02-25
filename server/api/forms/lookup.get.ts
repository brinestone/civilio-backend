import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import { ExecutionError } from "~/utils/types/errors";
import { lookupForms } from "~/utils/helpers/forms";
import { fromExecutionError } from "~/utils/misc";

const handler = async () => {
	try {
		return await lookupForms();
	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
};
export default defineEventHandler(handler);
defineRouteMeta({
	openAPI: {
		tags: ['Forms'],
		summary: 'Lookup forms',
		description: 'Lookup all forms',
		$global: {
			components: {
				schemas: {
					FormLookup: {
						type: "object",
						additionalProperties: false,
						required: ["slug", "title", /* "createdAt", */ "updatedAt"],
						properties: {
							slug: { type: "string" },
							title: { type: "string" },
							// description: { type: "string", nullable: true },
							createdBy: { type: "string", nullable: true },
							// createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
							currentVersion: {
								type: 'object',
								nullable: true,
								additionalProperties: false,
								properties: {
									id: { type: 'string', format: 'uuid' }
								}
							}
						}
					}
				}
			}
		},
		operationId: 'lookupFormDefinitions',
		responses: {
			'200': {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: "array",
							items: {
								$ref: '#/components/schemas/FormLookup'
							}
						}
					}
				}
			}
		}
	}
});
