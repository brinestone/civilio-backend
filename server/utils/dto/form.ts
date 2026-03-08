import z from "zod";


// Relevance Logic schemas
const RelevanceLogicExpressionOperatorSchema = z.enum([
	'in', 'eq', 'ne', 'gt', 'lt', 'lte', 'gte', 'empty', 'between',
	'match', 'isNull', 'isNotNull', 'checked', 'unchecked', 'selectedAny', 'notEmpty',
	'selectedAll', 'noselection', 'before', 'after', 'afterOrOn', 'beforeOrOn'
]);

const NumberRangeSchema = z.object({
	start: z.number().nullable(),
	end: z.number().nullable()
}).strict();

const RelevanceLogicExpressionSchema = z.object({
	field: z.string(),
	operator: RelevanceLogicExpressionOperatorSchema,
	negated: z.boolean(),
	value: z.string().nullish().default(null)
}).strict();

const RelevanceConditionSchema = z.object({
	operator: z.enum(['and', 'or']),
	expressions: z.array(RelevanceLogicExpressionSchema)
}).strict();

const RelevanceDefinitionSchema = z.object({
	enabled: z.boolean().default(true),
	operator: z.enum(['and', 'or']).default('and'),
	logic: z.array(RelevanceConditionSchema)
}).strict();

// Base Form Item Definition
const BaseNewFormItemDefinitionSchema = z.object({
	path: z.string(),
	relevance: RelevanceDefinitionSchema.nullable(),
	tags: z.string().array().nullish().default([])
}).strict();

// Field Config schemas
const BaseFieldPropsSchema = z.object({
	required: z.boolean().default(true).nullable(),
	readonly: z.boolean().default(false).nullable(),
	dataKey: z.string().trim().nullish(),
	title: z.string(),
	description: z.string().nullable()
}).strict();

// Date field schemas
const BaseDateFieldPropsSchema = BaseFieldPropsSchema.extend({
	min: z.number().nullable(),
	max: z.number().nullable()
}).strict();

const SimpleDateFieldConfigSchema = BaseDateFieldPropsSchema.extend({
	type: z.enum(['date', 'date-time']),
	defaultValue: z.number().nullable()
}).strict();

const RangeDateFieldConfigSchema = BaseDateFieldPropsSchema.extend({
	type: z.literal('date-range'),
	defaultValue: NumberRangeSchema
}).strict();

const MultiDateFieldConfigSchema = BaseDateFieldPropsSchema.extend({
	type: z.literal('multi-date'),
	minSelection: z.number().int().nullable(),
	maxSelection: z.number().int().nullable(),
	defaultValue: z.array(z.number()).nullable()
}).strict();

// GeoPoint schemas
const GeoPointSchema = z.object({
	lat: z.number().min(-90).max(90),
	long: z.number().min(-180).max(180)
}).strict();

const GeoPointFieldConfigSchema = BaseFieldPropsSchema.extend({
	type: z.literal('geo-point'),
	defaultValue: GeoPointSchema.nullable()
}).strict();

// Number field config
const NumberFieldConfigSchema = BaseFieldPropsSchema.extend({
	type: z.enum(['integer', 'float']),
	min: z.number().nullable(),
	max: z.number().nullable(),
	defaultValue: z.number().nullable()
}).strict();

// Boolean field config
const BooleanFieldConfigSchema = BaseFieldPropsSchema.extend({
	type: z.literal('boolean'),
	defaultValue: z.boolean().default(false).nullable(),
	renderAs: z.enum(['select', 'checkbox']).default('checkbox').nullable()
}).strict();

// Text field config
const TextFieldConfigSchema = BaseFieldPropsSchema.extend({
	type: z.enum(['text', 'multiline']),
	pattern: z.string().nullable(),
	minlength: z.number().nullable(),
	maxlength: z.number().nullable(),
	defaultValue: z.string().nullable()
}).strict();

// Select field config
const SelectFieldConfigSchema = BaseFieldPropsSchema.extend({
	type: z.enum(['single-select', 'multi-select']),
	itemSourceRef: z.string().nullable(),
	defaultValue: z.string().nullable(),
	hardItems: z.array(z.object({
		label: z.string().nullable(),
		value: z.string().nullable()
	}).strict()).default([])
}).strict();

