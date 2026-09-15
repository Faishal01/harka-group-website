import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const POST: APIRoute = async ({ request }) => {
	try {
		const formData = await request.formData();
		const files = formData.getAll("file") as File[];

		if (!files || files.length === 0) {
			return new Response(JSON.stringify({ error: "No files uploaded" }), { status: 400 });
		}

		const urls = [];

		for (const file of files) {
			if (file.size > 0) {
				const arrayBuffer = await file.arrayBuffer();
				const ext = file.name.split(".").pop();
				const uniqueId = Math.random().toString(36).substring(2, 15);
				const filename = `gallery-${Date.now()}-${uniqueId}.${ext}`;

				await (env as any).IMAGES_BUCKET.put(filename, arrayBuffer, {
					httpMetadata: { contentType: file.type },
				});
				urls.push(`/api/images/${filename}`);
			}
		}

		return new Response(JSON.stringify({ success: true, urls }), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message || "Failed to upload images" }), {
			status: 500,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}
};
