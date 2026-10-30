export const prerender = false;

import type { APIRoute } from "astro";
import { createCore } from "@harka/core";
import { env } from "cloudflare:workers";

export const POST: APIRoute = async (context) => {
	const currentUser = context.locals.user;
	if (!currentUser) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const core = createCore(env);
	return core.respond(async () => {
		const body = (await context.request.json().catch(() => ({}))) as {
			orderedIds?: unknown;
		};
		const orderedIds = Array.isArray(body?.orderedIds) ? (body.orderedIds as string[]) : [];
		return await core.team.reorder(orderedIds);
	});
};
