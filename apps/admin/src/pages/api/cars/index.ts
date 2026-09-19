import type { APIRoute } from "astro";
import { getDb, cars as carsTable, generateCarId, type InsertCar } from "@harka/db";
import { env } from "cloudflare:workers";

export const POST: APIRoute = async ({ request }) => {
	try {
		const payload = (await request.json()) as any;

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

		const id = generateCarId();
		const now = new Date();

		const insertData: InsertCar = {
			id,
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
