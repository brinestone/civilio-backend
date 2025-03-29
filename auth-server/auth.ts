import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI, username, admin } from "better-auth/plugins";
import { db } from "./db";

export const auth = betterAuth({
    session: {
        expiresIn: 60 * 60 * 60 * 24 * 30, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    database: drizzleAdapter(db, {
        provider: 'pg'
    }),
    appName: 'CivilIO',
    emailAndPassword: {
        enabled: true
    },
    plugins: [
        openAPI(),
        username(),
        admin(),
    ]
});