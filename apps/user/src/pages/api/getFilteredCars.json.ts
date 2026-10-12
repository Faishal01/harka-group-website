export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createCore } from "@harka/core";

export const GET: APIRoute = async ({ request }) => {
	const core = createCore(env);
	const start = performance.now();
	const url = new URL(request.url);
	const searchParams = Object.fromEntries(url.searchParams.entries());

	return core.respond(
		async () => {
			const allCars = await core.cars.getFiltered(searchParams, {
				adminView: false,
			});
			const afterSort = performance.now();
			const performanceResults = {
				"Total time": afterSort - start,
			};

			if (!allCars || allCars.length === 0) {
				return new Response(JSON.stringify({ error: "No cars found", allCars: [] }), {
					status: 404,
					headers: { "content-type": "application/json" },
				});
			}

			return {
				performance: performanceResults,
				allCars,
			};
		},
		{ eventName: "filter_cars_error" },
	);
};
