export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createCore } from "@harka/core";

export const POST: APIRoute = async ({ request }) => {
	const core = createCore(env);
	const formData = await request.formData();
	const webhookUrl = (env as unknown as Record<string, unknown>)?.TRADE_IN_WEBHOOK_URL as
		string | undefined;

	return core.respond(
		async () => {
			const result = await core.tradeIn.submit(formData, webhookUrl);
			return { success: true, id: result.id };
		},
		{ eventName: "trade_in_submit_error" },
	);
};
