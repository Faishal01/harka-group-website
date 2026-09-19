import type { APIRoute } from "astro";
import { getDb, cars as carsTable } from "@harka/db";
import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";

export const PUT: APIRoute = async ({ request, params }) => {
	try {
		const payload = (await request.json()) as any;
		const id = params.id as string;
		const db = getDb(env as any);

		const {
			title,
			excerpt,
			videoTourUrl,
			make,
			model,
			price,
			year,
			mileage,
			bodyType = "SUV",
			fuelType = "Petrol",
			transmission = "Automatic",
			color = "",
			horsePower,
			engineSizeCC,
			ownershipStatus,
			isFloodFree = true,
			isAccidentFree = true,
			taxExpirationDate,
			seatingCapacity,
			plateNumber,
			gallery,
			hidden = false,
			featured = false,
		} = payload;

		if (!make || !model || !price || !year || mileage === undefined || mileage === "") {
			return new Response(
				JSON.stringify({ error: "Merek, Model, Harga, Tahun, dan Jarak Tempuh wajib diisi." }),
				{ status: 400 },
			);
		}

		let finalTitle = title;
		if (!finalTitle || finalTitle.trim() === "") {
			finalTitle = `${make} ${model} ${year}`;
		}

		// Cleanup orphaned images
		const oldCar = await db.query.cars.findFirst({ where: eq(carsTable.id, id) });
		const oldGallery = oldCar?.gallery || [];
		const newGallery = gallery || [];

		const newImageUrls = new Set(newGallery.map((g: any) => g.image));
		const orphanedImages = oldGallery.filter((g: any) => !newImageUrls.has(g.image));

		for (const img of orphanedImages) {
			const filename = img.image.split("/").pop();
			if (filename) {
				await (env as any).IMAGES_BUCKET.delete(filename).catch(console.error);
			}
		}

		const updateData = {
			title: finalTitle,
			excerpt: excerpt || null,
			videoTourUrl: videoTourUrl || null,
			make,
			model,
			price: Number(price),
			year: Number(year),
			mileage: Number(mileage),
			bodyType,
			fuelType,
			transmission,
			color: color || "-",
			horsePower: horsePower ? Number(horsePower) : null,
			engineSizeCC: engineSizeCC ? Number(engineSizeCC) : null,
			ownershipStatus: ownershipStatus || null,
			isFloodFree:
				payload.hasFloodDamage !== undefined ? !payload.hasFloodDamage : Boolean(isFloodFree),
			isAccidentFree:
				payload.hasAccidentDamage !== undefined
					? !payload.hasAccidentDamage
					: Boolean(isAccidentFree),
			taxExpirationDate: taxExpirationDate ? new Date(taxExpirationDate) : null,
			seatingCapacity: seatingCapacity ? Number(seatingCapacity) : null,
			plateNumber: plateNumber || null,
			gallery: gallery || null,
			hidden: Boolean(hidden),
			featured: Boolean(featured),
			updatedAt: new Date(),
		};

		await db.update(carsTable).set(updateData).where(eq(carsTable.id, id));

		return new Response(JSON.stringify({ success: true, redirect: "/cars" }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message || "Gagal memperbarui kendaraan" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

export const DELETE: APIRoute = async ({ request, params }) => {
	try {
		const id = params.id as string;
		const url = new URL(request.url);
		const reason = (url.searchParams.get("reason") as "sold" | "removed" | "delete") || "removed";
		const db = getDb(env as any);

		if (reason === "delete") {
			const car = await db.query.cars.findFirst({ where: eq(carsTable.id, id) });
			if (car?.gallery && car.gallery.length > 0) {
				for (const img of car.gallery) {
					const filename = img.image.split("/").pop();
					if (filename) {
						await (env as any).IMAGES_BUCKET.delete(filename).catch(console.error);
					}
				}
			}
			await db.delete(carsTable).where(eq(carsTable.id, id));
		} else {
			// Soft delete: update deletedAt timestamp and reason
			await db
				.update(carsTable)
				.set({
					deletedAt: new Date(),
					archiveReason: reason,
					updatedAt: new Date(),
				})
				.where(eq(carsTable.id, id));
		}

		return new Response(JSON.stringify({ success: true, redirect: "/cars" }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message || "Gagal menghapus kendaraan" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
