export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getFilteredCars } from "~/utils/getFilteredCars";

export const GET: APIRoute = async ({ request }) => {
	const start = performance.now();
	const url = new URL(request.url);
	const searchParams = Object.fromEntries(url.searchParams.entries());

	try {
		const allCars = await getFilteredCars(searchParams, env);

		const afterSort = performance.now();
		const performanceResults = {
			"Total time": afterSort - start,
		};

		if (!allCars || allCars.length === 0) {
			return new Response(JSON.stringify({ error: "No cars found" }), {
				status: 404,
				headers: { "content-type": "application/json" },
			});
		}

		return new Response(
			JSON.stringify({
				performance: performanceResults,
				allCars,
			}),
			{
				status: 200,
				headers: { "content-type": "application/json" },
			},
		);
	} catch (error: any) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 400,
			headers: { "content-type": "application/json" },
		});
	}
};
