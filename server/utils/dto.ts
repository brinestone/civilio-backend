import { z } from "zod";

export const LookupFormSubmissionsRequestSchema = z.object({
	page: z.coerce.number().min(0).default(0),
	limit: z.coerce.number().min(1).default(100),
	form: z.string().trim().optional(),
	fv: z.string().trim().optional().pipe(z.uuid('Invalid UUID').optional()),
	sort: z.record(z.string(), z.enum(['asc', 'desc'])).optional()
});

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
	form: z.string().nonempty(),
	formVersion: z.uuid().optional(),
	submissionVersion: z.uuid().optional()
})

export const DeleteSubmissionRequestSchema = z.object({
	index: z.coerce.number(),
	form: z.string().nonempty(),
	formVersion: z.string().optional(),
	submissionVersion: z.string().optional()
});

export const DatasetItemSchema = z.object({
	id: z.uuid(),
	dataset: z.uuid().nullish(),
	label: z.string(),
	parentValue: z.string().nullish(),
	value: z.string(),
	ordinal: z.int()
});

export const DatasetLineSchema = z.object({
	description: z.string().nullish(),
	title: z.string().nonempty('Title is required'),
	parentId: z.string().nullish(),
	id: z.uuid().nullish(),
	key: z.string().nonempty('Key is required'),
	items: DatasetItemSchema.array().default([])
})

export const DatasetUpsertRequestSchema = z.discriminatedUnion('isNew', [
	z.object({
		isNew: z.literal('true'),
		data: DatasetLineSchema.extend({
			items: DatasetItemSchema.omit({
				id: true,
				dataset: true
			}).array().default([])
		}).omit({
			id: true
		})
	}),
	z.object({
		isNew: z.literal('false'),
		data: DatasetLineSchema.partial().extend({
			id: z.uuid(),
			items: z.discriminatedUnion('isNew', [
				DatasetItemSchema.partial().extend({
					isNew: z.literal('false'),
					id: z.uuid()
				}),
				DatasetItemSchema.extend({
					isNew: z.literal('true'),
				}).omit({
					id: true,
					dataset: true,
				})
			]).array().default([])
		})
	})
]).array();
export type DatasetUpsertRequest = z.infer<typeof DatasetUpsertRequestSchema>;

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

export type DeleteSubmissionRequest = z.output<typeof DeleteSubmissionRequestSchema>;
export type ToggleApprovalStatusRequestInput = z.input<typeof ToggleApprovalStatusRequestSchema>;
export type ToggleApprovalStatusRequest = z.output<typeof ToggleApprovalStatusRequestSchema>;
export type LookupFormSubmissionsRequest = z.output<typeof LookupFormSubmissionsRequestSchema>;