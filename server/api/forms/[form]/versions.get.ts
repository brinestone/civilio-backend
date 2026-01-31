import { defineEventHandler, getValidatedRouterParams, setResponseStatus } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import { lookupFormVersionsByFormSlug } from "~/utils/forms";
import z, { prettifyError } from "zod";

const paramsSchema = z.object({
	form: z.string()
});

defineRouteMeta({
	openAPI: {
		tags: ['Forms'],
		summary: 'Lookup form versions',
		description: 'Lookup versions for a form using its slug',
		operationId: 'lookupFormVersions',
		responses: {
			'200': {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/FormVersionLookup'
							}
						}
					}
				}
			}
		},
		$global: {
			components: {
				schemas: {
					FormVersionLookup: {
						description: 'Lookup for a form version',
						type: "object",
						required: ["label", "createdAt", "updatedAt", "id", "form", "isCurrent"],
						properties: {
							label: { type: "string" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
							id: { type: "string", format: 'uuid' },
							form: { type: "string" },
							parentId: { type: "string", nullable: true },
							isCurrent: { type: "boolean" }
						}
					}
				}
			}
		}
	}
})
export default defineEventHandler(async event => {
	const { success, data, error } = await getValidatedRouterParams(event, paramsSchema.safeParse);
	if (!success) {
		setResponseStatus(event, 400);
		return { message: prettifyError(error) };
	}

	const result = await lookupFormVersionsByFormSlug(data.form);
	return result || null;
})