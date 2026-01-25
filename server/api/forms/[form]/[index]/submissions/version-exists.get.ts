import z from "zod"

const pathSchema = z.object({
	form: z.string(),
	index: z.coerce.number()
});
const querySchema = z.object({
	version: z.string().nonempty()
})
export default defineEventHandler(async event => {
	const paramResult = await getValidatedRouterParams(event, pathSchema.safeParse);
	const queryResult = await getValidatedQuery(event, querySchema.safeParse);

	if (!paramResult.success) {
		setResponseStatus(event, 400);
		return { message: z.prettifyError(paramResult.error) };
	}

	if (!queryResult.success) {
		setResponseStatus(event, 400);
		return { message: z.prettifyError(queryResult.error) };
	}

	return await versionExists({
		form: paramResult.data.form,
		index: paramResult.data.index,
		version: queryResult.data.version
	})
})