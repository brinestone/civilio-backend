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
});

const RelevanceLogicExpressionSchema = z.object({
	field: z.string(),
	operator: RelevanceLogicExpressionOperatorSchema,
	negated: z.boolean(),
	value: z.string().nullish().default(null)
});

const RelevanceConditionSchema = z.object({
	operator: z.enum(['and', 'or']),
	expressions: z.array(RelevanceLogicExpressionSchema)
});

const RelevanceDefinitionSchema = z.object({
	enabled: z.boolean().default(true),
	operator: z.enum(['and', 'or']).default('and'),
	logic: z.array(RelevanceConditionSchema)
});

const TagSchema = z.object({ key: z.string().nullish(), value: z.string().nullish() });
export type Tag = z.infer<typeof TagSchema>;

// Base Form Item Definition
const BaseNewFormItemDefinitionSchema = z.object({
	path: z.string(),
	relevance: RelevanceDefinitionSchema.nullable(),
	tags: TagSchema.array().nullish().default([]),
	itemId: z.string().nullish(),
	metaTag: z.string().nullish()
});

// Field Config schemas
const BaseFieldPropsSchema = z.object({
	required: z.boolean().default(true).nullable(),
	readonly: z.boolean().default(false).nullable(),
	dataKey: z.string().trim().nullish(),
	autoDataKey: z.boolean().nullish(),
	title: z.string(),
	description: z.string().nullable()
});

// Date field schemas
const BaseDateFieldPropsSchema = BaseFieldPropsSchema.extend({
	min: z.number().nullable(),
	max: z.number().nullable()
});

const SimpleDateFieldConfigSchema = BaseDateFieldPropsSchema.extend({
	type: z.enum(['date', 'date-time']),
	defaultValue: z.number().nullable()
});

const RangeDateFieldConfigSchema = BaseDateFieldPropsSchema.extend({
	type: z.literal('date-range'),
	defaultValue: NumberRangeSchema
});

const MultiDateFieldConfigSchema = BaseDateFieldPropsSchema.extend({
	type: z.literal('multi-date'),
	minSelection: z.number().int().nullable(),
	maxSelection: z.number().int().nullable(),
	defaultValue: z.array(z.number()).nullable()
});

// GeoPoint schemas
const GeoPointSchema = z.object({
	lat: z.number().min(-90).max(90),
	long: z.number().min(-180).max(180)
});

const GeoPointFieldConfigSchema = BaseFieldPropsSchema.extend({
	type: z.literal('geo-point'),
	defaultValue: GeoPointSchema.nullable()
});

// Number field config
const NumberFieldConfigSchema = BaseFieldPropsSchema.extend({
	type: z.enum(['integer', 'float']),
	min: z.number().nullable(),
	max: z.number().nullable(),
	defaultValue: z.number().nullable()
});

// Boolean field config
const BooleanFieldConfigSchema = BaseFieldPropsSchema.extend({
	type: z.literal('boolean'),
	defaultValue: z.boolean().default(false).nullable(),
	renderAs: z.enum(['select', 'checkbox']).default('checkbox').nullable()
});

// Text field config
const TextFieldConfigSchema = BaseFieldPropsSchema.extend({
	type: z.enum(['text', 'multiline']),
	pattern: z.string().nullable(),
	minlength: z.number().nullable(),
	maxlength: z.number().nullable(),
	defaultValue: z.string().nullable()
});

// Select field config
const SelectFieldConfigSchema = BaseFieldPropsSchema.extend({
	type: z.enum(['single-select', 'multi-select']),
	itemSourceRef: z.string().nullable(),
	defaultValue: z.string().nullable(),
	hardItems: z.array(z.object({
		label: z.string().nullable(),
		value: z.string().nullable()
	})).default([])
});

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
});

const ImageItemConfigSchema = z.object({
	url: z.string(),
	width: z.number().min(10),
	caption: z.string().nullable(),
	height: z.number().nullable(),
	aspectRatio: z.number().nullable(),
	filter: z.enum(['none', 'shadow']).nullable()
});

const NoteItemConfigSchema = z.object({
	fontSize: z.number().int().default(13)
});

