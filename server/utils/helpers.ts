import { createHash } from "crypto";

export function pause(dur = 5000) {
	return new Promise((resolve) => {
		setTimeout(resolve, dur);
	})
}

/**
 * Hashes all the values passed in.
 * @param values Values to hash
 * @returns A sha256 hex digest the parameters provided.
 */
export function hashThese(...values: string[]) {
	const cipher = createHash('sha256');
	values.forEach(v => cipher.update(v));
	return cipher.digest('hex');
}

/**
 * Hashes all the values passed in.
 * @param values Values to hash
 * @returns An md5 hex digest the parameters provided.
 */
export function hashTheseMd5(...values: string[]) {
	const cipher = createHash('md5');
	values.forEach(v => cipher.update(v));
	return cipher.digest('hex');
}