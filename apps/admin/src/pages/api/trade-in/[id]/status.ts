import type { APIRoute } from "astro";
import { z } from "astro/zod";
import { getDb, tradeInSubmissions, tradeInStatusEnum } from "@harka/db";
import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";

const updateStatusSchema = z.object({
	status: z.enum(tradeInStatusEnum),
});

const handleUpdateStatus: APIRoute = async ({ request, params, locals }) => {
	try {
		const { id } = params;
		if (!id) {
			return new Response(JSON.stringify({ error: "ID pengajuan tidak ditemukan" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const rawJson = await request.json();
		const result = updateStatusSchema.safeParse(rawJson);

		if (!result.success) {
			const errorMsg = result.error.issues.map((i) => i.message).join(", ");
			return new Response(JSON.stringify({ error: errorMsg || "Status tidak valid" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const { status } = result.data;
		const now = new Date();

		const db = getDb(env);

		// Check if record exists
		const existing = await db
			.select()
			.from(tradeInSubmissions)
			.where(eq(tradeInSubmissions.id, id))
			.get();

		if (!existing) {
			return new Response(JSON.stringify({ error: "Pengajuan tidak ditemukan" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const reviewer = locals.user?.email || locals.user?.name || "Admin";

		const reviewedAt = status === "pending" ? null : now;
		const reviewedBy = status === "pending" ? null : reviewer;

		await db
			.update(tradeInSubmissions)
			.set({
				status,
				reviewedAt,
				reviewedBy,
				updatedAt: now,
			})
			.where(eq(tradeInSubmissions.id, id));

		return new Response(
			JSON.stringify({
				success: true,
				status,
				reviewedAt: reviewedAt ? reviewedAt.toISOString() : null,
				reviewedBy,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Gagal memperbarui status pengajuan";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

export const PATCH: APIRoute = handleUpdateStatus;
export const POST: APIRoute = handleUpdateStatus;
