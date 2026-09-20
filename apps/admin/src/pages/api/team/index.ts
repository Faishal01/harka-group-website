import type { APIRoute } from "astro";
import { z } from "astro/zod";
import { getDb, adminWhitelist, user, session } from "@harka/db";
import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";

const addEmailSchema = z.object({
	email: z.string().trim().toLowerCase().pipe(z.string().email()),
});

const deleteEmailSchema = z.object({
	email: z.string().trim().toLowerCase().pipe(z.string().email()),
});

export const POST: APIRoute = async (context) => {
	const currentUser = context.locals.user;
	if (!currentUser || !currentUser.email) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const body = await context.request.json();
		const result = addEmailSchema.safeParse(body);

		if (!result.success) {
			const errorMsg =
				result.error.issues.map((i) => i.message).join(", ") || "Format email tidak valid";
			return new Response(JSON.stringify({ error: errorMsg }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const { email } = result.data;
		const db = getDb(env);

		// Check if already in whitelist
		const existing = await db
			.select()
			.from(adminWhitelist)
			.where(eq(adminWhitelist.email, email))
			.get();

		if (existing) {
			return new Response(
				JSON.stringify({ error: "Email sudah terdaftar dalam whitelist admin." }),
				{
					status: 409,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const newEntry = {
			email,
			role: "admin" as const,
			createdBy: currentUser.email,
			createdAt: new Date(),
		};

		await db.insert(adminWhitelist).values(newEntry);

		return new Response(
			JSON.stringify({
				success: true,
				entry: newEntry,
				message: `Admin ${email} berhasil ditambahkan.`,
			}),
			{
				status: 201,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Failed to add admin whitelist entry:", error);
		return new Response(JSON.stringify({ error: "Terjadi kesalahan internal pada server." }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

export const DELETE: APIRoute = async (context) => {
	const currentUser = context.locals.user;
	const currentUserRole = context.locals.userRole;
	if (!currentUser || !currentUser.email) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	if (currentUserRole !== "superadmin") {
		return new Response(
			JSON.stringify({ error: "Hanya akun superadmin yang berhak menghapus anggota admin." }),
			{
				status: 403,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	try {
		const body = await context.request.json();
		const result = deleteEmailSchema.safeParse(body);

		if (!result.success) {
			const errorMsg = result.error.issues.map((i) => i.message).join(", ") || "Data tidak valid";
			return new Response(JSON.stringify({ error: errorMsg }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const { email } = result.data;
		const db = getDb(env);

		// Check if target exists
		const targetEntry = await db
			.select()
			.from(adminWhitelist)
			.where(eq(adminWhitelist.email, email))
			.get();

		if (!targetEntry) {
			return new Response(
				JSON.stringify({ error: "Email tidak ditemukan dalam daftar whitelist." }),
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Guardrail 2: Superadmins cannot be deleted via UI
		if (targetEntry.role === "superadmin") {
			return new Response(
				JSON.stringify({
					error: "Akun superadmin tidak dapat dihapus melalui antarmuka.",
				}),
				{
					status: 403,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Delete from admin_whitelist
		await db.delete(adminWhitelist).where(eq(adminWhitelist.email, email));

		// Revoke active Better Auth sessions for this email if a user account exists
		const existingUser = await db.select().from(user).where(eq(user.email, email)).get();
		if (existingUser) {
			await db.delete(session).where(eq(session.userId, existingUser.id));
		}

		return new Response(
			JSON.stringify({
				success: true,
				message: `Admin ${email} berhasil dihapus dan sesi aktif telah dicabut.`,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Failed to delete admin whitelist entry:", error);
		return new Response(JSON.stringify({ error: "Terjadi kesalahan internal pada server." }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
