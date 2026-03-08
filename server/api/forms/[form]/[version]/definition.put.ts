import { defineEventHandler } from "h3";
import _ from "lodash";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import { provideDb } from "~/utils/db";
import { FormItemDefinition, FormItemDefinitionSchema, FormItemGroup, NewFormItemDefinition, NewFormItemDefinitionSchema, NewFormItemGroup } from "~/utils/dto/form";
import {
	validateZodRequestBody,
	validateZodRouterParams
} from "~/utils/dto/zod";
import { createFormItems, deleteItemsFromForm, formVersionExistsTx, updateFormItems } from "~/utils/helpers/forms";
import Logger from "~/utils/logger";
import { fromExecutionError } from '~/utils/misc';
import { ExecutionError, UnprocessibleError } from "~/utils/types/errors";
import { ConnectionLike } from "~/utils/types/types";

export default defineEventHandler(async event => {
	const { addedItems, removedItems, updatedItems } = await validateZodRequestBody(event, bodySchema);
	const path = await validateZodRouterParams(event, pathSchema);

	try {
		const db = provideDb();
		await db.transaction(async tx => {
			const formVersionExists = await formVersionExistsTx(tx, path.form, path.version);
			if (!formVersionExists) throw new UnprocessibleError(`No such form version: ${path.version} exists`);

			if (addedItems)
				await processAddedItems(tx, path.form, path.version, addedItems);
			if (updatedItems)
				await processUpdatedItems(tx, path.form, path.version, updatedItems)
			if (removedItems)
				await processDeletedItems(tx, path.form, path.version, removedItems);
		});
	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
});

async function processDeletedItems(tx: ConnectionLike, form: string, version: string, ids: string[]) {
	Logger.info(`Removing ${ids.length} items from form: ${form}`)
}

async function processUpdatedItems(tx: ConnectionLike, form: string, version: string, items: FormItemDefinition[]) {
	const { group: updatedGroups, ...otherTypes } = _.groupBy(items, 'type');

	Logger.info(`Processing ${items.length} updated item(s) in form: ${form} version: ${version}`);
	Logger.info(`Processing ${updatedGroups.length} updated group(s) in form: ${form} version: ${version}`);
	for (const group of updatedGroups as FormItemGroup[]) {
		const { config, ...rest } = group;
		Logger.info(`Processing updates for field group: ${group.id} in form: ${form} version: ${version}`);
		const [groupId] = await updateFormItems(tx, form, version, [{ ...rest, config: { ...config, fields: [] } as any }]);
		const { undefined: newFields, ...updatedChildItems } = _.groupBy(config.fields);
		await createFormItems(tx, form, version, newFields, groupId);
		for (const items of _.values(updatedChildItems) as unknown as FormItemDefinition[][]) {
			await updateFormItems(tx, form, version, items);
		}
	}
	for (const items of _.values(otherTypes)) {
		await updateFormItems(tx, form, version, items);
	}
}

async function processAddedItems(tx: ConnectionLike, form: string, version: string, items: NewFormItemDefinition[]) {
	const { group: addedGroups, ...otherTypes } = _.groupBy(items, 'type');
	Logger.info(`Processing ${items.length} new item(s) into form: ${form} version: ${version}`);

	Logger.info(`Processing ${addedGroups.length} new groups into form: ${form} version: ${version}`);
	for (const group of addedGroups as NewFormItemGroup[]) {
		const { config, ...rest } = group;
		const [groupId] = await createFormItems(tx, form, version, [{ ...rest, config: { ...config, fields: [] } }]);
		Logger.info(`Field group: ${groupId} created, in form: ${form} version: ${version}, adding ${config.fields.length} fields to it.`);
		await createFormItems(tx, form, version, config.fields, groupId);
	}

	for (const [type, items] of _.entries(otherTypes)) {
		Logger.info(`Processing ${items.length} ${type} items to form: ${form}, version: ${version}`)
		await createFormItems(tx, form, version, items)
	}
}

const pathSchema = z.object({
	form: z.string().trim().nonempty('Invalid form ID'),
	version: z.string().trim().nonempty('Invalid version ID')
});

const bodySchema = z.object({
	addedItems: NewFormItemDefinitionSchema.array().optional(),
	updatedItems: FormItemDefinitionSchema.array().optional(),
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
					AddedFormItem: {
						type: 'object',
						additionalProperties: false,

						allOf: [
							{ $ref: '#/components/schemas/FormItemDefinition' },
							{
								type: 'object',
								properties: {

								}
							}
						]
					},
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
									$ref: '#/components/schemas/FormItemDefinition'
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