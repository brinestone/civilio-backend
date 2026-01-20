import { and, eq } from "drizzle-orm";
import _ from 'lodash';

export async function deleteGroup(groupId: string) {
	const db = provideDb();
	Logger.info(`Deleting dataset group`, { groupId });
	const { rowCount } = await db.transaction(tx => tx.delete(choiceGroups)
		.where(eq(choiceGroups.id, groupId))
	);
	Logger.info(`Dataset group deleted`, { affectedRows: rowCount });
}

export async function deleteOption(groupId: string, optionId: string) {
	const db = provideDb();
	await db.transaction(async tx => {
		await tx.delete(choiceValues)
			.where(and(
				eq(choiceValues.id, optionId),
				eq(choiceValues.groupId, groupId)
			));
	});
}

export async function upsertFormOptions(param: FormOptionsUpsertRequest) {
	const db = provideDb();
	await db.transaction(async tx => {
		for (const group of param) {
			await tx.transaction(async ttx => {
				let groupId: string;
				if (group.isNew) {
					const [result] = await ttx.insert(choiceGroups)
						.values({
							title: group.data.title,
							description: group.data.description || null,
							key: group.data.key,
							parentId: group.data.parentId,
						}).returning({
							id: choiceGroups.id
						});
					groupId = result.id;

					for (const option of group.data.options) {
						await ttx.insert(choiceValues)
							.values({
								groupId,
								label: option.label,
								value: option.value,
								i18nKey: option.i18nKey,
								ordinal: option.ordinal,
								parentValue: option.parentValue || null
							});
					}
				} else {
					const change = _.omit(group.data, ['id', 'options']);
					await ttx.update(choiceGroups)
						.set(change)
						.where(
							eq(choiceGroups.id, group.data.id)
						).returning({
							id: choiceGroups.id
						});
					groupId = group.data.id;
					for (const option of group.data.options) {
						if (option.isNew) {
							await ttx.insert(choiceValues)
								.values({
									groupId,
									label: option.label,
									ordinal: option.ordinal,
									value: option.value,
									i18nKey: option.i18nKey,
									parentValue: option.parentValue || null
								});
						} else {
							await ttx.update(choiceValues)
								.set({
									value: option.value,
									label: option.label,
									ordinal: option.ordinal,
									i18nKey: option.i18nKey,
									parentValue: option.parentValue || null
								}).where(and(
									eq(choiceValues.groupId, groupId),
									eq(choiceValues.id, option.id)
								))
						}
					}
				}

				// for (const option of group.data.options ?? []) {
				//   await ttx.insert(choiceValues)
				/* {
							label: option.label,
							groupId,
							i18nKey: option.i18nKey || null,
							value: option.value,
						}
								*/
				//     .values(change).onConflictDoUpdate({
				//       target: [choiceValues.id],
				//       set: {
				//         label: option.label,
				//         i18nKey: option.i18nKey || null
				//       }
				//     })
				// }
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

export async function findAllFormOptions() {
	const db = provideDb();

	return await db.query.choiceGroups.findMany({
		orderBy: {
			title: 'asc',
			createdAt: 'desc',
			updatedAt: 'desc',
		},
		with: {
			parent: {
				columns: {
					title: true,
					description: true,
					key: true
				}
			},
			options: {
				orderBy: {
					ordinal: 'asc'
				}
			}
		},
	});
}