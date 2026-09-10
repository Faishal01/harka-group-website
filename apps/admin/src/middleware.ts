import { defineMiddleware } from "astro:middleware";
import { createAuth } from "~/lib/server/auth";
import { getDb } from "@harka/db";
import { eq } from "drizzle-orm";
import { adminWhitelist } from "@harka/db";
import { env } from "cloudflare:workers";

export const onRequest = defineMiddleware(async (context, next) => {
	const isAuthRoute =
		context.url.pathname.startsWith("/api/auth") ||
		context.url.pathname === "/login" ||
		context.url.pathname === "/unauthorized";

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

	if (!session || !session.user) {
		return context.redirect("/login");
	}

	// Verify against whitelist
	const db = getDb(env);
	const whitelistEntry = await db
		.select()
		.from(adminWhitelist)
		.where(eq(adminWhitelist.email, session.user.email))
		.get();

	if (!whitelistEntry) {
		return context.redirect("/unauthorized");
	}

	// Make session available in locals for Astro pages
	context.locals.user = session.user;
	context.locals.session = session.session;

	return next();
});
