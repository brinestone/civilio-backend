import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitro";
import z from "zod";
import { provideDb } from "~/utils/db";
import { validateZodQueryParams } from "~/utils/dto/zod";
import { lookupFormVersionsByFormSlug } from "~/utils/helpers/forms";

const paramsSchema = z.object({
	form: z.string().optional(),
	limit: z.coerce.number().int().positive().optional().default(10),
	offset: z.coerce.number().nullish(),
});

export default defineEventHandler(async event => {
	const { form, limit, offset } = await validateZodQueryParams(event, paramsSchema);
	const db = provideDb();
	const result = await lookupFormVersionsByFormSlug(db, limit, offset, form);
	return result
})
defineRouteMeta({
	openAPI: {
		tags: ['Forms'],
		summary: 'Lookup form versions',
		description: 'Lookup versions',
		operationId: 'lookupFormVersions',
		parameters: [
			{ in: 'query', name: 'form', required: false, schema: { type: 'string' }, description: 'The slug of the form to lookup versions for' },
			{ in: 'query', name: 'limit', required: false, schema: { type: 'integer', default: 10 }, description: 'The maximum number of results to return' },
			{ in: 'query', name: 'offset', required: false, schema: { type: 'number' }, description: 'The creation date offset expressed in milliseconds' },
		],
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
						additionalProperties: false,
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
});
