import { defineEventHandler, setResponseStatus } from "h3";
import _ from "lodash";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import { provideDb } from "~/utils/db";
import { FormItemDefinitionUpdate, FormItemDefinitionUpdateSchema, FormItemFieldUpdate, FormItemGroupUpdate, NewFormItemDefinition, NewFormItemDefinitionSchema, NewFormItemGroup } from "~/utils/dto/form";
import {
	validateZodRequestBody,
	validateZodRouterParams
} from "~/utils/dto/zod";
import { createFormItems, formVersionExistsTx, removeFormItems, updateFormItems } from "~/utils/helpers/forms";
import Logger from "~/utils/logger";
import { fromExecutionError } from '~/utils/misc';
import { ExecutionError, UnprocessibleError } from "~/utils/types/errors";
import { ConnectionLike } from "~/utils/types/types";

export default defineEventHandler(async event => {
	const { addedItems, removedItems, updatedItems } = await validateZodRequestBody(event, bodySchema);
	const params = await validateZodRouterParams(event, pathSchema);
	try {
		const db = provideDb();
		await db.transaction(async tx => {
			const formVersionExists = await formVersionExistsTx(tx, params.form, params.version);
			if (!formVersionExists) throw new UnprocessibleError(`No such form version: ${params.version} exists`);

			if (addedItems && addedItems.length > 0)
				await processAddedItems(tx, params.form, params.version, addedItems);
			if (updatedItems && updatedItems.length > 0)
				await processUpdatedItems(tx, params.form, params.version, updatedItems)
			if (removedItems && removedItems.length > 0)
				await processDeletedItems(tx, params.form, params.version, removedItems);
		});
		setResponseStatus(event, 202);
	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
});

async function processDeletedItems(tx: ConnectionLike, form: string, version: string, ids: string[]) {
	Logger.info(`Removing ${ids.length} items from form: ${form}`);
	await removeFormItems(tx, form, version, ids);
}

async function processUpdatedItems(tx: ConnectionLike, form: string, version: string, items: FormItemDefinitionUpdate[]) {
	Logger.info(`Processing ${items.length} updates in form: ${form} version: ${version}`);
	const processedItems = new Set<string>();

	const { group: groups, field: fields, ...otherItems } = _.groupBy(items, 'type');

	if (groups && groups.length > 0) {
		Logger.info(`Processing ${groups.length} groups in form: ${form} version: ${version}`);
		for (const group of groups as FormItemGroupUpdate[]) {
			const [groupId] = await updateFormItems(tx, form, version, [group]);
			processedItems.add(group.path);
			const prefix = [group.path, 'config', 'fields'].join('.');
			const children = fields?.filter(f => f.path.startsWith(prefix)) ?? [];
			if (children.length > 0) {
				await updateFormItems(tx, form, version, children, groupId);
				children.forEach(c => processedItems.add(c.path));
			}
		}
	}

	const _fields = fields?.filter(f => !processedItems.has(f.path)) ?? [];
	if (_fields.length > 0) {
		await updateFormItems(tx, form, version, fields as FormItemFieldUpdate[]);
		fields.forEach(f => processedItems.add(f.path));
	}

	for (const items of _.values(otherItems)) {
		await updateFormItems(tx, form, version, items);
		items.forEach(i => processedItems.add(i.path));
	}
}

async function processAddedItems(tx: ConnectionLike, form: string, version: string, items: NewFormItemDefinition[]) {
	Logger.info(`Processing ${items.length} new item(s) into form: ${form} version: ${version}`);
	const processedItems = new Set<string>();

	const { group: addedGroups, field: addedFields, ...otherItems } = _.groupBy(items, 'type');

	if (addedGroups && addedGroups.length > 0) {
		Logger.info(`Processing ${addedGroups.length} new groups into form: ${form} version: ${version}`);
		for (const group of addedGroups as NewFormItemGroup[]) {
			const [groupId] = await createFormItems(tx, form, version, [group]);
			Logger.info(`New group: ${groupId} created in form: ${form} version: ${version}`);
			processedItems.add(group.path);
			const prefix = [group.path, 'config', 'fields'].join('.');
			const children = addedFields.filter(f => f.path.startsWith(prefix));
			if (children.length > 0) {
				await createFormItems(tx, form, version, children, groupId);
				children.forEach(c => processedItems.add(c.path));
			}
		}
	}
	const fields = addedFields.filter(f => !processedItems.has(f.path));
	if (fields.length > 0) {
		await createFormItems(tx, form, version, fields);
		fields.forEach(f => processedItems.add(f.path));
	}

	for (const items of _.values(otherItems)) {
		await createFormItems(tx, form, version, items);
		items.forEach(i => processedItems.add(i.path));
	}
}

const pathSchema = z.object({
	form: z.string().trim().nonempty('Invalid form ID'),
	version: z.string().trim().nonempty('Invalid version ID')
});

const bodySchema = z.object({
	addedItems: NewFormItemDefinitionSchema.array().optional(),
	updatedItems: FormItemDefinitionUpdateSchema.array().optional(),
	removedItems: z.uuid('Invalid Item ID. Must be UUID').array().optional()
});

defineRouteMeta({
	openAPI: {
		parameters: [
			{
				in: 'path',
				name: 'form',
				required: true,
				schema: { type: 'string' }
			},
			{
				in: 'path',
				name: 'version',
				required: true,
				schema: { type: 'string', format: 'uuid' }
			},
		],
		tags: ['Forms'],
		operationId: 'updateFormVersionDefinition',
		summary: 'Update form definition',
		description: 'Update a form version\'s definition',
		$global: {
			components: {
				schemas: {
					UpdateFormDefinitionRequest: {
						type: 'object',
						additionalProperties: false,
						properties: {
							addedItems: {
								default: [],
								type: 'array',
								items: {
									$ref: '#/components/schemas/NewFormItemDefinition'
								}
							},
							updatedItems: {
								default: [],
								type: 'array',
								items: {
									$ref: '#/components/schemas/FormItemDefinitionUpdate'
								}
							},
							removedItems: {
								type: 'array',
								items: {
									type: 'string', format: 'uuid'
								}
							}
						}
					}
				}
			}
		},
		requestBody: {
			description: 'Deltas payload',
			required: true,
			content: {
				'application/json': {
					schema: {
						$ref: '#/components/schemas/UpdateFormDefinitionRequest'
					}
				}
			}
		},
		responses: {
			202: {
				description: 'Update successful',
			}
		}
	}
});