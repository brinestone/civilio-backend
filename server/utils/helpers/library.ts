import { and, eq, getColumns } from "drizzle-orm";
import { formItems, libraryItems } from "../db/schema";
import { ConnectionLike } from "../types/types";
import { alias } from "drizzle-orm/pg-core";

export async function getLibraryItems(tx: ConnectionLike, owner: string) {
	const fi = alias(formItems, 'fi');
	const li = alias(libraryItems, 'li');
	const result = await tx.selectDistinctOn([fi.id], {
		...getColumns(fi),
	}).from(li)
		.innerJoin(fi, and(
			eq(fi.id, li.itemId)
		))
		.where(eq(li.owner, owner));
	return result;
}