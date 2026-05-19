import { and, eq, gt, inArray } from "drizzle-orm";
import last from 'lodash/last';
import { docChanges, vwDocChanges } from "../db/schema";
import { ConnectionLike } from "../types/types";

export async function pushDocumentChanges(tx: ConnectionLike, changes: typeof docChanges.$inferInsert[]) {

	const ids = await tx.insert(docChanges).values(changes).returning({
		id: docChanges.id
	});

	const documents = await tx.select({
		collection: vwDocChanges.collection,
		data: vwDocChanges.data
	}).from(vwDocChanges)
		.where(inArray(vwDocChanges.id, ids.map(i => i.id)));

		
	return { documents };
}

export async function pullDocumentChanges(tx: ConnectionLike, collection: string, size: number, checkpoint?: Date | null) {
	const whereClauses = [
		eq(vwDocChanges.collection, collection)
	];

	if (checkpoint) {
		whereClauses.push(gt(vwDocChanges.recordedAt, checkpoint));
	}
	const documents = await tx.select({
		recordedAt: vwDocChanges.recordedAt,
		data: vwDocChanges.data
	}).from(vwDocChanges)
		.where(and(...whereClauses))
		.limit(size);
	const lastCheckpoint = last(documents)?.recordedAt;
	return { documents: documents.map(d => d.data), lastCheckpoint };
}