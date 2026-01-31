import { defineNitroConfig } from "nitropack/config";

const compatibilityDate = "2026-01-03"

// https://nitro.build/config
export default defineNitroConfig({
	imports: { autoImport: false },
	routeRules: {
		'/api/**': {
			cors: true,
			headers: {
				// Only specify these if 'cors: true' isn't sufficient for your environment
				'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PATCH,DELETE',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				'Access-Control-Allow-Origin': '*',

			}
		}
	},
	experimental: {
		asyncContext: true,
		openAPI: true,
		envExpansion: true,
		tasks: true,
	},
	scheduledTasks: {},
	compatibilityDate,
	srcDir: "server",
	runtimeConfig: {
		publicOrigin: 'http://localhost:3000',
		compatibilityDate,
		databaseUrl: '',
	},
	openAPI: {
		meta: {
			title: 'CivilIO API',
			version: '1.0'
		},
		route: '/_docs/openapi.json',
		ui: {
			scalar: {
				route: '/_docs/scalar',
				theme: 'deepSpace'
			}
		}
	}
});
