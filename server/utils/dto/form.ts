import { z } from 'zod';
import { GeoPointSchema } from '../types/types';

// UUID schema
const uuidSchema = z.uuid();

// NumberRange schema
const NumberRangeSchema = z.object({
	start: z.number().nullable().optional(),
	end: z.number().nullable().optional()
}).strict();

// BaseFieldProps schema
const BaseFieldPropsSchema = z.object({
	required: z.boolean().nullable().default(true).optional(),
	span: z.number().int().nullable().default(12).optional(),
	readonly: z.boolean().nullable().default(false).optional()
}).strict();

// BaseDateFieldProps schema
const BaseDateFieldPropsSchema = BaseFieldPropsSchema.extend({
	min: z.number().nullable().optional(),
	max: z.number().nullable().optional()
}).strict();

// Relevance Logic Expression Operator
const RelevanceLogicExpressionOperatorSchema = z.enum([
	'in', 'eq', 'ne', 'gt', 'lt', 'lte', 'gte', 'empty',
	'between', 'match', 'isNull', 'isNotNull', 'checked',
	'unchecked', 'selectedAny', 'selectedAll', 'noselection',
	'before', 'after', 'afterOrOn', 'beforeOrOn'
]);

// Relevance Logic Expression
const RelevanceLogicExpressionSchema = z.object({
	field: z.string(),
	operator: RelevanceLogicExpressionOperatorSchema,
	value: z.string().nullable().optional()
}).strict();

// Relevance Condition
const RelevanceConditionSchema = z.object({
	operator: z.enum(['and', 'or']),
	expressions: z.array(RelevanceLogicExpressionSchema)
}).strict();

// Relevance Definition
const RelevanceDefinitionSchema = z.object({
	enabled: z.boolean().default(true).optional(),
	operator: z.enum(['and', 'or']).default('and').optional(),
	logic: z.array(RelevanceConditionSchema)
}).strict();

// Base Form Item Definition
const BaseFormItemDefinitionSchema = z.object({
	id: uuidSchema.nullish(),
	path: z.string(),
	relevance: RelevanceDefinitionSchema.nullable().optional()
}).strict();

// Image Item Meta
const ImageItemMetaSchema = z.object({
	width: z.number().min(10),
	caption: z.string().nullable().optional(),
	height: z.number().nullable().optional(),
	aspectRatio: z.number().nullable().optional(),
	filter: z.enum(['none', 'shadow']).nullable().optional()
}).strict();

// Note Item Meta
const NoteItemMetaSchema = z.object({
	fontSize: z.number().int().default(13)
}).strict();

// Separator Item Meta
const SeparatorItemMetaSchema = z.object({
	orientation: z.enum(['vertical', 'horizontal']).optional()
}).strict();

// --- Field Meta Schemas ---

// Number Field Meta
const NumberFieldMetaSchema = BaseFieldPropsSchema.extend({
	type: z.enum(['integer', 'float']),
	min: z.number().nullable().optional(),
	max: z.number().nullable().optional(),
	defaultValue: z.number().nullable().optional()
}).strict();

// Boolean Field Meta
const BooleanFieldMetaSchema = BaseFieldPropsSchema.extend({
	type: z.literal('boolean'),
	defaultValue: z.boolean().default(false).nullable().optional(),
	renderAs: z.enum(['select', 'checkbox']).default('checkbox').nullable().optional()
}).strict();

// Text Field Meta
const TextFieldMetaSchema = BaseFieldPropsSchema.extend({
	type: z.enum(['text', 'multiline']),
	pattern: z.string().nullable().optional(),
	minlength: z.number().nullable().optional(),
	maxlength: z.number().nullable().optional(),
	defaultValue: z.string().nullable().optional()
}).strict();

// Select Field Meta
const SelectFieldMetaSchema = BaseFieldPropsSchema.extend({
	type: z.enum(['single-select', 'multi-select']),
	itemSourceRef: z.string().nullable().optional(),
	defaultValue: z.string().nullable().optional(),
	hardItems: z.array(
		z.object({
			label: z.string().nullable().optional(),
			value: z.string().nullable().optional()
		}).strict()
	).default([]).optional()
}).strict();

// GeoPoint Field Meta
const GeoPointFieldMetaSchema = BaseFieldPropsSchema.extend({
	type: z.literal('geo-point'),
	defaultValue: GeoPointSchema.nullable().optional()
}).strict();

// Simple Date Field Meta
const SimpleDateFieldMetaSchema = BaseDateFieldPropsSchema.extend({
	type: z.enum(['date', 'date-time']),
	defaultValue: z.number().nullable().optional()
}).strict();

