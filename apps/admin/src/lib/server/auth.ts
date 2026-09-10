import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@harka/db";
import { getDb } from "@harka/db";

export const createAuth = (env: any) =>
	betterAuth({
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
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
