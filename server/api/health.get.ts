import { defineCachedEventHandler } from "nitropack/runtime";

export default defineCachedEventHandler(event => {
	return { ok: true };
});