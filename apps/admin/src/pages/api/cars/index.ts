import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createCore } from "@harka/core";

export const POST: APIRoute = async ({ request }) => {
	const core = createCore(env);
	const rawJson = await request.json();

	return core.respond(
		async () => {
			const result = await core.cars.create(rawJson);
			return { success: true, id: result.id, redirect: "/cars" };
		},
		{ eventName: "admin_create_car_error" },
	);
};
