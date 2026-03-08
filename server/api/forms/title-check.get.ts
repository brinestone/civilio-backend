import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import { validateZodQueryParams } from "~/utils/dto/zod";
import { formTitleAvailable } from "~/utils/helpers/forms";

const querySchema = z.object({
	title: z.string().trim()
});

export default defineEventHandler(async event => {
	const data = await validateZodQueryParams(event, querySchema);

	return await formTitleAvailable(data.title);
});

defineRouteMeta({
	openAPI: {
		tags: ['Forms'],
		summary: 'Check title availability',
		operationId: 'isFormTitleAvailable',
		parameters: [
			{
				in: 'query',
				name: 'title',
				required: true,
				schema: { type: 'string' }
			}
		],
		responses: {
			200: {
				'description': 'OK',
				content: {
					'application/json': {
						schema: {
							$ref: '#/components/schemas/AvailabilityResponse'
						}
					}
				}
			}
		}
	}
});