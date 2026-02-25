import { createHash, getRandomValues } from "crypto";
import { ExecutionError } from "../types/errors";
import { createError } from "h3";

export function pause(dur = 5000) {
	return new Promise((resolve) => {
		setTimeout(resolve, dur);
	})
}

/**
 * Generates a random string of specified length using alphanumeric characters.
 * @param length - The length of the random string to generate. Defaults to 16.
 * @returns A random string containing lowercase letters, uppercase letters, and digits.
 * @example
 * const token = randomString(); // Returns a 16-character random string
 * const shortCode = randomString(8); // Returns an 8-character random string
 */
export function randomString(length = 16) {
	const charset = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	let result = '';
	const randomValues = new Uint8Array(length);
	getRandomValues(randomValues);

	for (let i = 0; i < length; i++) {
		result += charset[randomValues[i] % charset.length];
	}
	return result;
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

export function fromExecutionError<TError extends ExecutionError>(e: TError) {
	return createError({
		statusCode: toStatusCode(e.code),
		data: e.data,
		message: e.message,
		cause: e
	});
}

function toStatusCode(code: string): number | undefined {
	throw new Error("Function not implemented.");
}
