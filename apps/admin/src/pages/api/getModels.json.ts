export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createCore } from "@harka/core";

export const GET: APIRoute = ({ request }) => {
	const core = createCore(env);
	const url = new URL(request.url);
	const make = url.searchParams.get("make");

	if (!make) {
		return Response.json({ error: "Parameter pencarian tidak valid" }, { status: 400 });
	}

	return core.respond(() => core.cars.getDistinctModels(make, { adminView: true }), {
		eventName: "admin_get_models_error",
	});
};
