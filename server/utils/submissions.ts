import { and, desc, eq, sql } from "drizzle-orm";
import { DeleteSubmissionRequest, LookupFormSubmissionsRequest, ToggleApprovalStatusRequest } from "./dto";
import { provideDb } from "./db";
import { Connection, Transaction } from "./types";
import { submissionVersions, formVersions, submissionResponses, formSubmissions, deltaChanges } from "./db/schema";
import { NotFoundError, UnprocessibleError } from "./errors";
import { formVersionExistsTx, getCurrentFormVersionTx } from "./forms";
import Logger from "./logger";

export async function lookupFormSubmissions({ limit, page, form, fv, sort }: LookupFormSubmissionsRequest) {
	const db = provideDb();

	const _sort = sort ?? { recordedAt: 'desc' };

	return await db.query.formSubmissions.findMany({
		orderBy: _sort,
		offset: page * limit,
		limit,
		with: {
			versions: {
				columns: {
					index: false,
					formVersion: false,
					form: false
				}
			}
		},
		where: {
			form,
			formVersion: fv
		}
	});
}

async function getCurrentSubmissionVersionTx(conn: Connection | Transaction, form: string, index: number, formVersion: string) {
	const result = await conn.query.submissionVersions.findFirst({
		columns: { id: true },
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

	let submissionVersionId: string;
	if (submissionVersion) {
		const submissionVersionExists = await submissionVersionExistsTx(db, submissionVersion);
		if (!submissionVersionExists) throw new Error(`Version for submission: "${submissionIndex}" does not exist.`);
		submissionVersionId = submissionVersion;
	} else {
		const currentSubmissionVersionRef = await getCurrentSubmissionVersionTx(db, form, submissionIndex, formVersionId);
		if (!currentSubmissionVersionRef) throw new NotFoundError(`The form: "${form}" has no submission version under index: "${submissionIndex}" marked as "current", or either the form, form version or submission does not exist`);
		submissionVersionId = currentSubmissionVersionRef.id;
	}

	const result = await db.query.submissionResponses.findMany({
		where: {
			submissionVersionId
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
export async function toggleApprovalStatus({ form, index, formVersion, submissionVersion }: ToggleApprovalStatusRequest) {
	const db = provideDb();
	const result = await db.transaction(async tx => {
		if (submissionVersion) {
			return await tx.update(submissionVersions)
				.set({
					approvedAt: new Date()
				}).where(eq(submissionVersions.id, submissionVersion))
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
				if (!result) throw new UnprocessibleError('There is no "current" marked form version for the form', { form, submission: index });
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
	if (!result.rowCount) throw new NotFoundError('Form version or submission version not found', { form, submission: index });
}

async function deleteCurrentSubmissionVersionTx(tx: Transaction, submissionIndex: number, formVersion: string) {
	Logger.debug(`Deleting current submission version`, { formVersion, submissionIndex });
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
	responseSummary.responsesDeleted = await tx.$count(submissionResponses, eq(submissionResponses.submissionVersionId, target.id))
	const result = await tx.delete(submissionVersions)
		.where(eq(submissionVersions.id, target.id))
		.execute();
	if (result.rowCount) {
		responseSummary.versionsDeleted = 1;
		Logger.debug(`Submission version deleted`, { formVersion, submissionIndex, submissionVersion: target.id });
	} else {
		Logger.warn(`Submission version not deleted`);
	}
	return responseSummary;
}

async function deleteSubmissionVersionTx(tx: Transaction, submissionIndex: number, formVersion: string, submissionVersion: string) {
	Logger.debug(`Deleting submission version: ${submissionVersion}`, { formVersion, submissionIndex, submissionVersion });
	const summary = { responsesDeleted: 0, versionsDeleted: 0 };
	summary.responsesDeleted = await tx.$count(submissionResponses, eq(submissionResponses.submissionVersionId, submissionVersion));
	const result = await tx.delete(submissionVersions)
		.where(eq(submissionVersions.id, submissionVersion))
		.execute();
	if (result.rowCount) {
		summary.versionsDeleted = 1;
		Logger.debug(`Submission version deleted`, { formVersion, submissionIndex, submissionVersion });
	} else {
		Logger.warn(`Submission version not deleted`);
	}
	return summary;
}

async function deleteSubmissionTx(tx: Transaction, submissionIndex: number, formVersion: string) {
	Logger.debug(`Deleting submission: ${submissionIndex}`, { formVersion, submissionIndex });
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
export async function deleteSubmission({ form, index, formVersion, submissionVersion }: DeleteSubmissionRequest) {
	const db = provideDb();
	const errorData = { form, submission: index, submissionVersion, formVersion };
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
		SELECT EXISTS(SELECT 1 FROM ${submissionVersions} WHERE ${eq(submissionVersions.id, id)}) AS "exists"
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
		eq(deltaChanges.submissionIndex, index),
		eq(deltaChanges.hash, version),
		eq(deltaChanges.form, form)
	)}) AS "exists"
		`);
	return result.rows[0] ?? { exists: false };
}