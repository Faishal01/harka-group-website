import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@harka/db";
import { getDb } from "@harka/db";

export const createAuth = (env: Env) =>
	betterAuth({
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		session: {
			expiresIn: 60 * 60 * 24 * 30, // 30 days
			updateAge: 60 * 60 * 24 * 1, // update session expiry if active after 1 day
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60, // 5 minutes cache
			},
		},
		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
			},
		},
		database: drizzleAdapter(getDb(env), {
			provider: "sqlite",
			schema: schema,
		}),
	});
