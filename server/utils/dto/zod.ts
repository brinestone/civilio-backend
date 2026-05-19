import { getValidatedQuery, getValidatedRouterParams, H3Event, HTTPError, readValidatedBody } from "nitro/h3";
import z from "zod";

export function validateHeaderParams<T extends z.ZodType>(event: H3Event, schema: T) {
	const headers = Object.fromEntries(event.req.headers.entries());
	const { success, error, data } = schema.safeParse(headers);
	if (!success) {
		throw new HTTPError({
			message: z.prettifyError(error),
			statusCode: 400,
			data: z.treeifyError(error),
			unhandled: false
		});
	}
	return data;
}

export async function validateZodRequestBody<T extends z.ZodType>(event: H3Event, schema: T) {
	const { success, error, data } = await readValidatedBody(event, schema.safeParse);
	if (!success) {
		throw new HTTPError({
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
		throw new HTTPError({
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
		throw new HTTPError({
			message: z.prettifyError(error),
			statusCode: 400,
			data: z.treeifyError(error),
			unhandled: false
		});
	}
	return data;
}