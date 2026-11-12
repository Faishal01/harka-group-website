import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createCore } from "@harka/core";

export const GET: APIRoute = async ({ params }) => {
	const core = createCore(env);
	const id = params.id as string;

	return core.respond(
		async () => {
			const promo = await core.promos.getById(id);
			return { success: true, promo };
		},
		{ eventName: "admin_get_promo_detail_error" },
	);
};

export const PUT: APIRoute = async ({ request, params }) => {
	const core = createCore(env);
	const id = params.id as string;
	const rawJson = await request.json();

	return core.respond(
		async () => {
			const result = await core.promos.update(id, rawJson);
			return { success: true, id: result.id, slug: result.slug, redirect: "/promos" };
		},
		{ eventName: "admin_update_promo_error" },
	);
};

export const DELETE: APIRoute = async ({ params }) => {
	const core = createCore(env);
	const id = params.id as string;

	return core.respond(
		async () => {
			await core.promos.delete(id);
			return { success: true, redirect: "/promos" };
		},
		{ eventName: "admin_delete_promo_error" },
	);
};
