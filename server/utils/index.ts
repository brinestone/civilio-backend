import { createHash } from "node:crypto";

export function hashThese(...values: string[]) {
	const cipher = createHash('sha256');
	values.forEach(v => cipher.update(v));
	return cipher.digest('hex');
}