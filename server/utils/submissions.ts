import { and, eq, sql } from "drizzle-orm";
import _ from "lodash";

export async function toggleApprovalStatus({ form, index }: ToggleApprovalStatusRequest) {
	const db = provideDb();
	await db.transaction(tx => tx.execute(sql`
		UPDATE ${sql.identifier(form)}."data"
		SET _validation_status = CASE 
			WHEN _validation_status = 'validation_status_approved' THEN 'validation_status_not_approved'
			ELSE 'validation_status_approved'
		END
		WHERE _index = ${index}::INTEGER
		`));
}

export async function deleteSubmission({ form, index }: DeleteSubmissionRequest) {
	const db = provideDb();
	await db.transaction(async tx => {
		const result = await tx.execute<{ version: string }>(sql`
			SELECT revisions.get_record_current_version(${form}, ${index}::INTEGER) as VERSION
			`);
		const [{ version: currentVersion }] = result.rows;
		const newVersion = hashThese([Date.now()].join('|'));
		Logger.debug('new version = ' + newVersion);
		Logger.debug('parent version = ' + currentVersion);
		const _configs = {
			'session.working_version': newVersion,
			'session.actor': 'civilio',
			'session.notes': 'Deleted',
			'session.parent_version': currentVersion
		};
		for (const [k, v] of _.entries(_configs)) {
			await tx.execute(sql`SELECT set_config(${k},${v}, true)`);
		}

		await tx.execute(sql`
			DELETE FROM ${sql.identifier(form)}."data"
		`);
	})
}

export async function versionExists(req: SubmissionVersionExistsRequest) {
	const { form, index, version } = req;
	const db = provideDb();
	const result = await db.execute<{ exists: boolean }>(sql`
		SELECT EXISTS(SELECT 1 FROM ${deltaChanges} WHERE ${and(
		eq(deltaChanges.submissionIndex, index),
		eq(deltaChanges.hash, version),
		eq(deltaChanges.form, form)
	)}) AS "exists"
		`);
	return result.rows[0].exists;
}