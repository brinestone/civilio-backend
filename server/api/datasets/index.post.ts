import { prettifyError } from "zod";

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