import { defineEventHandler } from "h3";
import _ from "lodash";
import { defineRouteMeta } from "nitropack/runtime";
import z from "zod";
import { validateZodQueryParams, validateZodRouterParams } from "~/utils/dto/zod";
import { ExecutionError, NotFoundError } from "~/utils/types/errors";
import { findFormDefinition } from "~/utils/helpers/forms";
import { fromExecutionError } from "~/utils/misc";

const pathSchema = z.object({
	form: z.string().trim().nonempty()
})
const querySchema = z.object({
	version: z.string().trim().optional().pipe(z.uuid('version must be a UUID').optional())
});
export default defineEventHandler(async event => {
	const pathParams = await validateZodRouterParams(event, pathSchema);
	const queryParams = await validateZodQueryParams(event, querySchema);

	try {
		const result = await findFormDefinition(pathParams.form, queryParams.version);

		if (!result)
			throw new NotFoundError('definition not found');
		return _.pick(result, ['id', 'parentId', 'items']);
	} catch (e) {
		if (e instanceof ExecutionError) {
			throw fromExecutionError(e);
		}
		throw e;
	}
})
defineRouteMeta({
	openAPI: {
		tags: ['Forms'],
		summary: 'Get form version definition',
		description: 'Get a form\'s definition by version',
		operationId: 'getFormDefinitionByVersion',
		parameters: [
			{ in: 'query', required: false, name: 'version' },
			{ in: 'path', required: true, name: 'form' }
		],
		$global: {
			components: {
				schemas: {
					FormVersionDefinition: {
						type: 'object',
						additionalProperties: false,
						properties: {
							id: { type: 'string', format: 'uuid' },
							parentId: { nullable: true, type: 'string', format: 'uuid' },
							items: { nullable: false, type: 'array', items: { $ref: '#/components/schemas/FormItemDefinition' } }
						},
						required: ['id', 'items']
					},
					FormItemParentRef: {
						type: 'object',
						additionalProperties: false,
						required: ['id'],
						properties: {
							id: { type: 'string', format: 'uuid' }
						}
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
							'between',
							'match',
							'isNull',
							'isNotNull',
							'checked',
							'unchecked',
							'selectedAny',
							'selectedAll',
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
						required: ['field', 'operator'],
						properties: {
							field: { type: 'string' },
							operator: {
								$ref: '#/components/schemas/RelevanceLogicExpressionOperator'
							},
							value: {
								nullable: true, type: 'string'
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
							operator: { type: 'string', enum: ['and', 'or'], default: 'and' },
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
					FormItemGroup: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemDefinition' },
							{
								type: 'object',
								additionalProperties: false,
								required: ['children'],
								properties: {
									type: { type: 'string', enum: ['group'] },
									fields: { type: 'array', items: { $ref: '#/components/schemas/FormItemField' } }
								}
							}
						]
					},
					FormItemImage: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemDefinition' },
							{
								type: 'object',
								additionalProperties: false,
								required: ['url', 'meta'],
								properties: {
									type: { type: 'string', enum: ['image'] },
									url: { type: 'string' },
									meta: {
										$ref: '#/components/schemas/ImageItemMeta'
									}
								}
							}
						]
					},
					FormItemNote: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemDefinition' },
							{
								type: 'object',
								required: ['type', 'title', 'meta'],
								additionalProperties: false,
								properties: {
									type: { type: 'string', enum: ['note'] },
									title: { type: 'string' },
									meta: { $ref: '#/components/schemas/NoteItemMeta' }
								}
							}
						]
					},
					FormItemSeparator: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemDefinition' },
							{
								type: 'object',
								required: ['type'],
								additionalProperties: false,
								properties: {
									meta: { $ref: '#/components/schemas/SeparatorItemMeta' },
									type: { type: 'string', enum: ['separator'] }
								}
							}
						],
					},
					FormItemField: {
						type: 'object', additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFormItemDefinition' },
							{
								type: 'object',
								required: ['type', 'title', 'meta'],
								properties: {
									type: { type: 'string', enum: ['field'] },
									title: { type: 'string' },
									description: { type: 'string', nullable: true },
									meta: { $ref: '#/components/schemas/FieldItemMeta' }
								}
							}
						]
					},

					// --- FIELD META DISCRIMINATOR ---
					FieldItemMeta: {
						type: 'object',
						discriminator: {
							propertyName: 'type',
							mapping: {
								'geo-point': '#/components/schemas/GeoPointFieldMeta',
								'integer': '#/components/schemas/NumberFieldMeta',
								'float': '#/components/schemas/NumberFieldMeta',
								'boolean': '#/components/schemas/BooleanFieldMeta',
								'text': '#/components/schemas/TextFieldMeta',
								'multiline': '#/components/schemas/TextFieldMeta',
								'single-select': '#/components/schemas/SelectFieldMeta',
								'multi-select': '#/components/schemas/SelectFieldMeta',
								'date': '#/components/schemas/SimpleDateFieldMeta',
								'date-time': '#/components/schemas/SimpleDateFieldMeta',
								'date-range': '#/components/schemas/RangeDateFieldMeta',
								'multi-date': '#/components/schemas/MultiDateFieldMeta'
							}
						},
						oneOf: [
							{ $ref: '#/components/schemas/GeoPointFieldMeta' },
							{ $ref: '#/components/schemas/NumberFieldMeta' },
							{ $ref: '#/components/schemas/BooleanFieldMeta' },
							{ $ref: '#/components/schemas/TextFieldMeta' },
							{ $ref: '#/components/schemas/SelectFieldMeta' },
							{ $ref: '#/components/schemas/MultiDateFieldMeta' },
							{ $ref: '#/components/schemas/SimpleDateFieldMeta' },
							{ $ref: '#/components/schemas/RangeDateFieldMeta' },
						]
					},
					BaseFormItemDefinition: {
						type: 'object',
						required: ['id', 'path'], additionalProperties: false,
						properties: {
							id: { type: 'string', format: 'uuid' },
							path: { type: 'string' },
							relevance: { $ref: '#/components/schemas/RelevanceDefinition', nullable: true }
						}
					},

					SimpleDateFieldMeta: {
						type: 'object', additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseDateFieldProps' },
							{
								type: 'object',
								required: ['type'], additionalProperties: false,
								properties: {
									type: { type: 'string', enum: ['date', 'date-time'] },
									defaultValue: { type: 'number', nullable: true }
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
					RangeDateFieldMeta: {
						type: 'object', additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseDateFieldProps' },
							{
								type: 'object',
								required: ['type'], additionalProperties: false,
								properties: {
									type: { type: 'string', enum: ['date-range'] },
									defaultValue: {
										$ref: '#/components/schemas/NumberRange'
									}
								}
							}
						]
					},
					MultiDateFieldMeta: {
						type: 'object', additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseDateFieldProps' },
							{
								type: 'object',
								required: ['type'], additionalProperties: false,
								properties: {
									type: { type: 'string', enum: ['multi-date'] },
									minSelection: { type: 'integer', nullable: true },
									maxSelection: { type: 'integer', nullable: true },
									defaultValue: {
										type: 'array',
										nullable: true,
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
								properties: {
									min: { type: 'number', nullable: true },
									max: { type: 'number', nullable: true }
								}
							}
						]
					},

					BaseFieldProps: {
						type: 'object', additionalProperties: false,
						properties: {
							required: { type: 'boolean', default: true, nullable: true },
							span: { type: 'integer', default: 12, nullable: true },
							readonly: { type: 'boolean', default: false, nullable: true }
						}
					},
					SeparatorItemMeta: {
						type: 'object',
						additionalProperties: false,
						properties: {
							orientation: { type: 'string', enum: ['vertical', 'horizontal'] },
						}
					},
					ImageItemMeta: {
						type: 'object',
						additionalProperties: false,
						required: ['width'],
						properties: {
							width: { type: 'number', minimum: 10 },
							caption: { type: 'string', nullable: true },
							height: { type: 'number', nullable: true },
							aspectRatio: { type: 'number', nullable: true },
							filter: { type: 'string', enum: ['none', 'shadow'], nullable: true }
						}
					},
					NoteItemMeta: {
						type: 'object', additionalProperties: false,
						required: ['fontSize'],
						properties: {
							fontSize: { type: 'integer', default: 13 }
						}
					},
					NumberFieldMeta: {
						type: 'object', additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFieldProps' },
							{
								type: 'object', additionalProperties: false,
								required: ['type'],
								properties: {
									type: { type: 'string', enum: ['integer', 'float'] },
									min: { type: 'number', nullable: true },
									max: { type: 'number', nullable: true },
									defaultValue: { type: 'number', nullable: true }
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
							long: { type: 'number', minimum: -180, maximum: 180 }
						}
					},
					GeoPointFieldMeta: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFieldProps' },
							{
								type: 'object', additionalProperties: false,
								required: ['type'],
								properties: {
									type: { type: 'string', enum: ['geo-point'] },
									defaultValue: {
										nullable: true,
										$ref: '#/components/schemas/GeoPoint'
									}
								}
							}
						]
					},
					BooleanFieldMeta: {
						type: 'object', additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFieldProps' },
							{
								type: 'object', additionalProperties: false,
								required: ['type'],
								properties: {
									type: { type: 'string', enum: ['boolean'] },
									defaultValue: { type: 'boolean', default: false, nullable: true },
									renderAs: { nullable: true, type: 'string', enum: ['select', 'checkbox'], default: 'checkbox' }
								}
							}
						]
					},
					TextFieldMeta: {
						type: 'object', additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFieldProps' },
							{
								type: 'object', additionalProperties: false,
								required: ['type'],
								properties: {
									type: { type: 'string', enum: ['text', 'multiline'] },
									pattern: { type: 'string', nullable: true },
									minlength: { type: 'number', nullable: true },
									maxlength: { type: 'number', nullable: true },
									defaultValue: { type: 'string', nullable: true }
								}
							}
						]
					},

					SelectFieldMeta: {
						type: 'object', additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/BaseFieldProps' },
							{
								type: 'object',
								additionalProperties: false,
								required: ['type'],
								properties: {
									type: { type: 'string', enum: ['single-select', 'multi-select'] },
									itemSourceRef: { type: 'string', nullable: true },
									defaultValue: { type: 'string', nullable: true },
									hardItems: {
										type: 'array',
										default: [],
										items: {
											additionalProperties: false,
											type: 'object',
											properties: {
												label: { type: 'string', nullable: true },
												value: { type: 'string', nullable: true }
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
							$ref: '#/components/schemas/FormVersionDefinition'
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