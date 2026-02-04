import { defineTask } from "nitropack/runtime";
import { provideDb } from "~/utils/db";
import { seedDatabase } from "~/utils/db/seeding";

export default defineTask({
	meta: {
		name: 'db:seed',
		description: 'Run database data seeding'
	},
	run: async () => {
		const db = provideDb();
		seedDatabase(db);
		return { result: 'success' };
	}
})