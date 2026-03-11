import { and, count, desc, eq, getColumns, gt, isNull, max, min, SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import _ from "lodash";
import { provideDb } from "../db";
import {
	forms,
	formSubmissions,
	formVersions,
	submissionResponses,
	submissionVersions
} from "../db/schema";
import {
	DeleteSubmissionRequest,
	LookupFormSubmissionsRequest,
	ToggleApprovalStatusRequest
} from "../dto/submission";
import Logger from "../logger";
import { NotFoundError, UnprocessibleError } from "../types/errors";
import { Connection, Transaction } from "../types/types";
import { formVersionExistsTx, getCurrentFormVersionTx } from "./forms";

export async function findSparseSubmissionIndexRanges(
	form: string, limit: number, includeArchived = false, cursor?: number,
) {
	const db = provideDb();
	const fs = alias(formSubmissions, 'fs');
	const conditions = [
		eq(fs.form, form)
	];

	if (cursor) {
		conditions.push(gt(fs.index, cursor));
	}

	if (!includeArchived)
		conditions.push(isNull(fs.archivedAt));

	const indexedData = db.$with('indexed_data').as(
		db.select({
			index: fs.index,
			gapGroup: sql<number>`${fs.index} - row_number() OVER (ORDER BY ${fs.index})`.as('gap_group')
		}).from(fs)
			.where(and(...conditions))
			.orderBy(fs.index)
			.limit(limit)
	);
	const mainQuery = db.with(indexedData).select({
		start: min(indexedData.index).as('start_index'),
		end: max(indexedData.index).as('end_date'),
		count: count().as('total_count')
	}).from(indexedData)
		.groupBy(indexedData.gapGroup)
		.as('main_query');

	return await db.select()
		.from(mainQuery)
		.orderBy(mainQuery.start)
		.limit(limit);
}

export async function lookupSubmissionVersions(
	index: number,
	form: string,
	includeArchived = false,
	fv?: string
) {
	const db = provideDb();

	const svt = alias(submissionVersions, 'sv');
	const fvt = alias(formVersions, 'fv');
	const fs = alias(formSubmissions, 'fs');

	// Base conditions
	const whereClauses: SQL<unknown>[] = [
		eq(svt.form, form),
		eq(svt.index, index)
	];

	// Join conditions by table
	const joinConditions = {
		fvt: [] as SQL<unknown>[],
		fs: [] as SQL<unknown>[]
	};
	const columnsToRemove = Array<keyof ReturnType<typeof getColumns<typeof svt>>>();

	// Form version selection logic
	if (fv) {
		// Specific form version requested
		whereClauses.push(eq(svt.formVersion, fv));
		columnsToRemove.push('formVersion');
	} else {
		// Default to current form version
		joinConditions.fvt.push(eq(fvt.isCurrent, true));
	}
	if (!includeArchived) {
		whereClauses.push(isNull(svt.archivedAt));
		joinConditions.fvt.push(isNull(fvt.archivedAt));
		joinConditions.fs.push(isNull(fs.archivedAt));
		columnsToRemove.push('archivedAt');
	}
	columnsToRemove.push('form');

	const columns = _.omit(getColumns(svt), columnsToRemove);

	const result = await db.select({
		...columns,
		next: sql<number>`LEAD(${svt.index}) OVER (ORDER BY ${desc(svt.recordedAt)})`.as('next'),
		prev: sql<number>`LAG(${svt.index}) OVER (ORDER BY ${desc(svt.recordedAt)})`.as('prev')
	})
		.from(svt)
		.innerJoin(fvt, and(
			eq(fvt.form, svt.form),
			eq(fvt.id, svt.formVersion),
			...joinConditions.fvt
		))
		.innerJoin(fs, and(
			eq(fs.index, svt.index),
			eq(fs.form, svt.form),
			...joinConditions.fs
		))
		.where(and(...whereClauses));

	return result;
}

export async function lookupFormSubmissions({
	limit,
	page,
	form,
	version,
	filter,
	includeArchived,
}: LookupFormSubmissionsRequest) {
	const db = provideDb();
	const fs = alias(formSubmissions, 'fs');
	const sv = alias(submissionVersions, 'sv');
	const f = alias(forms, 'f');

	const whereClauses = [
		eq(sql`${1}`, 1),
	];

	if (form) {
		whereClauses.push(eq(fs.form, form));
	}
	if (version) {
		whereClauses.push(eq(fs.formVersion, version));
	}
	if (!includeArchived) {
		whereClauses.push(isNull(fs.archivedAt));
	}

	const mainQuery = db
		.select({
			slug: fs.form,
			form: f.title,
			formVersion: fs.formVersion,
			index: fs.index,
			recordedAt: fs.recordedAt,
			versionCount: count(sv.tag).as('version_count'),
			lastUpdatedAt: max(sv.recordedAt).as('last_updated')
		}).from(fs)
		.leftJoin(
			sv,
			and(
				eq(sv.index, fs.index),
				eq(sv.form, fs.form)
			)
		).leftJoin(
			f,
			eq(fs.form, f.slug)
		).where(and(...whereClauses))
		.groupBy(
			f.title,
			fs.formVersion,
			fs.form,
			fs.index,
			sv.recordedAt
		).orderBy(
			desc(fs.recordedAt),
			desc(sv.recordedAt)
		).as('mainQuery');

	const result = await db.select()
		.from(mainQuery)
		.limit(limit)
		.offset(limit * page);
	const [{ totalRecords }] = await db.select({ totalRecords: count() })
		.from(fs)
		.leftJoin(sv, and(eq(sv.index, fs.index), eq(sv.form, fs.form)))
		.where(and(...whereClauses));
	return { data: result, totalRecords };
}

async function getCurrentSubmissionVersionTx(conn: Connection | Transaction, form: string, index: number, formVersion: string) {
	const result = await conn.query.submissionVersions.findFirst({
		columns: { tag: true },
		where: {
			isCurrent: true,
			formVersion,
			index
		},
		orderBy: {
			recordedAt: 'desc',
			approvedAt: 'desc',
		}
	});
	return result || null;
}

/**
 * Retrieves all submission responses for a specific submission and form version.
 *
 * @param form - The identifier of the form
 * @param submissionIndex - The index of the submission within the form
 * @param formVersion - Optional specific form version ID. If not provided, uses the current version
 * @param submissionVersion - Optional specific submission version ID. If not provided, uses the current version
 *
 * @returns A promise that resolves to an array of submission response objects
 *
 * @throws {NotFoundError} If the specified form version does not exist
 * @throws {NotFoundError} If the form has no current version or does not exist
 * @throws {Error} If the specified submission version does not exist
 * @throws {NotFoundError} If no submission version exists for the given submission index, or if the form, form version, or submission does not exist
 *
 * @example
 * const responses = await findSubmissionResponses('form-123', 0);
 * const responsesWithVersion = await findSubmissionResponses('form-123', 0, 'v1', 'v1-sub');
 */
export async function findSubmissionResponses(form: string, submissionIndex: number, formVersion?: string, submissionVersion?: string) {
	const db = provideDb();

	let formVersionId: string;
	if (formVersion) {
		const formVersionExists = await formVersionExistsTx(db, form, formVersion);
		if (!formVersionExists) throw new NotFoundError(`Version: "${formVersion}" does not exist for the form: "${form}"`);
		formVersionId = formVersion;
	} else {
		const currentFormVersionRef = await getCurrentFormVersionTx(db, form);
		if (!currentFormVersionRef) throw new NotFoundError(`The form: "${form}" has no version marked as "current" set, or the form does not exist`);
		formVersionId = currentFormVersionRef.id;
	}

	let submissionTag: string;
	if (submissionVersion) {
		const submissionVersionExists = await submissionVersionExistsTx(db, submissionVersion);
		if (!submissionVersionExists) throw new Error(`Version for submission: "${submissionIndex}" does not exist.`);
		submissionTag = submissionVersion;
	} else {
		const currentSubmissionVersionRef = await getCurrentSubmissionVersionTx(db, form, submissionIndex, formVersionId);
		if (!currentSubmissionVersionRef) throw new NotFoundError(`The form: "${form}" has no submission version under index: "${submissionIndex}" marked as "current", or either the form, form version or submission does not exist`);
		submissionTag = currentSubmissionVersionRef.tag;
	}

	const result = await db.query.submissionResponses.findMany({
		where: {
			submissionTag
		},
	});
	return result;
}

/**
 * Toggles the approval status of a form submission.
 *
 * @param request - The toggle approval status request parameters
 * @param request.form - The form identifier
 * @param request.index - The submission index
 * @param request.formVersion - Optional form version identifier. If not provided, the current form version will be used.
 * @param request.submissionVersion - Optional submission version identifier. If provided, only this specific submission version will be toggled.
 *
 * @returns A promise that resolves when the approval status has been toggled
 *
 * @throws {UnprocessibleError} When no current form version is found for the given form
 * @throws {NotFoundError} When the submission version or form version cannot be found
 *
 * @remarks
 * - If `submissionVersion` is provided, it toggles the approval status of that specific submission version
 * - If `submissionVersion` is not provided, it toggles the approval status of the current submission version for the given form and index
 * - The `approvedAt` timestamp is set to null when approval status is toggled to false, and set to the current time when toggled to true
 */
export async function toggleApprovalStatus({
	form,
	index,
	formVersion,
	submissionVersion
}: ToggleApprovalStatusRequest) {
	const db = provideDb();
	const result = await db.transaction(async tx => {
		if (submissionVersion) {
			return await tx.update(submissionVersions)
				.set({
					approvedAt: new Date()
				}).where(eq(submissionVersions.tag, submissionVersion))
				.execute();
		} else {
			let formVersionId: string;
			if (!formVersion) {
				const [result] = await tx.select({ id: formVersions.id }).from(formVersions)
					.where(
						and(
							eq(formVersions.isCurrent, true),
							eq(formVersions.form, form)
						)
					).orderBy(desc(formVersions.updatedAt))
					.limit(1);
				if (!result) throw new UnprocessibleError('There is no "current" marked form version for the form', {
					form,
					submission: index
				});
				formVersionId = result.id;
			} else {
				formVersionId = formVersion;
			}

			return await tx.update(submissionVersions)
				.set({
					approvedAt: new Date()
				}).where(and(
					eq(submissionVersions.index, index),
					eq(submissionVersions.isCurrent, true),
					eq(submissionVersions.formVersion, formVersionId)
				));
		}
	});
	if (!result.rowCount) throw new NotFoundError('Form version or submission version not found', {
		form,
		submission: index
	});
}

async function deleteCurrentSubmissionVersionTx(tx: Transaction, submissionIndex: number, formVersion: string) {
	Logger.debug(`Deleting current submission version`, {
		formVersion,
		submissionIndex
	});
	const responseSummary = {
		responsesDeleted: 0,
		versionsDeleted: 0
	};
	const target = await tx.query.submissionVersions.findFirst({
		where: {
			formVersion,
			isCurrent: true,
			index: submissionIndex
		}
	});
	if (!target) return responseSummary;
	responseSummary.responsesDeleted = await tx.$count(submissionResponses, eq(submissionResponses.submissionTag, target.tag))
	const result = await tx.delete(submissionVersions)
		.where(eq(submissionVersions.tag, target.tag))
		.execute();
	if (result.rowCount) {
		responseSummary.versionsDeleted = 1;
		Logger.debug(`Submission version deleted`, {
			formVersion,
			submissionIndex,
			submissionVersion: target.tag
		});
	} else {
		Logger.warn(`Submission version not deleted`);
	}
	return responseSummary;
}

async function deleteSubmissionVersionTx(tx: Transaction, submissionIndex: number, formVersion: string, submissionVersion: string) {
	Logger.debug(`Deleting submission version: ${submissionVersion}`, {
		formVersion,
		submissionIndex,
		submissionVersion
	});
	const summary = { responsesDeleted: 0, versionsDeleted: 0 };
	summary.responsesDeleted = await tx.$count(submissionResponses, eq(submissionResponses.submissionTag, submissionVersion));
	const result = await tx.delete(submissionVersions)
		.where(eq(submissionVersions.tag, submissionVersion))
		.execute();
	if (result.rowCount) {
		summary.versionsDeleted = 1;
		Logger.debug(`Submission version deleted`, {
			formVersion,
			submissionIndex,
			submissionVersion
		});
	} else {
		Logger.warn(`Submission version not deleted`);
	}
	return summary;
}

async function deleteSubmissionTx(tx: Transaction, submissionIndex: number, formVersion: string) {
	Logger.debug(`Deleting submission: ${submissionIndex}`, {
		formVersion,
		submissionIndex
	});
	const summary = { responsesDeleted: 0, versionsDeleted: 0 };
	summary.responsesDeleted = await tx.$count(submissionResponses, and(
		eq(submissionResponses.submissionIndex, submissionIndex),
		eq(submissionResponses.formVersion, formVersion)
	));
	summary.versionsDeleted = await tx.$count(submissionVersions, eq(submissionVersions.formVersion, formVersion));
	const result = await tx.delete(formSubmissions)
		.where(and(
			eq(formSubmissions.formVersion, formVersion),
			eq(formSubmissions.index, submissionIndex)
		));
	if (!result.rowCount) {
		Logger.warn(`No submissions deleted`);
	}
	return summary;
}

/**
 * Deletes a form submission or submission version from the database.
 *
 * @param {DeleteSubmissionRequest} options - The deletion request parameters
 * @param {string} options.form - The form identifier
 * @param {string} options.index - The submission index
 * @param {string} [options.formVersion] - Optional specific form version to target
 * @param {string} [options.submissionVersion] - Optional specific submission version to delete ('current' or version ID)
 *
 * @returns {Promise<{responsesDeleted: number, versionsDeleted: number}>} Summary of deleted records
 *
 * @throws {NotFoundError} When the form has no current version, specified version doesn't exist, or submission version is not found
 * @throws {UnprocessibleError} When submissionVersion is specified without formVersion
 *
 * @remarks
 * - If neither formVersion nor submissionVersion is provided, deletes the entire submission
 * - If only formVersion is provided, deletes submission for that specific form version
 * - If submissionVersion is provided, formVersion must also be specified
 * - If submissionVersion is 'current', deletes the current submission version
 * - Executes within a database transaction for consistency
 */
export async function deleteSubmission({
	form,
	index,
	formVersion,
	submissionVersion
}: DeleteSubmissionRequest) {
	const db = provideDb();
	const errorData = {
		form,
		submission: index,
		submissionVersion,
		formVersion
	};
	return await db.transaction(async tx => {
		let deletionSummary = {
			responsesDeleted: 0,
			versionsDeleted: 0
		}
		let formVersionId: string = '';
		if (!formVersion) {
			const fv = await tx.query.formVersions.findFirst({
				columns: { id: true },
				where: {
					isCurrent: true,
					form
				}
			});
			if (!fv) throw new NotFoundError(`The form: ${form} has no current version set`, errorData);
			formVersionId = fv.id;
		} else if (formVersion) {
			const formVersionExists = await formVersionExistsTx(tx, form, formVersion);
			if (!formVersionExists) throw new NotFoundError(`The form: ${form} has no such version: ${formVersion}`, errorData);
			formVersionId = formVersion;
		}

		if (submissionVersion) {
			if (!formVersion) throw new UnprocessibleError('formVersion must be specified when submission is');
			if (submissionVersion === 'current') {
				deletionSummary = await deleteCurrentSubmissionVersionTx(tx, index, formVersionId);
			} else {
				const submissionVersionExists = await submissionVersionExistsTx(tx, submissionVersion);
				if (!submissionVersionExists) throw new NotFoundError(`The submission version: ${submissionVersion} does not exist under the form: ${form}`);
				deletionSummary = await deleteSubmissionVersionTx(tx, index, formVersionId, submissionVersion);
			}
		} else if (formVersion) {
			deletionSummary = await deleteSubmissionTx(tx, index, formVersionId);
		}
		return deletionSummary;
	});
}

async function submissionVersionExistsTx(tx: Transaction | Connection, id: string) {
	const result = await tx.execute<{ exists: boolean }>(sql`
		SELECT EXISTS(SELECT 1
					  FROM ${submissionVersions}
					  WHERE ${eq(submissionVersions.tag, id)}) AS "exists"
	`);
	return result.rows[0]?.exists ?? false;
}

/**
 * Checks if a submission version exists in the database.
 * @param form - The form identifier
 * @param index - The submission index
 * @param version - The version hash to check
 * @returns A promise that resolves to an object with an `exists` boolean property
 */
export async function submissionVersionExists(
	form: string,
	index: number,
	version: string
) {
	const db = provideDb();
	const result = await db.execute<{ exists: boolean }>(sql`
		SELECT EXISTS(SELECT 1 FROM ${submissionVersions} WHERE ${and(
		eq(submissionVersions.index, index),
		eq(submissionVersions.tag, version),
		eq(submissionVersions.form, form)
	)}) AS "exists"
	`);
	return result.rows[0] ?? { exists: false };
}