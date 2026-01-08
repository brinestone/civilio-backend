import { z } from "zod";

export const OptionItemSchema = z.object({
  i18nKey: z.string().nullable(),
  // isNew: z.boolean(),
  // key: z.string().optional(),
  label: z.string(),
  value: z.string(),
});

export const GroupLineSchema = z.object({
  description: z.string().nullable().optional(),
  title: z.string(),
  parentKey: z.string().nullable(),
  parentValue: z.string().nullable(),
  key: z.string().nullable(),
  options: OptionItemSchema.array().default([])
})

export const FormOptionsUpsertRequestSchema = z.discriminatedUnion('isNew', [
  z.object({
    isNew: z.literal(true),
    data: GroupLineSchema
  }),
  z.object({
    isNew: z.literal(false),
    data: GroupLineSchema.extend({
      key: z.string(),
    }).partial()
  })
]).array();
export type FormOptionsUpsertRequest = z.infer<typeof FormOptionsUpsertRequestSchema>;

export const FindFormOptionsResponseSchema = z.object({
  groups: z.object({
    description: z.string().nullable(),
    form: z.string(),
    title: z.string(),
    key: z.string(),
    parentValue: z.string().nullable(),
    parentKey: z.string().nullable(),
    options: z.object({
      form: z.string(),
      key: z.string(),
      fallbackLabel: z.string(),
      value: z.string(),
      i18nKey: z.string().nullable(),
    }).array(),
    parent: z.object({
      title: z.string(),
      description: z.string().nullable(),
    }).nullable()
  }).array()
})