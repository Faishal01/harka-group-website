export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
	getDb,
	tradeInSubmissions,
	generateId,
	type TradeInPhoto,
	type InsertTradeInSubmission,
	type TradeInSubmission,
} from "@harka/db";
import { notifyTradeInSubmission } from "~/utils/notifications";

export const POST: APIRoute = async ({ request }) => {
	try {
		const formData = await request.formData();

		// Customer info
		const customerName = (formData.get("customerName") || "").toString().trim();
		const customerPhone = (formData.get("customerPhone") || "").toString().trim();
		const customerCity = (formData.get("customerCity") || "").toString().trim();
		const customerEmail = (formData.get("customerEmail") || "").toString().trim() || null;

		if (!customerName || !customerPhone || !customerCity) {
			return new Response(
				JSON.stringify({ error: "Nama, Nomor WhatsApp, dan Kota wajib diisi." }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Vehicle specs
		const make = (formData.get("make") || "").toString().trim();
		const model = (formData.get("model") || "").toString().trim();
		const year = Number(formData.get("year"));
		const mileage = Number(formData.get("mileage"));
		const transmission = (formData.get("transmission") || "").toString().trim();
		const fuelType = (formData.get("fuelType") || "").toString().trim() || null;
		const sellingPrice = Number(formData.get("sellingPrice"));

		if (!make || !model || !year || !mileage || !transmission || !sellingPrice) {
			return new Response(
				JSON.stringify({ error: "Spesifikasi kendaraan dan estimasi harga wajib diisi lengkap." }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Administration checklist
		const bpkbStatus = (formData.get("bpkbStatus") || "on_hand").toString();
		const stnkStatus = (formData.get("stnkStatus") || "active").toString();
		const stnkTaxExpiry = (formData.get("stnkTaxExpiry") || "").toString().trim() || null;
		const hasFaktur = formData.get("hasFaktur") === "true";
		const hasServiceBook = formData.get("hasServiceBook") === "true";
		const hasSpareKey = formData.get("hasSpareKey") === "true";
		const adminNotes = (formData.get("adminNotes") || "").toString().trim() || null;

		// Condition & Certifications (Banjir 1st, Lakalantas 2nd)
		const isFloodFree =
			formData.get("isFloodFree") !== null
				? formData.get("isFloodFree") === "true"
				: formData.get("hasFloodDamage") !== null
					? formData.get("hasFloodDamage") !== "true"
					: false;
		const isAccidentFree =
			formData.get("isAccidentFree") !== null
				? formData.get("isAccidentFree") === "true"
				: formData.get("hasAccidentDamage") !== null
					? formData.get("hasAccidentDamage") !== "true"
					: false;
		const conditionNotes = (formData.get("conditionNotes") || "").toString().trim() || null;

		// Photos metadata
		const photoMetaRaw = (formData.get("photoMeta") || "").toString();
		let photoMeta: Array<{ slot: string; label: string; fieldName: string }> = [];
		try {
			photoMeta = JSON.parse(photoMetaRaw);
		} catch {
			return new Response(JSON.stringify({ error: "Format metadata foto tidak valid." }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (!Array.isArray(photoMeta) || photoMeta.length < 10) {
			return new Response(JSON.stringify({ error: "Minimal 10 foto kendaraan wajib diunggah." }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const id = generateId(12);
		const uploadedPhotos: TradeInPhoto[] = [];

		// Upload each photo to R2
		for (const item of photoMeta) {
			const file = formData.get(item.fieldName) as File | null;
			if (!file || file.size === 0) {
				return new Response(
					JSON.stringify({ error: `Foto untuk '${item.label}' tidak ditemukan atau kosong.` }),
					{ status: 400, headers: { "Content-Type": "application/json" } },
				);
			}

			const buffer = await file.arrayBuffer();
			const timestamp = Date.now();
			const r2Key = `trade-in/tradein-${id}-${item.slot}-${timestamp}.jpg`;

			await env.IMAGES_BUCKET.put(r2Key, buffer, {
				httpMetadata: { contentType: "image/jpeg" },
			});

			uploadedPhotos.push({
				slot: item.slot,
				label: item.label,
				url: `/api/images/${r2Key}`,
			});
		}

		const now = new Date();
		const record: InsertTradeInSubmission = {
			id,
			customerName,
			customerPhone,
			customerCity,
			customerEmail,
			make,
			model,
			year,
			mileage,
			transmission,
			fuelType,
			sellingPrice,
			bpkbStatus: bpkbStatus === "leasing" ? "leasing" : "on_hand",
			stnkStatus: stnkStatus === "expired" ? "expired" : "active",
			stnkTaxExpiry,
			hasFaktur,
			hasServiceBook,
			hasSpareKey,
			adminNotes,
			isFloodFree,
			isAccidentFree,
			conditionNotes,
			photos: uploadedPhotos,
			createdAt: now,
			updatedAt: now,
		};

		const db = getDb(env);
		await db.insert(tradeInSubmissions).values(record);

		// Trigger extensible notification hook
		try {
			await notifyTradeInSubmission(record as TradeInSubmission, env);
		} catch (notifyErr) {
			console.error("Failed to execute notification hook:", notifyErr);
		}

		return new Response(
			JSON.stringify({
				success: true,
				id,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (err: unknown) {
		console.error("Trade-in submission failed:", err);
		const message =
			err instanceof Error ? err.message : "Terjadi kesalahan internal saat memproses pengajuan.";
		return new Response(
			JSON.stringify({
				error: message,
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
