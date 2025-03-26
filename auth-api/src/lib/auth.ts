import { betterAuth } from "better-auth";
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, openAPI, username } from "better-auth/plugins";
import { db } from "../db";

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
        // jwt({
        //     jwks: {
        //         keyPairConfig: {
        //             alg: 'EdDSA',
        //             crv: 'Ed25519'
        //         }
        //     },
        //     jwt: {
        //         expirationTime: '7d',
        //         definePayload: ({ user }) => {
        //             return {
        //                 sub: user.id,
        //                 'claims.jwt.hasura.io': {
        //                     'x-hasura-allowed-roles': ['user', 'admin'],
        //                     'x-hasura-default-role': 'user',
        //                     'x-hasura-user-id': user.id,
        //                     'x-hasura-role': user.role
        //                 }
        //             }
        //         }
        //     }
        // })
    ]
});