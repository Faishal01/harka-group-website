export const prerender = false;

import type { APIRoute } from "astro";
import { createCore } from "@harka/core";
import { env } from "cloudflare:workers";

export const GET: APIRoute = async (context) => {
	const currentUser = context.locals.user;
	if (!currentUser) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const core = createCore(env);
	return core.respond(async () => {
		const members = await core.team.getMembers();
		return { members };
	});
};

export const POST: APIRoute = async (context) => {
	const currentUser = context.locals.user;
	if (!currentUser) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const core = createCore(env);
	return core.respond(async () => {
		const formData = await context.request.formData();
		const name = formData.get("name")?.toString()?.trim() || "";
		const role = formData.get("role")?.toString()?.trim() || null;
		const phone = formData.get("phone")?.toString()?.trim() || null;
		const email = formData.get("email")?.toString()?.trim() || null;
		const order = Number(formData.get("order")) || 0;
		const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "1";
		const photo = formData.get("photo") as File | null;

		const result = await core.team.create(
			{
				name,
				role,
				phone,
				email,
				order,
				isActive,
			},
			photo && photo.size > 0 ? photo : null,
		);

		return result;
	});
};
