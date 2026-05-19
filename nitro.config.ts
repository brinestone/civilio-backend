import { defineConfig } from "nitro";

const compatibilityDate = "2026-19-05";
const uploadsBase = 'uploads';

// https://nitro.build/config
export default defineConfig({
	imports: { autoImport: false },
	publicAssets: [
		{ baseURL: uploadsBase, dir: 'public/uploads', maxAge: 60 * 60 * 24 * 7 }
	],
	devServer: {
		watch: ['server/assets/migrations', 'server/assets/seed', '.env']
	},
	routeRules: {
		'/api/**': {
			cors: true,
			headers: {
				// Only specify these if 'cors: true' isn't sufficient for your environment
				'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PATCH,DELETE,PUT',
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
	serverDir: "server",
	runtimeConfig: {
		uploadsBase: `/${uploadsBase}`,
		publicOrigin: 'http://localhost:3000',
		compatibilityDate,
		databaseUrl: '',
		refLinkStaleDuration: '7d'
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
			}
		}
	}
});