// Field Item Config union
const FieldItemConfigSchema = z.discriminatedUnion('type', [
	GeoPointFieldConfigSchema,
	NumberFieldConfigSchema,
	BooleanFieldConfigSchema,
	TextFieldConfigSchema,
	SelectFieldConfigSchema,
	MultiDateFieldConfigSchema,
	SimpleDateFieldConfigSchema,
	RangeDateFieldConfigSchema
]);

// Other item config schemas
const SeparatorItemConfigSchema = z.object({
	orientation: z.enum(['vertical', 'horizontal']).optional()
}).strict();

const ImageItemConfigSchema = z.object({
	url: z.string(),
	width: z.number().min(10),
	caption: z.string().nullable(),
	height: z.number().nullable(),
	aspectRatio: z.number().nullable(),
	filter: z.enum(['none', 'shadow']).nullable()
}).strict();

const NoteItemConfigSchema = z.object({
	fontSize: z.number().int().default(13)
}).strict();

// Form Item Definitions
const NewFormItemGroupSchema = BaseNewFormItemDefinitionSchema.extend({
	type: z.literal('group'),
	config: z.object({
		fields: z.array(z.lazy(() => NewFormItemFieldSchema))
	}).strict()
}).strict();

const NewFormItemImageSchema = BaseNewFormItemDefinitionSchema.extend({
	type: z.literal('image'),
	url: z.string(),
	config: ImageItemConfigSchema
}).strict();

const NewFormItemNoteSchema = BaseNewFormItemDefinitionSchema.extend({
	type: z.literal('note'),
	config: NoteItemConfigSchema
}).strict();

const NewFormItemSeparatorSchema = BaseNewFormItemDefinitionSchema.extend({
	type: z.literal('separator'),
	config: SeparatorItemConfigSchema.optional()
}).strict();

const NewFormItemFieldSchema = BaseNewFormItemDefinitionSchema.extend({
	type: z.literal('field'),
	config: FieldItemConfigSchema
}).strict();
const BaseFormItemDefinitionSchema = BaseNewFormItemDefinitionSchema.extend({
	id: z.uuid(),
	itemId: z.uuid()
})

export const FormItemGroupSchema = NewFormItemGroupSchema.extend({
	// id: z.string().trim().pipe(z.uuid()),
	config: NewFormItemGroupSchema.shape.config.extend({
		fields: z.union([
			NewFormItemGroupSchema.shape.config.shape.fields.unwrap(),
			z.lazy(() => FormItemFieldSchema)
		]).array()
	})
})/* .and(BaseFormItemDefinitionSchema); */
export const FormItemNoteSchema = NewFormItemNoteSchema/* .and(BaseFormItemDefinitionSchema); */
export const FormItemFieldSchema = NewFormItemFieldSchema/* .and(BaseFormItemDefinitionSchema); */
export const FormItemImageSchema = NewFormItemImageSchema/* .and(BaseFormItemDefinitionSchema); */
export const FormItemSeparatorSchema = NewFormItemSeparatorSchema/* .and(BaseFormItemDefinitionSchema); */

// Main FormItemDefinition union
export const FormItemDefinitionSchema = z.discriminatedUnion('type', [
	FormItemGroupSchema,
	FormItemNoteSchema,
	FormItemFieldSchema,
	FormItemImageSchema,
	FormItemSeparatorSchema
]).and(BaseFormItemDefinitionSchema);

export const NewFormItemDefinitionSchema = z.discriminatedUnion('type', [
	NewFormItemGroupSchema,
	NewFormItemNoteSchema,
	NewFormItemFieldSchema,
	NewFormItemImageSchema,
	NewFormItemSeparatorSchema
]);

export type FormItemGroup = z.infer<typeof FormItemGroupSchema>;
export type NewFormItemGroup = z.infer<typeof NewFormItemGroupSchema>;
export type FormItemDefinition = z.infer<typeof FormItemDefinitionSchema>;
export type NewFormItemDefinition = z.infer<typeof NewFormItemDefinitionSchema>;
export type NewFormItemField = Extract<NewFormItemDefinition, { type: 'field' }>;