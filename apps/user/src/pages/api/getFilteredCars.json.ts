export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createCore } from "@harka/core";

export const GET: APIRoute = async ({ request }) => {
	const core = createCore(env);
	const start = performance.now();
	const url = new URL(request.url);
	const searchParams = Object.fromEntries(url.searchParams.entries());

	const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
	const pageSize = Math.max(
		1,
		parseInt(searchParams.pageSize || searchParams.limit || "12", 10) || 12,
	);

	return core.respond(
		async () => {
			const allCars = await core.cars.getFiltered(searchParams, {
				adminView: false,
			});
			const afterSort = performance.now();
			const performanceResults = {
				"Total time": afterSort - start,
			};

			const total = allCars?.length ?? 0;
			const totalPages = Math.ceil(total / pageSize);
			const paginatedCars = allCars ? allCars.slice((page - 1) * pageSize, page * pageSize) : [];
			const hasMore = page < totalPages;

			return {
				performance: performanceResults,
				cars: paginatedCars,
				allCars: paginatedCars,
				pagination: {
					page,
					pageSize,
					total,
					totalPages,
					hasMore,
				},
			};
		},
		{ eventName: "filter_cars_error" },
	);
};
