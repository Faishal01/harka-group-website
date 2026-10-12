import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createCore } from "@harka/core";

export const PUT: APIRoute = async ({ request, params }) => {
	const core = createCore(env);
	const rawJson = await request.json();

	return core.respond(
		async () => {
			await core.cars.update(params.id as string, rawJson);
			return { success: true, redirect: "/cars" };
		},
		{ eventName: "admin_update_car_error" },
	);
};

export const DELETE: APIRoute = ({ request, params }) => {
	const core = createCore(env);
	const id = params.id as string;
	const url = new URL(request.url);
	const reason = (url.searchParams.get("reason") as "sold" | "removed" | "delete") || "removed";

	return core.respond(
		async () => {
			if (reason === "delete") {
				await core.cars.hardDelete(id);
			} else {
				await core.cars.softDelete(id, reason);
			}
			return { success: true, redirect: "/cars" };
		},
		{ eventName: "admin_delete_car_error" },
	);
};
