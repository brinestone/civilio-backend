import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import { lookupDatasetItems } from "~/utils/datasets";
import { validateZodQueryParams, validateZodRouterParams } from "~/utils/dto/zod";

const pathSchema = z.object({
	dataset: z.string().trim().nonempty('dataset cannot be empty').pipe(z.uuid('Invalid UUID'))
});

const querySchema = z.object({
	page: z.string().trim().optional().default('0').pipe(z.coerce.number()),
	size: z.string().trim().optional().default('10').pipe(z.coerce.number()),
	filter: z.string().trim().optional()
});

defineRouteMeta({
	openAPI: {
		summary: 'Lookup dataset Items',
		operationId: 'lookupDatasetItems',

	}
})

export default defineEventHandler(async event => {
	const path = await validateZodRouterParams(event, pathSchema);
	const query = await validateZodQueryParams(event, querySchema);

	return await lookupDatasetItems(path.dataset, query.page, query.size, query.filter);
})