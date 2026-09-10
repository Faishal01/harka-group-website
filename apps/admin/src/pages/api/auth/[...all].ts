import type { APIRoute } from "astro";
import { createAuth } from "~/lib/server/auth";
import { env } from "cloudflare:workers";

export const ALL: APIRoute = (ctx) => {
	const auth = createAuth(env);
	return auth.handler(ctx.request);
};
