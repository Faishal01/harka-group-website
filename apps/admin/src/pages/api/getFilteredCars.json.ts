export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "astro/zod";
import { getDb, getFilteredCars, type CarFilterParams } from "@harka/db";
import { env } from "cloudflare:workers";

const searchParamsSchema = z.object({
	make: z.string().optional(),
	model: z.string().optional(),
	yearFrom: z
		.string()
		.regex(/^\d{4}$/)
		.optional(),
	yearTo: z
		.string()
		.regex(/^\d{4}$/)
		.optional(),
	price: z.string().optional(),
	mileageFrom: z.string().optional(),
	mileageTo: z.string().optional(),
	fuelType: z.string().optional(),
	bodyType: z.string().optional(),
	transmission: z.string().optional(),
	color: z.string().optional(),
	ownershipStatus: z.string().optional(),
	condition: z.string().optional(),
	sort: z
		.enum(["mileage-desc", "mileage-asc", "price-desc", "price-asc", "year-desc", "year-asc"])
		.optional(),
	search: z.string().optional(),
});

export const GET: APIRoute = async ({ request }) => {
	const start = performance.now();
	const url = new URL(request.url);
	const searchParams = Object.fromEntries(url.searchParams.entries());

	const result = searchParamsSchema.safeParse(searchParams);

	if (!result.success) {
		return new Response(JSON.stringify({ error: "Parameter pencarian tidak valid" }), {
			status: 400,
			headers: { "content-type": "application/json" },
		});
	}

	const db = getDb(env);
	const params: CarFilterParams = {
		...result.data,
		ownershipStatus: result.data.ownershipStatus || result.data.condition,
	};

	try {
		const allCars = await getFilteredCars(db, params, {
			adminView: true,
			includeHidden: true,
			includeDeleted: false,
		});

		const duration = performance.now() - start;

		if (!allCars || allCars.length === 0) {
			return new Response(JSON.stringify({ error: "Mobil tidak ditemukan", allCars: [] }), {
				status: 404,
				headers: { "content-type": "application/json" },
			});
		}

		return new Response(
			JSON.stringify({
				performance: { "Total time": duration },
				allCars,
			}),
			{
				status: 200,
				headers: { "content-type": "application/json" },
			},
		);
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Terjadi kesalahan";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "content-type": "application/json" },
		});
	}
};
