import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createCore } from "@harka/core";

const handleUpdateStatus: APIRoute = async ({ request, params, locals }) => {
	const core = createCore(env);
	const id = params.id as string;
	const rawJson = await request.json();
	const reviewer = locals.user?.email || locals.user?.name || "Admin";

	return core.respond(
		async () => {
			const result = await core.tradeIn.updateStatus(id, rawJson, reviewer);
			return result;
		},
		{ eventName: "admin_trade_in_status_error" },
	);
};

export const PATCH: APIRoute = handleUpdateStatus;
export const POST: APIRoute = handleUpdateStatus;