// Range Date Field Meta
const RangeDateFieldMetaSchema = BaseDateFieldPropsSchema.extend({
	type: z.literal('date-range'),
	defaultValue: NumberRangeSchema.nullable().optional()
}).strict();

// Multi Date Field Meta
const MultiDateFieldMetaSchema = BaseDateFieldPropsSchema.extend({
	type: z.literal('multi-date'),
	minSelection: z.number().int().nullable().optional(),
	maxSelection: z.number().int().nullable().optional(),
	defaultValue: z.array(z.number()).nullable().optional()
}).strict();

// Field Item Meta (Discriminated union)
const FieldItemMetaSchema = z.discriminatedUnion('type', [
	GeoPointFieldMetaSchema,
	NumberFieldMetaSchema,
	BooleanFieldMetaSchema,
	TextFieldMetaSchema,
	SelectFieldMetaSchema,
	SimpleDateFieldMetaSchema,
	RangeDateFieldMetaSchema,
	MultiDateFieldMetaSchema
]);

// --- Form Item Schemas ---

// Forward declaration for recursive types
// type FormItemDefinition = z.infer<typeof FormItemDefinitionSchema>;

// Form Item Image
const FormItemImageSchema = BaseFormItemDefinitionSchema.extend({
	type: z.literal('image'),
	url: z.string(),
	meta: ImageItemMetaSchema
}).strict();

// Form Item Note
const FormItemNoteSchema = BaseFormItemDefinitionSchema.extend({
	type: z.literal('note'),
	title: z.string(),
	meta: NoteItemMetaSchema
}).strict();

// Form Item Separator
const FormItemSeparatorSchema = BaseFormItemDefinitionSchema.extend({
	type: z.literal('separator'),
	meta: SeparatorItemMetaSchema.optional()
}).strict();

// Form Item Field
const FormItemFieldSchema = BaseFormItemDefinitionSchema.extend({
	type: z.literal('field'),
	title: z.string(),
	description: z.string().nullable().optional(),
	meta: FieldItemMetaSchema
}).strict();

// Form Item Group
const FormItemGroupSchema = BaseFormItemDefinitionSchema.extend({
	type: z.literal('group'),
	fields: z.lazy(() => FormItemFieldSchema.array())
}).strict();

// Form Item Definition (discriminated union)
const FormItemDefinitionSchema = z.discriminatedUnion('type', [
	FormItemNoteSchema,
	FormItemFieldSchema,
	FormItemImageSchema,
	FormItemGroupSchema,
	FormItemSeparatorSchema
]) as z.ZodType<any>;

// Form Version Definition
const FormVersionDefinitionSchema = z.object({
	id: uuidSchema,
	parentId: uuidSchema.nullable().optional(),
	items: z.array(FormItemDefinitionSchema)
}).strict();

// Type exports
type FormVersionDefinition = z.infer<typeof FormVersionDefinitionSchema>;
type FormItemDefinition = z.infer<typeof FormItemDefinitionSchema>;
type FieldItemMeta = z.infer<typeof FieldItemMetaSchema>;
type RelevanceDefinition = z.infer<typeof RelevanceDefinitionSchema>;
type GeoPoint = z.infer<typeof GeoPointSchema>;
type NumberRange = z.infer<typeof NumberRangeSchema>;

export {
	// Main schemas
	FormVersionDefinitionSchema,
	FormItemDefinitionSchema,
	FieldItemMetaSchema,
	RelevanceDefinitionSchema,

	// Supporting schemas (export if needed)
	NumberRangeSchema,
	BaseFieldPropsSchema,
	BaseDateFieldPropsSchema,
	RelevanceLogicExpressionOperatorSchema,
	RelevanceLogicExpressionSchema,
	RelevanceConditionSchema,
	BaseFormItemDefinitionSchema,
	ImageItemMetaSchema,
	NoteItemMetaSchema,
	SeparatorItemMetaSchema,
	NumberFieldMetaSchema,
	BooleanFieldMetaSchema,
	TextFieldMetaSchema,
	SelectFieldMetaSchema,
	GeoPointFieldMetaSchema,
	SimpleDateFieldMetaSchema,
	RangeDateFieldMetaSchema,
	MultiDateFieldMetaSchema,
	FormItemGroupSchema,
	FormItemImageSchema,
	FormItemNoteSchema,
	FormItemSeparatorSchema,
	FormItemFieldSchema,

	// Types
	type FormVersionDefinition,
	type FormItemDefinition,
	type FieldItemMeta,
	type RelevanceDefinition,
	type GeoPoint,
	type NumberRange
};