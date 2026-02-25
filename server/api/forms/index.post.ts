import { defineEventHandler, setResponseStatus } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import { validateZodRequestBody } from "~/utils/dto/zod";
import { ExecutionError, } from "~/utils/types/errors";
import { createForm } from "~/utils/helpers/forms";
import { fromExecutionError } from "~/utils/misc";

export default defineEventHandler(async event => {
	const body = await validateZodRequestBody(event, requestBodySchema)
	try {
		const { formInfo, versionInfo } = await createForm(body.title, body.description ?? undefined)
		setResponseStatus(event, 201);
		return {
			// title: formInfo.label,
			// description: formInfo.description,
			slug: formInfo.slug,
			version: versionInfo.id
		}
	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
});

const requestBodySchema = z.object({
	title: z.string().trim().nonempty('The title field is required'),
	description: z.string().trim().nullish()
})

defineRouteMeta({
	openAPI: {
		tags: ['Forms'],
		summary: 'Create form',
		requestBody: {
			$ref: '#/components/requestBodies/CreateFormRequest'
		},
		responses: {
			201: {
				$ref: '#/components/responses/NewFormResponse'
			}
		},
		$global: {
			components: {
				requestBodies: {
					CreateFormRequest: {
						description: 'Form creation request body',
						required: true,
						content: {
							'application/json': {
								schema: {
									type: 'object',
									required: ['title'],
									additionalProperties: false,
									properties: {
										title: { type: 'string' },
										description: { type: 'string', nullable: true }
									}
								}
							}
						}
					}
				},
				responses: {
					NewFormResponse: {
						description: 'Response schema for newly created form',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									required: ['version', 'slug', 'title'],
									additionalProperties: false,
									properties: {
										slug: { type: 'string' },
										// title: { type: 'string' },
										// description: { type: 'string', nullable: true },
										version: { type: 'string', format: 'uuid' }
									}
								}
							}
						}
					}
				}
			}
		}
	}
})