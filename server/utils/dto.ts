import { z } from "zod";

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

export const FindFormOptionsResponseSchema = z.object({
	groups: z.object({
		description: z.string().nullable(),
		title: z.string(),
		id: z.uuid(),
		key: z.string(),
		parentId: z.uuid().nullable(),
		options: z.object({
			id: z.uuid(),
			label: z.string(),
			parentValue: z.string().nullable(),
			ordinal: z.int(),
			value: z.string(),
			i18nKey: z.string().nullable(),
		}).array(),
		parent: z.object({
			title: z.string(),
			description: z.string().nullable(),
			key: z.string()
		}).nullable()
	}).array()
})