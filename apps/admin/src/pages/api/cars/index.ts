import type { APIRoute } from "astro";
import {
	getDb,
	cars as carsTable,
	generateCarId,
	type InsertCar,
	validatePlateNumber,
	formatPlateNumber,
} from "@harka/db";
import { env } from "cloudflare:workers";

export const POST: APIRoute = async ({ request }) => {
	try {
		const payload = (await request.json()) as any;

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
			bodyType = "SUV",
			fuelType = "Petrol",
			transmission = "Automatic",
			color = "",
			horsePower,
			engineSizeCC,
			ownershipStatus,
			isFloodFree = false,
			isAccidentFree = false,
			taxExpirationDate,
			seatingCapacity,
			plateNumber,
			gallery,
			hidden = false,
		} = payload;

		if (!make || !model || !price || !year || mileage === undefined || mileage === "") {
			return new Response(
				JSON.stringify({ error: "Merek, Model, Harga, Tahun, dan Jarak Tempuh wajib diisi." }),
				{ status: 400 },
			);
		}

		let formattedPlate: string | null = null;
		if (plateNumber && typeof plateNumber === "string" && plateNumber.trim() !== "") {
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

		const db = getDb(env as any);
		await db.insert(carsTable).values(insertData);

		return new Response(JSON.stringify({ success: true, id, redirect: "/cars" }), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message || "Gagal menambahkan kendaraan" }), {
			status: 500,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}
};
