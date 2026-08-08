import type { APIRoute } from "astro";
import { getDb } from "~/db/client";
import { cars as carsTable } from "~/db/schema";
import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";

export const PUT: APIRoute = async ({ request, params }) => {
  try {
    const formData = await request.formData();
    const id = params.id as string;

    const updateData: any = {};
    updateData.title = formData.get("title") as string;
    updateData.excerpt = formData.get("excerpt") as string;
    updateData.imageAlt = formData.get("imageAlt") as string;
    updateData.videoTourUrl = formData.get("videoTourUrl") as string;

    const imageFile = formData.get("imageFile") as File | null;
    if (imageFile && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const ext = imageFile.name.split(".").pop();
      const filename = `${id}-${Date.now()}.${ext}`;
      
      await (env as any).IMAGES_BUCKET.put(filename, arrayBuffer, {
        httpMetadata: { contentType: imageFile.type },
      });
      updateData.image = `/api/images/${filename}`;
    } else {
      updateData.image = formData.get("image") as string; // Keep existing image
    }

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
        updateData[field] = JSON.parse(val);
      } else {
        updateData[field] = null;
      }
    }

    const db = getDb(env as any);
    await db.update(carsTable).set(updateData).where(eq(carsTable.id, id));

    return new Response(JSON.stringify({ success: true, redirect: "/admin/cars" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Failed to update car" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    const id = params.id as string;
    const url = new URL(request.url);
    const reason = url.searchParams.get("reason") as "sold" | "removed" || "removed";
    const db = getDb(env as any);
    
    // Soft delete: update deletedAt timestamp and reason
    await db.update(carsTable).set({
      deletedAt: new Date(),
      archiveReason: reason
    }).where(eq(carsTable.id, id));

    return new Response(JSON.stringify({ success: true, redirect: "/admin/cars" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Failed to delete car" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
