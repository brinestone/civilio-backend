import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import {
	validateZodQueryParams,
	validateZodRouterParams
} from "~/utils/dto/zod";
import { ExecutionError, NotFoundError } from "~/utils/types/errors";
import { findFormVersionDefinition } from "~/utils/helpers/forms";
import { fromExecutionError } from "~/utils/misc";

const pathSchema = z.object({
	form: z.string().trim().nonempty()
})
const querySchema = z.object({
	archived: z.boolean().optional().default(false),
	version: z.string().trim().optional().pipe(z.uuid('version must be a UUID').optional())
});
export default defineEventHandler(async event => {
	const pathParams = await validateZodRouterParams(event, pathSchema);
	const queryParams = await validateZodQueryParams(event, querySchema);

	try {
		const result = await findFormVersionDefinition(pathParams.form, queryParams.archived, queryParams.version);

		if (!result)
			throw new NotFoundError('definition not found');
		return result;
	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
});
defineRouteMeta({
	openAPI: {
		tags: ['Forms'],
		summary: 'Get form version definition',
		description: 'Get a form\'s definition by version',
		operationId: 'findFormDefinitionByVersion',
		parameters: [
			{
				schema: { type: 'boolean', default: false },
				in: 'query',
				required: false,
				name: 'archived',
			},
			{
				schema: { type: 'string', format: 'uuid' },
				in: 'query',
				required: false,
				name: 'version'
			},
			{
				in: 'path',
				required: true,
				name: 'form',
				schema: { type: 'string' }
			}
		],
		$global: {
			components: {
				schemas: {
					ArchivedFormVersionDefinition: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/FormVersionDefinition' },
							{
								type: 'object',
								additionalProperties: false,
								properties: {
									archived: { type: 'boolean' }
								},
								required: ['archived']
							}
						]
					},
					FormVersionDefinition: {
						type: 'object',
						additionalProperties: false,
						properties: {
							id: { type: 'string', format: 'uuid' },
							parentId: {
								nullable: true,
								type: 'string',
								format: 'uuid'
							},
							items: {
								nullable: false,
								type: 'array',
								items: { $ref: '#/components/schemas/FormItemDefinition' }
							}
						},
						required: ['id', 'items']
					},
					RelevanceLogicExpressionOperator: {
						type: 'string',
						enum: [
							'in',
							'eq',
							'ne',
							'gt',
							'lt',
							'lte',
							'gte',
							'empty',
							'notEmpty',
							'between',
							'match',
							'isNull',
							'isNotNull',
							'checked',
							'unchecked',
							'selectedAny',
							'selectedAll',
							'startsWith',
							'endsWith',
							'noselection',
							'before',
							'after',
							'afterOrOn',
							'beforeOrOn'
						]
					},
					RelevanceExpressionValue: {
						type: 'object',
						additionalProperties: false,
						oneOf: [
							{ type: 'string' },
							{ type: 'number' },
							{ type: 'boolean' },
							{ $ref: '#/components/schemas/NumberRange' },
						],
					},
					RelevanceLogicExpression: {
						type: 'object',
						additionalProperties: false,
						required: ['field', 'operator', 'negated'],
						properties: {
							field: { type: 'string', nullable: true, default: null },
							operator: {
								nullable: true, default: null,
								$ref: '#/components/schemas/RelevanceLogicExpressionOperator'
							},
							negated: { type: 'boolean', default: false },
							value: {
								nullable: true, type: 'string', default: null,
							}
						}
					},
					RelevanceCondition: {
						type: 'object',
						additionalProperties: false,
						required: ['operator', 'expressions'],
						properties: {
							operator: {
								type: 'string',
								enum: ['and', 'or'],
							},
							expressions: {
								type: 'array',
								items: { $ref: '#/components/schemas/RelevanceLogicExpression' }
							}
						}
					},
					RelevanceDefinition: {
						type: 'object',
						additionalProperties: false,
						properties: {
							enabled: { type: 'boolean', default: true },
							operator: {
								type: 'string',
								enum: ['and', 'or'],
								default: 'and'
							},
							logic: {
								type: 'array',
								items: { $ref: '#/components/schemas/RelevanceCondition' }
							}
						},
						required: ['logic']
					},
					FormItemDefinition: {
						type: 'object',
						discriminator: {
							propertyName: 'type',
							mapping: {
								note: '#/components/schemas/FormItemNote',
								field: '#/components/schemas/FormItemField',
								separator: '#/components/schemas/FormItemSeparator',
								image: '#/components/schemas/FormItemImage',
								group: '#/components/schemas/FormItemGroup'
							}
						},
						oneOf: [
							{ $ref: '#/components/schemas/FormItemGroup' },
							{ $ref: '#/components/schemas/FormItemNote' },
							{ $ref: '#/components/schemas/FormItemField' },
							{ $ref: '#/components/schemas/FormItemImage' },
							{ $ref: '#/components/schemas/FormItemSeparator' }
						]
					},
					NewFormItemDefinition: {
						type: 'object',
						discriminator: {
							propertyName: 'type',
							mapping: {
								note: '#/components/schemas/NewFormItemNote',
								field: '#/components/schemas/NewFormItemField',
								separator: '#/components/schemas/NewFormItemSeparator',
								image: '#/components/schemas/NewFormItemImage',
								group: '#/components/schemas/NewFormItemGroup'
							}
						},
						oneOf: [
							{ $ref: '#/components/schemas/NewFormItemGroup' },
							{ $ref: '#/components/schemas/NewFormItemNote' },
							{ $ref: '#/components/schemas/NewFormItemField' },
							{ $ref: '#/components/schemas/NewFormItemImage' },
							{ $ref: '#/components/schemas/NewFormItemSeparator' }
						]
					},
					FormItemDefinitionUpdate: {
						type: 'object',
						discriminator: {
							propertyName: 'type',
							mapping: {
								note: '#/components/schemas/FormItemNoteUpdate',
								field: '#/components/schemas/FormItemFieldUpdate',
								separator: '#/components/schemas/FormItemSeparatorUpdate',
								image: '#/components/schemas/FormItemImageUpdate',
								group: '#/components/schemas/FormItemGroupUpdate'
							}
						},
						oneOf: [
							{ $ref: '#/components/schemas/FormItemNoteUpdate' },
							{ $ref: '#/components/schemas/FormItemImageUpdate' },
							{ $ref: '#/components/schemas/FormItemFieldUpdate' },
							{ $ref: '#/components/schemas/FormItemSeparatorUpdate' },
							{ $ref: '#/components/schemas/FormItemGroupUpdate' },
						]
					},
					FormItemGroupUpdate: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemDefinitionWithId' },
							{ $ref: '#/components/schemas/BaseFormItemGroup' },
							{
								type: 'object',
								additionalProperties: false,
								required: ['config'],
								properties: {
									config: {
										$ref: '#/components/schemas/BaseGroupItemConfig'
									}
								}
							}
						]
					},
					FormItemSeparatorUpdate: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/FormItemSeparator' }
						]
					},
					FormItemFieldUpdate: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/FormItemField' }
						]
					},
					FormItemImageUpdate: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/FormItemImage' }
						]
					},
					FormItemNoteUpdate: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/FormItemNote' }
						]
					},
					FormItemGroup: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemDefinitionWithId' },
							{ $ref: '#/components/schemas/BaseFormItemGroup' },
							{
								type: 'object',
								additionalProperties: false,
								required: ['config'],
								properties: {
									config: {
										$ref: '#/components/schemas/GroupItemConfig'
									}
								}
							}
						]
					},
					BaseFormItemGroup: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemDefinitionWithoutId' },
							{
								type: 'object',
								additionalProperties: false,
								required: ['type'],
								properties: {
									type: { type: 'string', enum: ['group'] },
								}
							}
						]
					},
					NewFormItemGroup: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemGroup' },
							{
								type: 'object',
								additionalProperties: false,
								required: ['config'],
								properties: {
									config: {
										$ref: '#/components/schemas/NewGroupItemConfig'
									}
								}
							}
						]
					},
					FormItemImage: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemDefinitionWithId' },
							{ $ref: '#/components/schemas/NewFormItemImage' }
						]
					},
					NewFormItemImage: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemDefinitionWithoutId' },
							{
								type: 'object',
								additionalProperties: false,
								required: ['type', 'config'],
								properties: {
									type: { type: 'string', enum: ['image'] },
									config: {
										$ref: '#/components/schemas/ImageItemConfig'
									}
								}
							}
						]
					},
					NewFormItemNote: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemDefinitionWithoutId' },
							{
								type: 'object',
								required: ['type', 'config'],
								additionalProperties: false,
								properties: {
									type: { type: 'string', enum: ['note'] },
									config: { $ref: '#/components/schemas/NoteItemConfig' }
								}
							}
						]
					},
					FormItemNote: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemDefinitionWithId' },
							{ $ref: '#/components/schemas/NewFormItemNote' }
						]
					},
					NewFormItemSeparator: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemDefinitionWithoutId' },
							{
								type: 'object',
								required: ['type'],
								additionalProperties: false,
								properties: {
									config: { $ref: '#/components/schemas/SeparatorItemConfig' },
									type: {
										type: 'string',
										enum: ['separator']
									}
								}
							}
						],
					},
					FormItemSeparator: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemDefinitionWithId' },
							{ $ref: '#/components/schemas/NewFormItemSeparator' }
						]
					},
					NewFormItemField: {
						type: 'object', additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemDefinitionWithoutId' },
							{
								type: 'object',
								required: ['type', 'title', 'config'],
								properties: {
									type: { type: 'string', enum: ['field'] },
									parentId: { type: 'string', format: 'uuid', nullable: true, default: null },
									config: { $ref: '#/components/schemas/FieldItemConfig' }
								}
							}
						]
					},
					FormItemField: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemDefinitionWithId' },
							{ $ref: '#/components/schemas/NewFormItemField' },
						]
					},
					NewGroupItemConfig: {
						type: 'object',
						additionalProperties: false,
						required: ['config'],
						allOf: [
							{ $ref: '#/components/schemas/BaseGroupItemConfig' },
							{
								type: 'object',
								additionalProperties: false,
								required: ['fields'],
								properties: {
									fields: {
										type: 'array',
										default: [],
										items: { $ref: '#/components/schemas/NewFormItemField' }
									}
								}
							}
						]
					},
					BaseGroupItemConfig: {
						type: 'object',
						additionalProperties: false,
						required: ['orientation', 'fields', 'title', 'repeatable'],
						properties: {
							title: { type: 'string', nullable: true, default: null },
							description: { type: 'string', nullable: true, default: null },
							repeatable: { type: 'boolean', default: false },
							divisionCount: { type: 'integer', minimum: 1, default: 1 },
							orientation: { type: 'string', enum: ['horizonal', 'vertical'], default: 'vertical' },
						}
					},
					GroupItemEntry: {
						type: 'object',
						additionalProperties: false,
						oneOf: [
							{ $ref: '#/components/schemas/NewFormItemField' },
							{ $ref: '#/components/schemas/FormItemField' }
						]
					},
					GroupItemConfig: {
						type: 'object',
						additionalProperties: false,
						required: ['config'],
						allOf: [
							{ $ref: '#/components/schemas/BaseGroupItemConfig' },
							{
								type: 'object',
								additionalProperties: false,
								required: ['fields'],
								properties: {
									fields: {
										type: 'array',
										default: [],
										items: { $ref: '#/components/schemas/FormItemField' }
									}
								}
							}
						]
					},
					// --- FIELD CONFIG DISCRIMINATOR ---
					FieldItemConfig: {
						type: 'object',
						discriminator: {
							propertyName: 'type',
							mapping: {
								'geo-point': '#/components/schemas/GeoPointFieldConfig',
								'integer': '#/components/schemas/NumberFieldConfig',
								'float': '#/components/schemas/NumberFieldConfig',
								'boolean': '#/components/schemas/BooleanFieldConfig',
								'text': '#/components/schemas/TextFieldConfig',
								'multiline': '#/components/schemas/TextFieldConfig',
								'single-select': '#/components/schemas/SelectFieldConfig',
								'multi-select': '#/components/schemas/SelectFieldConfig',
								'date': '#/components/schemas/SimpleDateFieldConfig',
								'date-time': '#/components/schemas/SimpleDateFieldConfig',
								'date-range': '#/components/schemas/RangeDateFieldConfig',
								'multi-date': '#/components/schemas/MultiDateFieldConfig'
							}
						},
						oneOf: [
							{ $ref: '#/components/schemas/GeoPointFieldConfig' },
							{ $ref: '#/components/schemas/NumberFieldConfig' },
							{ $ref: '#/components/schemas/BooleanFieldConfig' },
							{ $ref: '#/components/schemas/TextFieldConfig' },
							{ $ref: '#/components/schemas/SelectFieldConfig' },
							{ $ref: '#/components/schemas/MultiDateFieldConfig' },
							{ $ref: '#/components/schemas/SimpleDateFieldConfig' },
							{ $ref: '#/components/schemas/RangeDateFieldConfig' },
						]
					},
					BaseFormItemDefinitionWithId: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemDefinitionWithoutId' },
							{
								type: 'object',
								required: ['id', 'itemId', 'addedAt', 'updatedAt',],
								additionalProperties: false,
								properties: {
									id: { type: 'string', format: 'uuid' },
									addedAt: { type: 'string', },
									updatedAt: { type: 'string', },
									itemId: { type: 'string', format: 'uuid' },
									// parentId: { type: 'string', format: 'uuid', nullable: true, default: null }
								}
							}
						]
					},
					Tag: {
						type: 'object',
						additionalProperties: false,
						required: ['key', 'value'],
						properties: {
							key: { type: 'string', nullable: true, default: null },
							value: { type: 'string', nullable: true, default: null }
						}
					},
					BaseFormItemDefinitionWithoutId: {
						type: 'object',
						additionalProperties: false,
						required: ['path', 'relevance', 'tags'],
						properties: {
							itemId: { type: 'string', format: 'uuid', nullable: true },
							path: {
								type: 'string', nullable: true,
								default: null
							},
							tags: {
								type: 'array',
								items: {
									$ref: '#/components/schemas/Tag'
								},
								default: []
							},
							metaTag: { type: 'string', nullable: true, default: null },
							relevance: {
								$ref: '#/components/schemas/RelevanceDefinition'
							},
						}
					},
					SimpleDateFieldConfig: {
						type: 'object', additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseDateFieldProps' },
							{
								type: 'object',
								required: ['type'], additionalProperties: false,
								properties: {
									type: {
										type: 'string',
										enum: ['date', 'date-time']
									},
									defaultValue: {
										type: 'number',
										nullable: true,
										default: null
									}
								}
							}
						]
					},
					NumberRange: {
						type: 'object',
						additionalProperties: false,
						properties: {
							start: { type: 'number', nullable: true },
							end: { type: 'number', nullable: true }
						}
					},
					RangeDateFieldConfig: {
						type: 'object', additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseDateFieldProps' },
							{
								type: 'object',
								required: ['type', 'defaultValue'], additionalProperties: false,
								properties: {
									type: {
										type: 'string',
										enum: ['date-range']
									},
									defaultValue: {
										$ref: '#/components/schemas/NumberRange',
										default: { start: null, end: null }
									}
								}
							}
						]
					},
					MultiDateFieldConfig: {
						type: 'object', additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseDateFieldProps' },
							{
								type: 'object',
								required: ['type'], additionalProperties: false,
								properties: {
									type: {
										type: 'string',
										enum: ['multi-date']
									},
									minSelection: {
										type: 'integer',
										nullable: true,
										default: null
									},
									maxSelection: {
										type: 'integer',
										nullable: true,
										default: null
									},
									defaultValue: {
										type: 'array',
										nullable: true,
										default: [],
										items: { type: 'number' }
									}
								}
							}
						]
					},

					BaseDateFieldProps: {
						type: 'object', additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFieldProps' },
							{
								type: 'object', additionalProperties: false,
								required: ['min', 'max'],
								properties: {
									min: {
										type: 'number', nullable: true,
										default: null
									},
									max: {
										type: 'number', nullable: true,
										default: null
									}
								}
							}
						]
					},
					BaseFieldProps: {
						type: 'object', additionalProperties: false,
						required: ['required', 'readonly', 'title', 'tags', 'autoDataKey'],
						properties: {
							required: {
								type: 'boolean',
								default: true,
								nullable: true
							},
							readonly: {
								type: 'boolean',
								default: false,
								nullable: true
							},
							title: { type: 'string', default: '' },
							description: {
								type: 'string',
								nullable: true,
								default: null,
							},
							dataKey: {
								type: 'string',
								nullable: true,
								default: null
							},
							autoDataKey: {
								type: 'boolean',
								default: true
							}
						}
					},
					SeparatorItemConfig: {
						type: 'object',
						additionalProperties: false,
						required: ['orientation'],
						properties: {
							orientation: {
								type: 'string',
								default: 'vertical',
								enum: ['vertical', 'horizontal']
							},
						}
					},
					ImageItemConfig: {
						type: 'object',
						additionalProperties: false,
						required: ['width', 'url'],
						properties: {
							url: { type: 'string' },
							width: {
								type: 'number', minimum: 10,
								default: 10
							},
							caption: {
								type: 'string', nullable: true,
								default: null
							},
							height: {
								type: 'number', nullable: true,
								default: null
							},
							aspectRatio: {
								type: 'number', nullable: true,
								default: null
							},
							filter: {
								type: 'string',
								enum: ['none', 'shadow'],
								nullable: true,
								default: null
							}
						}
					},
					NoteItemConfig: {
						type: 'object', additionalProperties: false,
						required: ['fontSize'],
						properties: {
							fontSize: { type: 'integer', default: 13 }
						}
					},
					NumberFieldConfig: {
						type: 'object', additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFieldProps' },
							{
								type: 'object', additionalProperties: false,
								required: ['type'],
								properties: {
									type: {
										type: 'string',
										enum: ['integer', 'float']
									},
									min: {
										type: 'number', nullable: true,
										default: null
									},
									max: {
										type: 'number', nullable: true,
										default: null
									},
									defaultValue: {
										type: 'number',
										nullable: true,
										default: null
									}
								}
							}
						]
					},
					GeoPoint: {
						type: 'object',
						additionalProperties: false,
						required: ['lat', 'long'],
						properties: {
							lat: { type: 'number', minimum: -90, maximum: 90 },
							long: {
								type: 'number',
								minimum: -180,
								maximum: 180
							}
						}
					},
					GeoPointFieldConfig: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFieldProps' },
							{
								type: 'object', additionalProperties: false,
								required: ['type'],
								properties: {
									type: {
										type: 'string',
										enum: ['geo-point']
									},
									defaultValue: {
										nullable: true,
										$ref: '#/components/schemas/GeoPoint',
										default: null
									}
								}
							}
						]
					},
					BooleanFieldConfig: {
						type: 'object', additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFieldProps' },
							{
								type: 'object', additionalProperties: false,
								required: ['type', 'renderAs'],
								properties: {
									type: { type: 'string', enum: ['boolean'] },
									defaultValue: {
										type: 'boolean',
										default: false,
									},
									renderAs: {
										nullable: true,
										type: 'string',
										enum: ['select', 'checkbox'],
										default: 'checkbox'
									}
								}
							}
						]
					},
					TextFieldConfig: {
						type: 'object', additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFieldProps' },
							{
								type: 'object',
								additionalProperties: false,
								required: ['type'],
								properties: {
									type: {
										type: 'string',
										enum: ['text', 'multiline']
									},
									placeholder: {
										type: 'string',
										nullable: true,
										default: null
									},
									pattern: {
										type: 'string',
										nullable: true,
										default: null
									},
									minlength: {
										type: 'number',
										nullable: true,
										default: null
									},
									maxlength: {
										type: 'number',
										nullable: true,
										default: null
									},
									defaultValue: {
										type: 'string',
										nullable: true,
										default: null
									}
								}
							}
						]
					},
					SelectFieldConfig: {
						type: 'object', additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFieldProps' },
							{
								type: 'object',
								additionalProperties: false,
								required: ['type'],
								properties: {
									type: {
										type: 'string',
										enum: ['single-select', 'multi-select']
									},
									itemSourceRef: {
										type: 'string',
										nullable: true,
										default: null
									},
									defaultValue: {
										type: 'string',
										nullable: true,
										default: null
									},
									hardItems: {
										type: 'array',
										default: [],
										items: {
											additionalProperties: false,
											type: 'object',
											properties: {
												label: {
													type: 'string',
													nullable: true,
													default: null
												},
												value: {
													type: 'string',
													nullable: true,
													default: null
												}
											}
										}
									}
								}
							}
						]
					},
				}
			}
		},
		responses: {
			200: {
				description: 'Form definition',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							additionalProperties: false,
							oneOf: [
								{ $ref: '#/components/schemas/FormVersionDefinition' },
								{ $ref: '#/components/schemas/ArchivedFormVersionDefinition' }
							]
						}
					}
				}
			},
			404: {
				description: 'Form definition not found'
			}
		}
	}
});