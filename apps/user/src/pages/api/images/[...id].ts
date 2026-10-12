export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createCore } from "@harka/core";

export const GET: APIRoute = ({ params }) => {
	const core = createCore(env);
	return core.storage.streamImage(params.id as string);
};
