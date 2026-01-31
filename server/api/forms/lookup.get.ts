import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import { ExecutionError, fromExecutionError } from "~/utils/errors";
import { lookupForms } from "~/utils/forms";

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
						required: ["slug", "label", "createdAt", "updatedAt"],
						properties: {
							slug: { type: "string" },
							logo: { type: "string", nullable: true },
							label: { type: "string" },
							description: { type: "string", nullable: true },
							createdBy: { type: "string", nullable: true },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" }
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