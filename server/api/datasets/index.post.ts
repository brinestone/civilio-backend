import { defineEventHandler, readValidatedBody, setResponseStatus } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import { prettifyError } from "zod";
import { upsertFormOptions } from "~/utils/datasets";
import { FormOptionsUpsertRequestSchema } from "~/utils/dto";
import Logger from "~/utils/logger";

const bodySchema = FormOptionsUpsertRequestSchema;
defineRouteMeta({
	openAPI: {
		summary: 'Create Dataset',
		tags: ['Datasets'],
		description: 'Creates a new dataset',
		requestBody: {
			required: true,
			description: 'The payload for creating a dataset',
			content: {
				'application/json': {
					schema: bodySchema.toJSONSchema({ target: 'openapi-3.0' }) as any
				}
			}
		},
		responses: {
			'202': {
				description: 'The dataset was created successfully'
			}
		}
	}
});
export default defineEventHandler(async event => {
	// const paramsResult = await getValidatedRouterParams(event, paramsSchema.safeParse);
	const bodyResult = await readValidatedBody(event, bodySchema.safeParse);

	if (!bodyResult.success) {
		setResponseStatus(event, 400, 'Bad Request');
		Logger.error(bodyResult.error);
		console.error(bodyResult.error);
		return { message: prettifyError(bodyResult.error) };
	}

	await upsertFormOptions(bodyResult.data);
	setResponseStatus(event, 202);
	return;
})