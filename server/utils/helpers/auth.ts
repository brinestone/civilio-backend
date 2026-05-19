import { sql } from "drizzle-orm";
import { clearSession, deleteCookie, H3Event, HTTPError } from "nitro/h3";
import { useRuntimeConfig } from "nitro/runtime-config";
import { provideDb } from "../db";
import { devices } from "../db/schema";
import Logger from "../logger";

export function getDeviceId(event: H3Event) {
	return event.req.headers.get('authorization')!;
}
export async function requireAuth(event: H3Event) {
	Logger.verbose('Validating auth status...');
	const deviceId = event.req.headers.get('Authorization');
	if (!deviceId) {
		Logger.warn('Request has no authorization header')
		throw new HTTPError({ status: 401, statusMessage: 'Unauthorized' });
	}

	const db = provideDb();
	Logger.verbose('Verifying device...');
	const result = await db.execute<{ exists: boolean }>(sql`
		SELECT EXISTS(SELECT 1 FROM ${devices} WHERE ${devices.id} = ${deviceId})
		`);
	if (result.rows[0].exists) {
		Logger.info('Device is verified');
		return;
	}
	Logger.info('Registering new device');
	const ua = event.req.headers.get('user-agent')!;
	await db.transaction(tx => tx.insert(devices).values({
		id: deviceId,
		userAgent: ua
	}));
	Logger.info('Device registered successfully');
}

export async function doSignOut(event: H3Event) {
	const { sessionSecret, sessionName } = useRuntimeConfig();
	await clearSession(event, {
		password: sessionSecret
	});
	deleteCookie(event, sessionName);
	deleteCookie(event, 'h3');
}