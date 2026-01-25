import z from "zod";

const pathSchema = DeleteSubmissionRequestSchema;
export default defineEventHandler(async event => {
	const { success, data, error } = await getValidatedRouterParams(event, pathSchema.safeParse);
	if (!success) {
		setResponseStatus(event, 400);
		return { message: z.prettifyError(error) };
	}

	Logger.info(`Deleting submission from form ${data.form} at index ${data.index}`);
	await deleteSubmission(data);
	setResponseStatus(event, 204);
	return;
});