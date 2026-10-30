export const prerender = false;

import type { APIRoute } from "astro";
import { createCore } from "@harka/core";
import { env } from "cloudflare:workers";

export const PUT: APIRoute = async (context) => {
	const currentUser = context.locals.user;
	if (!currentUser) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const id = context.params.id;
	if (!id) {
		return new Response(JSON.stringify({ error: "Member ID required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const core = createCore(env);
	return core.respond(async () => {
		const formData = await context.request.formData();
		const name = formData.get("name")?.toString();
		const role =
			formData.get("role") !== null ? formData.get("role")?.toString()?.trim() || null : undefined;
		const phone =
			formData.get("phone") !== null
				? formData.get("phone")?.toString()?.trim() || null
				: undefined;
		const email =
			formData.get("email") !== null
				? formData.get("email")?.toString()?.trim() || null
				: undefined;
		const orderVal = formData.get("order");
		const order = orderVal !== null ? Number(orderVal) : undefined;
		const isActiveVal = formData.get("isActive");
		const isActive =
			isActiveVal !== null ? isActiveVal === "true" || isActiveVal === "1" : undefined;
		const removePhoto = formData.get("removePhoto") === "true";
		const photo = formData.get("photo") as File | null;

		const result = await core.team.update(
			id,
			{
				name,
				role,
				phone,
				email,
				order,
				isActive,
			},
			photo && photo.size > 0 ? photo : null,
			removePhoto,
		);

		return result;
	});
};

export const DELETE: APIRoute = async (context) => {
	const currentUser = context.locals.user;
	if (!currentUser) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const id = context.params.id;
	if (!id) {
		return new Response(JSON.stringify({ error: "Member ID required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const core = createCore(env);
	return core.respond(async () => {
		return await core.team.delete(id);
	});
};
