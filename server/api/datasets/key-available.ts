import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import { z } from "zod";
import { datasetKeyAvailable } from "~/utils/datasets";
import { validateZodQueryParams } from "~/utils/dto/zod";

defineRouteMeta({
	openAPI: {
		tags: ['Datasets'],
		description: 'Check if dataset key is available to be used to create a new dataset',
		summary: 'Key check',
		operationId: 'isDatasetKeyAvailable',
		$global: {
			components: {
				schemas: {
					AvailabilityResponse: {
						type: 'object',
						nullable: false,
						additionalProperties: false,
						required: ['available'],
						properties: {
							available: {
								type: 'boolean'
							}
						}
					}
				}
			}
		},
		parameters: [
			{
				in: 'query',
				name: 'key',
				required: true,
				example: 'commune',
				description: 'The key value to use to check'
			},
			{
				in: 'query',
				name: 'ref',
				required: false,
				schema: { type: 'string', format: 'uuid' },
				description: 'A dataset reference ID to use in the check'
			}
		],
		responses: {
			'200': {
				'description': 'OK',
				content: {
					'application/json': {
						schema: {
							$ref: '#/components/schemas/AvailabilityResponse'
						}
					}
				}
			},
		}
	}
});

const queryParams = z.object({
	key: z.coerce.string().trim(),
	// ref: z.uuid('Invalid UUID').nonempty('Empty strings are not allowed').optional()
	ref: z.string().trim().nonempty('Empty strings are not allowed').optional().pipe(z.uuid('Invalid UUID').optional())
})
export default defineEventHandler(async event => {
	const { key, ref } = await validateZodQueryParams(event, queryParams);

	return { available: await datasetKeyAvailable(key, ref) };
})