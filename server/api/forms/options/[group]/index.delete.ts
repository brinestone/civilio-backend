import z from "zod";

const paramsSchema = z.object({
	group: z.uuid(),
});
export default defineEventHandler(async event => {
	const { error, success, data } = await getValidatedRouterParams(event, paramsSchema.safeParse);
	if (!success) {
		setResponseStatus(event, 400);
		return { message: z.treeifyError(error) };
	}

	await deleteGroup(data.group);
	setResponseStatus(event, 202);
	return;
})