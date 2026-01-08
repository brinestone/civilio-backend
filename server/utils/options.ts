import { and, eq } from "drizzle-orm";
import _ from 'lodash';

export async function upsertFormOptions(form: string, param: FormOptionsUpsertRequest) {
  const db = provideDb();
  await db.transaction(async tx => {
    for (const group of param) {
      await tx.transaction(async ttx => {
        let key: string;
        if (group.isNew) {
          const [result] = await ttx.insert(choiceGroups)
            .values({
              title: group.data.title,
              form: form,
              description: group.data.description || null,
              parentKey: group.data.parentKey,
              parentValue: group.data.parentValue,
            }).returning({
              newKey: choiceGroups.key
            });
          key = result.newKey;
        } else {
          const change = _.omit(group.data, ['key', 'options']);
          const [result] = await ttx.update(choiceGroups)
            .set(change).where(
              and(
                eq(choiceGroups.form, form),
                eq(choiceGroups.key, group.data.key as string)
              )
            ).returning({
              newKey: choiceGroups.key
            });
          key = result.newKey
        }

        for (const option of group.data.options ?? []) {
          await ttx.insert(choiceValues)
            .values({
              ...option,
              form: form,
              key,
            }).onConflictDoUpdate({
              target: [choiceValues.key, choiceValues.form],
              set: {
                label: option.label,
                i18nKey: option.i18nKey || null
              }
            })
        }
      });
    }
  })
}

export async function optionGroupKeyAvailable(form: string, key: string) {
  const db = provideDb();
  const count = await db.$count(choices, and(
    eq(choices.group, key),
    eq(choices.version, form)
  ));
  return count == 0;
}

export async function findAllFormOptions(form: string) {
  const db = provideDb();

  return await db.query.choiceGroups.findMany({
    with: {
      parent: {
        columns: {
          title: true,
          description: true,
          key: true
        }
      },
      options: true
    },
    where: {
      form
    }
  });
  // return await db.select({
  //   title: choiceGroups.title,
  //   group: choiceGroups.key,
  //   description: choiceGroups.description,
  //   parentGroup: choiceGroups.parentKey,
  //   items: sql<Record<string, string | null>[]>`
  //     jsonb_agg(
  //       jsonb_build_object(
  //         'name', ${choices.name},
  //         'label', ${choices.label},
  //         'parentValue', ${choices.parentValue},
  //         'i18nKey', ${choices.i18NKey}
  //       )
  //     )
  //   `.as('items')
  // }).from(choices)
  //     .leftJoin(choiceGroups, (choice) => and(
  //         eq(choices.version, choiceGroups.form),
  //         eq(choices.group, choiceGroups.key)
  //     ))
  //     .where(
  //         eq(choices.version, form)
  //     ).groupBy(choices.group, choices.description, choices.parentGroup);
}