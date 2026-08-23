import type { APIRoute } from "astro";
import { getDb } from "@harka/db";
import { cars as carsTable } from "@harka/db";
import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";

export const POST: APIRoute = async ({ params }) => {
	try {
		const id = params.id as string;
		const db = getDb(env as any);

		await db
			.update(carsTable)
			.set({
				deletedAt: null,
				archiveReason: null,
			})
			.where(eq(carsTable.id, id));

		return new Response(JSON.stringify({ success: true, redirect: "/admin/cars" }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message || "Failed to restore car" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
