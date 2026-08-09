import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";

export const onRequest = defineMiddleware(async (context, next) => {
	const { url, cookies } = context;

	if (url.pathname.startsWith("/admin")) {
		// Check for valid session cookie
		const authCookie = cookies.get("admin_session")?.value;
		const adminPassword = (env as any).AUTH_PASSWORD || "secret"; // default for local dev if not set

		if (authCookie !== adminPassword) {
			if (url.pathname === "/admin/login") {
				return next();
			}
			return context.redirect("/admin/login");
		}
	}

	return next();
});