// Form Item Definitions
const NewFormItemImageSchema = BaseNewFormItemDefinitionSchema.extend({
	type: z.literal('image'),
	url: z.string(),
	config: ImageItemConfigSchema
});

const NewFormItemNoteSchema = BaseNewFormItemDefinitionSchema.extend({
	type: z.literal('note'),
	config: NoteItemConfigSchema
});

const NewFormItemSeparatorSchema = BaseNewFormItemDefinitionSchema.extend({
	type: z.literal('separator'),
	config: SeparatorItemConfigSchema.optional()
});

const NewFormItemFieldSchema = BaseNewFormItemDefinitionSchema.extend({
	type: z.literal('field'),
	config: FieldItemConfigSchema,
	parentId: z.uuid().nullish()
});
const NewFormItemGroupSchema = BaseNewFormItemDefinitionSchema.extend({
	type: z.literal('group'),
	config: z.object({
		// fields: NewFormItemFieldSchema.array(),
		title: z.string().trim(),
		description: z.string().trim().nullish(),
		repeatable: z.boolean().nullish().default(true),
		divisionCount: z.int().min(1).nullish().default(1),
		orientation: z.enum(['horizontal', 'vertical']).nullish().default('vertical')
	})
});
const FormItemExtrasSchema = BaseNewFormItemDefinitionSchema.extend({
	id: z.uuid(),
	itemId: z.uuid()
});
const FormItemExtras = FormItemExtrasSchema.shape;

export const FormItemFieldSchema = NewFormItemFieldSchema.extend(FormItemExtras);
export const FormItemGroupSchema = NewFormItemGroupSchema.extend({
	config: NewFormItemGroupSchema.shape.config.extend({
		fields: z.union([
			FormItemFieldSchema,
			NewFormItemFieldSchema
		]).array()
	})
}).extend(FormItemExtras);
export const FormItemNoteSchema = NewFormItemNoteSchema.extend(FormItemExtras);
export const FormItemImageSchema = NewFormItemImageSchema.extend(FormItemExtras);
export const FormItemSeparatorSchema = NewFormItemSeparatorSchema.extend(FormItemExtras);

export const FormItemNoteUpdateSchema = FormItemNoteSchema.extend({});
export const FormItemImageUpdateSchema = FormItemImageSchema.extend({});
export const FormItemFieldUpdateSchema = FormItemFieldSchema.extend({
	parentId: z.uuid().nullish()
});
export const FormItemSeparatorUpdateSchema = FormItemSeparatorSchema.extend({});
export const FormItemGroupUpdateSchema = NewFormItemGroupSchema.extend(FormItemExtras);

export const FormItemDefinitionUpdateSchema = z.discriminatedUnion('type', [
	FormItemNoteUpdateSchema,
	FormItemImageUpdateSchema,
	FormItemFieldUpdateSchema,
	FormItemSeparatorUpdateSchema,
	FormItemGroupUpdateSchema
])

// Main FormItemDefinition union
export const FormItemDefinitionSchema = z.discriminatedUnion('type', [
	FormItemGroupSchema,
	FormItemNoteSchema,
	FormItemFieldSchema,
	FormItemImageSchema,
	FormItemSeparatorSchema
]);

export const NewFormItemDefinitionSchema = z.discriminatedUnion('type', [
	NewFormItemGroupSchema,
	NewFormItemNoteSchema,
	NewFormItemFieldSchema,
	NewFormItemImageSchema,
	NewFormItemSeparatorSchema
]);

export type FormItemImage = z.infer<typeof FormItemImageSchema>;
export type FormItemGroup = z.infer<typeof FormItemGroupSchema>;
export type NewFormItemGroup = z.infer<typeof NewFormItemGroupSchema>;
export type FormItemDefinition = z.infer<typeof FormItemDefinitionSchema>;
export type NewFormItemDefinition = z.infer<typeof NewFormItemDefinitionSchema>;
export type NewFormItemField = Extract<NewFormItemDefinition, { type: 'field' }>;
export type FormItemDefinitionUpdate = z.infer<typeof FormItemDefinitionUpdateSchema>;
export type FormItemGroupUpdate = Extract<FormItemDefinitionUpdate, { type: 'group' }>;
export type FormItemFieldUpdate = Extract<FormItemDefinitionUpdate, { type: 'field' }>;