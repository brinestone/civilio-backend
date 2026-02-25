import { and, eq, ne, not, sql } from "drizzle-orm";
import { provideDb } from "../db";
import { forms, formVersions } from "../db/schema";
import { randomString } from "../misc";
import { Connection, Transaction } from "../types/types";

export async function toggleFormArchived(slug: string) {
	const db = provideDb();
	await db.transaction(tx => tx.update(forms)
		.set({ archived: not(forms.archived) })
		.where(eq(forms.slug, slug))
	)
}

export async function createForm(title: string, description?: string) {
	const db = provideDb();
	const newSlug = randomString(16);
	return await db.transaction(async tx => {
		const [formInfo] = await tx.insert(forms).values({
			slug: newSlug,
			title,
			description,
		}).returning();

		const [versionInfo] = await tx.insert(formVersions).values({
			form: newSlug,
			isCurrent: true,
		}).returning();

		await tx.update(formVersions).set({ isCurrent: false }).where(and(
			eq(formVersions.form, newSlug),
			ne(formVersions.id, versionInfo.id),
		));
		return { formInfo, versionInfo };
	})
}

export async function formTitleAvailable(title: string) {
	const db = provideDb();
	const result = await db.execute<{ available: boolean }>(sql`
		SELECT NOT EXISTS(SELECT 1 FROM ${forms} WHERE ${eq(forms.title, title)}) AS "available"
		`);
	return result.rows[0];
}

export async function getCurrentFormVersionTx(conn: Connection | Transaction, form: string) {
	const result = await conn.query.formVersions.findFirst({
		columns: { id: true },
		where: {
			form,
			isCurrent: true,
		},
		orderBy: {
			updatedAt: 'desc'
		}
	});
	return result || null;
}

export async function formVersionExistsTx(tx: Transaction | Connection, slug: string, version: string) {
	const result = await tx.execute<{ exists: boolean }>(sql`
		SELECT EXISTS (SELECT 1 FROM ${formVersions} WHERE ${and(eq(formVersions.id, version), eq(formVersions.form, slug))}) AS "exists"
		`);
	return result.rows[0]?.exists ?? false;
}

/**
 * Finds a form definition by slug and optional version.
 * 
 * @param slug - The form slug identifier
 * @param version - Optional specific version ID. If not provided, returns the current version
 * @returns A promise that resolves to the form version with its items and children, or undefined if not found
 * 
 * @example
 * // Get current form version
 * const form = await findFormDefinition('contact-form');
 * 
 * @example
 * // Get specific form version
 * const form = await findFormDefinition('contact-form', 'v1.2.0');
 */
export async function findFormDefinition(slug: string, version?: string) {
	const db = provideDb();
	if (version) {
		return await db.query.formVersions.findFirst({
			columns: { form: false },
			where: {
				AND: [
					{ form: slug },
					{ id: version }
				]
			},
			with: {
				items: {
					with: {
						children: true
					}
				},
			}
		});
	}
	return await db.query.formVersions.findFirst({
		columns: { form: false },
		where: {
			AND: [
				{ form: slug },
				{ isCurrent: true }
			]
		},
		with: {
			items: {
				with: {
					children: true
				}
			},
		}
	});
}

export async function formSlugAvailable(slug: string) {
	const db = provideDb();
	const result = await db.execute<{ exists: boolean }>(sql`
    SELECT NOT EXISTS(SELECT 1
                  FROM ${forms}
                  WHERE ${eq(forms.slug, slug)}) AS "exists"
  `);
	return result.rows[0].exists;
}

export async function findFormSubmissionData(index: number, form: string, version?: string) {
	const db = provideDb();

	let result = {} as Record<string, any>;
	let queryResult = await db.execute<{ t: string }>(sql`
    SELECT DISTINCT t.table_name::TEXT as t
    FROM information_schema.tables t
    WHERE t.table_schema = ${form};
  `);

	const tableNames = queryResult.rows.map(row => row.t);
	for (const tableName of tableNames) {
		// language=PostgreSQL
		const queryResult = await db.execute<{ data: Record<string, unknown> }>(sql`
      SELECT revisions.get_version_data(${form}, ${index}, ${tableName},
                                        ${version || null}, ${false}) as data
    `);
		const row = queryResult.rows[0]?.data;
		if (!row) continue;
		result = { ...result, ...row };
	}
	return result;
}

export async function lookupFormVersionsByFormSlug(slug: string) {
	const db = provideDb();

	return await db.query.formVersions.findMany({
		where: {
			form: slug
		},
	});
}

export async function lookupForms() {
	const db = provideDb();
	return await db.query.formDefinitions.findMany({
		columns: {
			slug: true,
			updatedAt: true,
			title: true,
		},
		with: {
			currentVersion: {
				columns: {
					id: true
				}
			}
		},
		orderBy: {
			updatedAt: 'desc'
		},
		where: {
			archived: {
				ne: true
			}
		}
	});
}