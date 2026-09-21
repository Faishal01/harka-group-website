import type { APIRoute } from "astro";
import { z } from "astro/zod";
import {
	getDb,
	cars as carsTable,
	generateCarId,
	type InsertCar,
	validatePlateNumber,
	formatPlateNumber,
	bodyTypes,
	fuelTypes,
	transmissions,
	ownershipStatuses,
	tradeInSubmissions,
} from "@harka/db";
import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";

const createCarSchema = z.object({
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
	isFloodFree: z.boolean().default(false),
	isAccidentFree: z.boolean().default(false),
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
	fromTradeIn: z.string().optional().nullable(),
});

export const POST: APIRoute = async ({ request }) => {
	try {
		const rawJson = await request.json();
		const result = createCarSchema.safeParse(rawJson);

		if (!result.success) {
			const errorMsg = result.error.issues.map((i) => i.message).join(", ");
			return new Response(JSON.stringify({ error: errorMsg || "Data mobil tidak valid" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

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
			fromTradeIn,
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

		const id = generateCarId();
		const now = new Date();

		const insertData: InsertCar = {
			id,
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
			publishDate: now,
			createdAt: now,
			updatedAt: now,
		};

		const db = getDb(env);
		await db.insert(carsTable).values(insertData);

		// If created from a trade-in submission, link convertedCarId
		if (fromTradeIn) {
			await db
				.update(tradeInSubmissions)
				.set({
					convertedCarId: id,
					updatedAt: now,
				})
				.where(eq(tradeInSubmissions.id, fromTradeIn));
		}

		return new Response(JSON.stringify({ success: true, id, redirect: "/cars" }), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Gagal menambahkan kendaraan";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}
};
