import { createError, getValidatedQuery, getValidatedRouterParams, H3Event, readValidatedBody } from "h3";
import z from "zod";

export async function validateZodRequestBody<T extends z.ZodType>(event: H3Event, schema: T) {
	const { success, error, data } = await readValidatedBody(event, schema.safeParse);
	if (!success) {
		throw createError({
			message: z.prettifyError(error),
			statusCode: 400,
			data: z.treeifyError(error),
			unhandled: false
		})
	}
	return data;
}

export async function validateZodQueryParams<T extends z.ZodType>(event: H3Event, schema: T) {
	const { success, error, data } = await getValidatedQuery(event, schema.safeParse);
	if (!success) {
		throw createError({
			message: z.prettifyError(error),
			statusCode: 400,
			data: z.treeifyError(error),
			unhandled: false,
		});
	}

	return data;
}

export async function validateZodRouterParams<T extends z.ZodType>(event: H3Event, schema: T) {
	const { success, data, error } = await getValidatedRouterParams(event, schema.safeParse, { decode: true });
	if (!success) {
		throw createError({
			message: z.prettifyError(error),
			statusCode: 400,
			data: z.treeifyError(error),
			unhandled: false
		});
	}
	return data;
}