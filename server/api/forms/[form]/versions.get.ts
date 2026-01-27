import z, { prettifyError } from "zod";

const paramsSchema = z.object({
	form: z.string()
});

defineRouteMeta({
	openAPI: {
		tags: ['Forms'],
		summary: 'Lookup form versions',
		description: 'Lookup versions for a form using its slug'
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