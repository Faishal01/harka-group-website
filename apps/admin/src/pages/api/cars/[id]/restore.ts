import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createCore } from "@harka/core";

export const POST: APIRoute = ({ params }) => {
	const core = createCore(env);
	const id = params.id as string;

	return core.respond(
		async () => {
			await core.cars.restore(id);
			return { success: true, redirect: "/cars" };
		},
		{ eventName: "admin_restore_car_error" },
	);
};
