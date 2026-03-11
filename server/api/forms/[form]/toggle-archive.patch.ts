import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import { validateZodRouterParams } from "~/utils/dto/zod";
import { ExecutionError } from "~/utils/types/errors";
import { toggleFormArchived } from "~/utils/helpers/forms";
import { fromExecutionError } from "~/utils/misc";

export default defineEventHandler(async event => {
	const { form } = await validateZodRouterParams(event, pathSchema);
	try {
		await toggleFormArchived(form);
	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
});

const pathSchema = z.object({
	form: z.string().trim().nonempty('form is required')
});

defineRouteMeta({
	openAPI: {
		tags: ['Forms'],
		summary: 'Toggle a form\'s archived status',
		parameters: [
			{ in: 'path', name: 'form', schema: { type: 'string' }, required: true }
		],
		operationId: 'toggleArchivedStatus',
		responses: {
			202: {
				description: 'The status was toggled successfully',
			}
		}
	}
});