import { H3Event } from "h3";

export async function doSignOut(event: H3Event) {
    const { sessionSecret, sessionName } = useRuntimeConfig(event);
    await clearSession(useEvent(), {
      password: sessionSecret
    });
    deleteCookie(event, sessionName);
    deleteCookie(event, 'h3');
}