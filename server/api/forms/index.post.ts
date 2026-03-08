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
		const {
			formInfo,
			versionInfo
		} = await createForm(body.title, body.description ?? undefined)
		setResponseStatus(event, 201);
		return {
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
		operationId: 'createNewForm',
		responses: {
			201: {
				description: 'The form was created successfully',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							additionalProperties: false,
							required: ['slug', 'version'],
							properties: {
								slug: { type: 'string' },
								version: { type: 'string', format: 'uuid' },
							}
						}
					}
				}
			}
		},
		requestBody: {
			required: true,
			description: 'Form creation request payload',
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
		},
	}
})