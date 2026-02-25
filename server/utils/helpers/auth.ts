import { clearSession, deleteCookie, H3Event } from "h3";
import { useRuntimeConfig, useEvent } from "nitropack/runtime";

export async function doSignOut(event: H3Event) {
    const { sessionSecret, sessionName } = useRuntimeConfig(event);
    await clearSession(useEvent(), {
      password: sessionSecret
    });
    deleteCookie(event, sessionName);
    deleteCookie(event, 'h3');
}