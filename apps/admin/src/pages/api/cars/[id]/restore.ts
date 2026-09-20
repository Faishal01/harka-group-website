import type { APIRoute } from "astro";
import { getDb } from "@harka/db";
import { cars as carsTable } from "@harka/db";
import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";

export const POST: APIRoute = async ({ params }) => {
	try {
		const id = params.id as string;
		const db = getDb(env);

		await db
			.update(carsTable)
			.set({
				deletedAt: null,
				archiveReason: null,
			})
			.where(eq(carsTable.id, id));

		return new Response(JSON.stringify({ success: true, redirect: "/cars" }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Failed to restore car";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
