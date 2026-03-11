import z from "zod";

export const NewDatasetRefRequestSchema = z.object({
	dataset: z.string().trim().nonempty('dataset is required').pipe(z.uuid('Invalid dataset ID format')),
	selectedItems: z.string().trim().nonempty('Invalid item ID').pipe(z.uuid('Invalid item ID format')).array(),
	selectAll: z.boolean(),
	followDatasetUpdates: z.boolean(),
});
export type NewDatasetRefRequest = z.output<typeof NewDatasetRefRequestSchema>;
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