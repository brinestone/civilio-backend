import { z } from "zod";

export const FormFieldTypeSchema = z.enum([
	'text',
	'multiline',
	'date',
	'date-time',
	'email',
	'url',
	'geo-point',
	'single-select',
	'multi-select',
	'file',
	'number',
	'phone',
	'boolean',
]);

export const ToggleApprovalStatusRequestSchema = z.object({
	index: z.coerce.number(),
	form: z.string().nonempty()
})

export const DeleteSubmissionRequestSchema = z.object({
	form: z.string().nonempty(),
	index: z.coerce.number()
})

export const VersionExistsRequestSchema = z.object({
	form: z.string(),
	index: z.coerce.number(),
	version: z.string().nonempty()
});

export const OptionItemSchema = z.object({
	i18nKey: z.string().nullable(),
	id: z.uuid(),
	groupId: z.uuid().nullable(),
	label: z.string(),
	parentValue: z.string().nullable().optional(),
	value: z.string(),
	ordinal: z.int()
});

export const GroupLineSchema = z.object({
	description: z.string().nullable().optional(),
	title: z.string(),
	parentId: z.string().nullable().optional(),
	id: z.uuid().optional(),
	key: z.string().nonempty(),
	options: OptionItemSchema.array().default([])
})

export const FormOptionsUpsertRequestSchema = z.discriminatedUnion('isNew', [
	z.object({
		isNew: z.literal(true),
		data: GroupLineSchema.extend({
			options: OptionItemSchema.omit({
				id: true,
				groupId: true
			}).array().default([])
		}).omit({
			id: true
		})
	}),
	z.object({
		isNew: z.literal(false),
		data: GroupLineSchema.partial().extend({
			id: z.uuid(),
			options: z.discriminatedUnion('isNew', [
				OptionItemSchema.partial().extend({
					isNew: z.literal(false),
					id: z.uuid()
				}).omit({
					groupId: true,
				}),
				OptionItemSchema.extend({
					isNew: z.literal(true),
				}).omit({
					id: true,
					groupId: true,
				})
			]).array().default([])
		})
	})
]).array();
export type FormOptionsUpsertRequest = z.infer<typeof FormOptionsUpsertRequestSchema>;

export const FindAllDatasetsResponseSchema = z.object({
	groups: z.object({
		description: z.string().nullish(),
		title: z.string(),
		id: z.uuid(),
		key: z.string(),
		parentId: z.uuid().nullish(),
		createdAt: z.date().transform(d => d.toISOString()).pipe(z.iso.date()),
		updatedAt: z.date().transform(d => d.toISOString()).pipe(z.iso.date()),
		items: z.object({
			id: z.uuid(),
			label: z.string(),
			parentValue: z.string().nullish(),
			ordinal: z.int(),
			value: z.string(),
			i18nKey: z.string().nullish(),
		}).array(),
		parent: z.object({
			title: z.string(),
			description: z.string().nullish(),
			key: z.string()
		}).nullish()
	}).array()
});

export type SubmissionVersionExistsRequest = z.infer<typeof VersionExistsRequestSchema>;
export type DeleteSubmissionRequest = z.input<typeof DeleteSubmissionRequestSchema>;
export type ToggleApprovalStatusRequest = z.input<typeof ToggleApprovalStatusRequestSchema>;