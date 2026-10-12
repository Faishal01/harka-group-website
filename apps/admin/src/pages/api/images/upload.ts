import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createCore } from "@harka/core";

export const POST: APIRoute = async ({ request }) => {
	const core = createCore(env);
	const formData = await request.formData();
	const files = formData.getAll("file") as File[];

	return core.respond(
		async () => {
			const urls = await core.storage.uploadGalleryImages(files);
			return { success: true, urls };
		},
		{ eventName: "image_upload_error" },
	);
};
