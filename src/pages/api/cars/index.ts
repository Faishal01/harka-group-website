import type { APIRoute } from "astro";
import { getDb } from "~/db/client";
import { cars as carsTable } from "~/db/schema";
import slugify from "slugify";
import { env } from "cloudflare:workers";

export const POST: APIRoute = async ({ request }) => {
	try {
		const formData = await request.formData();

		const title = formData.get("title") as string;
		if (!title)
			return new Response(JSON.stringify({ error: "Title is required" }), {
				status: 400,
			});

		const slug =
			slugify(title, { lower: true, strict: true }) + "-" + Math.floor(Math.random() * 1000);

		let imageUrl = null;
		const imageFile = formData.get("imageFile") as File | null;
		if (imageFile && imageFile.size > 0) {
			const arrayBuffer = await imageFile.arrayBuffer();
			const ext = imageFile.name.split(".").pop();
			const filename = `${slug}-${Date.now()}.${ext}`;

			await (env as any).IMAGES_BUCKET.put(filename, arrayBuffer, {
				httpMetadata: { contentType: imageFile.type },
			});
			imageUrl = `/api/images/${filename}`;
		}

		const insertData: any = {
			id: slug,
			title: title,
			image: imageUrl,
			imageAlt: (formData.get("imageAlt") as string) || null,
			videoTourUrl: (formData.get("videoTourUrl") as string) || null,
			excerpt: (formData.get("excerpt") as string) || null,
			publishDate: new Date(),
		};

		const jsonFields = [
			"gallery",
			"general",
			"history",
			"technical",
			"efficiency",
			"options",
			"security",
			"exterior",
			"interior",
			"misc",
		];

		for (const field of jsonFields) {
			const val = formData.get(field) as string;
			if (val && val.trim() !== "") {
				insertData[field] = JSON.parse(val);
			} else {
				insertData[field] = null;
			}
		}

		const db = getDb(env as any);
		await db.insert(carsTable).values(insertData);

		return new Response(JSON.stringify({ success: true, redirect: "/admin/cars" }), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message || "Failed to create car" }), {
			status: 500,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}
};
