import { defineRouteMeta } from "nitro";
import { defineCachedHandler } from "nitro/cache";

defineRouteMeta({
	openAPI: {
		summary: 'Check health',
		description: 'Check the health status of the API. Can be used to check whether the server has been deployed correctly or not',
		tags: ['General'],
		responses: {
			'200': {
				headers: {
					'Cache-Control': {
						description: 'Cache settings for the CDN and browser.',
						schema: {
							type: 'string',
							default: 's-maxage=1, stale-while-revalidate'
						}
					}
				},
				description: 'API is reachable',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							additionalProperties: false,
							required: ['ok'],
							properties: {
								ok: { type: 'boolean', enum: [true] }
							}
						}
					}
				}
			}
		}
	}
})
export default defineCachedHandler(event => {
	return { ok: true };
});