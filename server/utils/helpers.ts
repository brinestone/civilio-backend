import { createHash } from "crypto";

export function pause(dur = 5000) {
    return new Promise((resolve) => {
        setTimeout(resolve, dur);
})
}

export function hashThese(...values: string[]) {
	const cipher = createHash('sha256');
	values.forEach(v => cipher.update(v));
	return cipher.digest('hex');
}