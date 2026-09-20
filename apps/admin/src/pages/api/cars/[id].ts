import type { APIRoute } from "astro";
import { z } from "astro/zod";
import {
	getDb,
	cars as carsTable,
	validatePlateNumber,
	formatPlateNumber,
	bodyTypes,
	fuelTypes,
	transmissions,
	ownershipStatuses,
} from "@harka/db";
import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";

const updateCarSchema = z.object({
	title: z.string().optional(),
	excerpt: z.string().optional().nullable(),
	relatedUrl: z.string().optional().nullable(),
	videoTourUrl: z.string().optional().nullable(),
	make: z.string().min(1, "Merek wajib diisi"),
	model: z.string().min(1, "Model wajib diisi"),
	price: z.coerce.number().min(0, "Harga wajib diisi"),
	year: z.coerce.number().min(1900, "Tahun tidak valid"),
	mileage: z.coerce.number().min(0, "Jarak tempuh wajib diisi"),
	bodyType: z.enum(bodyTypes).default("SUV"),
	fuelType: z.enum(fuelTypes).default("Petrol"),
	transmission: z.enum(transmissions).default("Automatic"),
	color: z.string().default(""),
	horsePower: z.coerce.number().optional().nullable(),
	engineSizeCC: z.coerce.number().optional().nullable(),
	ownershipStatus: z.enum(ownershipStatuses).optional().nullable(),
	isFloodFree: z.boolean().default(true),
	isAccidentFree: z.boolean().default(true),
	hasFloodDamage: z.boolean().optional(),
	hasAccidentDamage: z.boolean().optional(),
	taxExpirationDate: z.string().optional().nullable(),
	seatingCapacity: z.coerce.number().optional().nullable(),
	plateNumber: z.string().optional().nullable(),
	gallery: z
		.array(
			z.object({
				image: z.string(),
				alt: z.string().default(""),
			}),
		)
		.optional()
		.nullable(),
	hidden: z.boolean().default(false),
});

export const PUT: APIRoute = async ({ request, params }) => {
	try {
		const rawJson = await request.json();
		const result = updateCarSchema.safeParse(rawJson);

		if (!result.success) {
			const errorMsg = result.error.issues.map((i) => i.message).join(", ");
			return new Response(JSON.stringify({ error: errorMsg || "Data mobil tidak valid" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const id = params.id as string;
		const db = getDb(env);
		const payload = result.data;

		const {
			title,
			excerpt,
			relatedUrl,
			videoTourUrl,
			make,
			model,
			price,
			year,
			mileage,
			bodyType,
			fuelType,
			transmission,
			color,
			horsePower,
			engineSizeCC,
			ownershipStatus,
			isFloodFree,
			isAccidentFree,
			taxExpirationDate,
			seatingCapacity,
			plateNumber,
			gallery,
			hidden,
		} = payload;

		let formattedPlate: string | null = null;
		if (plateNumber && plateNumber.trim() !== "") {
			const trimmed = plateNumber.trim();
			if (!validatePlateNumber(trimmed)) {
				return new Response(
					JSON.stringify({
						error: "Format nomor polisi / plat nomor tidak valid (mis. B 1234 ABC).",
					}),
					{ status: 400, headers: { "Content-Type": "application/json" } },
				);
			}
			formattedPlate = formatPlateNumber(trimmed);
		}

		let finalTitle = title;
		if (!finalTitle || finalTitle.trim() === "") {
			finalTitle = `${make} ${model} ${year}`;
		}

		// Cleanup orphaned images
		const oldCar = await db.query.cars.findFirst({ where: eq(carsTable.id, id) });
		const oldGallery = oldCar?.gallery || [];
		const newGallery = gallery || [];

		const newImageUrls = new Set(newGallery.map((g) => g.image));
		const orphanedImages = oldGallery.filter((g) => !newImageUrls.has(g.image));

		for (const img of orphanedImages) {
			const filename = img.image.split("/").pop();
			if (filename) {
				await env.IMAGES_BUCKET.delete(filename).catch(console.error);
			}
		}

		const updateData = {
			title: finalTitle,
			excerpt: excerpt || null,
			relatedUrl: relatedUrl || videoTourUrl || null,
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
			plateNumber: formattedPlate,
			gallery: gallery || null,
			hidden: Boolean(hidden),
			updatedAt: new Date(),
		};

		await db.update(carsTable).set(updateData).where(eq(carsTable.id, id));

		return new Response(JSON.stringify({ success: true, redirect: "/cars" }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Gagal memperbarui kendaraan";
		return new Response(JSON.stringify({ error: message }), {
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
		const db = getDb(env);

		if (reason === "delete") {
			const car = await db.query.cars.findFirst({ where: eq(carsTable.id, id) });
			if (car?.gallery && car.gallery.length > 0) {
				for (const img of car.gallery) {
					const filename = img.image.split("/").pop();
					if (filename) {
						await env.IMAGES_BUCKET.delete(filename).catch(console.error);
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
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Gagal menghapus kendaraan";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
