import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createCore } from "@harka/core";

export const GET: APIRoute = async () => {
	const core = createCore(env);
	return core.respond(
		async () => {
			const promos = await core.promos.getAll();
			return { success: true, promos };
		},
		{ eventName: "admin_get_promos_error" },
	);
};

export const POST: APIRoute = async ({ request }) => {
	const core = createCore(env);
	const rawJson = await request.json();

	return core.respond(
		async () => {
			const result = await core.promos.create(rawJson);
			return { success: true, id: result.id, slug: result.slug, redirect: "/promos" };
		},
		{ eventName: "admin_create_promo_error", status: 201 },
	);
};

export const PUT: APIRoute = async ({ request }) => {
	const core = createCore(env);
	const rawJson = (await request.json()) as { orderedIds?: string[] };

	return core.respond(
		async () => {
			if (rawJson.orderedIds && Array.isArray(rawJson.orderedIds)) {
				await core.promos.reorder(rawJson.orderedIds);
				return { success: true, message: "Urutan promo berhasil diperbarui" };
			}
			return { success: false, error: "Daftar orderedIds wajib disertakan" };
		},
		{ eventName: "admin_reorder_promos_error" },
	);
};
