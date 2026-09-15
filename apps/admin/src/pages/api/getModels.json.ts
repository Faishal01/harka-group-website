export const prerender = false;
import type { APIRoute } from "astro";
import { getDb, cars as carsTable } from "@harka/db";
import { and, eq, isNull } from "drizzle-orm";
import { env } from "cloudflare:workers";

export const GET: APIRoute = async ({ request }) => {
	const url = new URL(request.url);
	const make = url.searchParams.get("make");

	if (!make) {
		return new Response(JSON.stringify({ error: "Parameter pencarian tidak valid" }), {
			status: 400,
			headers: { "content-type": "application/json" },
		});
	}

	const db = getDb(env);
	const rows = (await db
		.selectDistinct({ model: carsTable.model })
		.from(carsTable)
		.where(and(eq(carsTable.make, make), isNull(carsTable.deletedAt)))) as { model: string }[];

	const allModelNames = rows.map((r) => r.model);

	return new Response(JSON.stringify(allModelNames), {
		status: 200,
		headers: { "content-type": "application/json" },
	});
};
