import { defineMiddleware } from "astro:middleware";
import { createAuth } from "~/lib/server/auth";
import { getDb } from "@harka/db";
import { eq, sql } from "drizzle-orm";
import { adminWhitelist } from "@harka/db";
import { env } from "cloudflare:workers";

export const onRequest = defineMiddleware(async (context, next) => {
	const isAuthRoute =
		context.url.pathname.startsWith("/api/auth") ||
		context.url.pathname === "/login" ||
		context.url.pathname === "/unauthorized" ||
		context.url.pathname === "/privacy" ||
		context.url.pathname === "/terms";

	const isPublicAsset =
		context.url.pathname.startsWith("/_astro/") ||
		context.url.pathname.startsWith("/_image") ||
		context.url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|txt)$/i);

	if (isAuthRoute || isPublicAsset) {
		return next();
	}

	const auth = createAuth(env);

	// Get session using better-auth's server-side getSession
	const session = await auth.api.getSession({
		headers: context.request.headers,
	});

	const isApiRoute = context.url.pathname.startsWith("/api/");

	if (!session || !session.user) {
		if (isApiRoute) {
			return new Response(
				JSON.stringify({
					error: "Sesi login Anda telah berakhir. Silakan login kembali.",
					code: "SESSION_EXPIRED",
				}),
				{
					status: 401,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
		return context.redirect("/login");
	}

	// Verify against whitelist (case-insensitive)
	const db = getDb(env);
	const whitelistEntry = await db
		.select()
		.from(adminWhitelist)
		.where(eq(sql`lower(${adminWhitelist.email})`, session.user.email.toLowerCase()))
		.get();

	if (!whitelistEntry) {
		if (isApiRoute) {
			return new Response(
				JSON.stringify({
					error: "Akses ditolak: akun tidak terdaftar sebagai admin.",
					code: "UNAUTHORIZED",
				}),
				{
					status: 403,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
		return context.redirect("/unauthorized");
	}

	// Make session and role available in locals for Astro pages
	context.locals.user = session.user;
	context.locals.session = session.session;
	context.locals.userRole = whitelistEntry.role;

	return next();
});
