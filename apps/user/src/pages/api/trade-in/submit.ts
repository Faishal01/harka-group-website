export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
	getDb,
	tradeInSubmissions,
	generateId,
	ownershipStatuses,
	type OwnershipStatus,
	type TradeInPhoto,
	type TradeInDocument,
	type InsertTradeInSubmission,
	type TradeInSubmission,
	validatePlateNumber,
	formatPlateNumber,
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

		if (!make || !model || !year || !mileage || !transmission || !sellingPrice || year < 1950) {
			return new Response(
				JSON.stringify({
					error:
						"Spesifikasi kendaraan dan estimasi harga wajib diisi lengkap (tahun minimal 1950).",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Administration checklist
		const plateNumberRaw = (formData.get("plateNumber") || "").toString().trim();
		if (!plateNumberRaw || !validatePlateNumber(plateNumberRaw)) {
			return new Response(
				JSON.stringify({
					error:
						"Nomor Polisi / Plat Nomor wajib diisi dengan format yang valid (mis. B 1234 ABC).",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}
		const plateNumber = formatPlateNumber(plateNumberRaw);

		const rawOwnership = (
			formData.get("ownershipStatus") ||
			formData.get("bpkbStatus") ||
			"first_hand"
		).toString();
		const ownershipStatus: OwnershipStatus = ownershipStatuses.includes(
			rawOwnership as OwnershipStatus,
		)
			? (rawOwnership as OwnershipStatus)
			: rawOwnership === "leasing"
				? "leasing"
				: "first_hand";

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

		// Process Surat Pelepasan Hak (SPH) if vehicle is company-owned
		const uploadedDocs: TradeInDocument[] = [];
		if (ownershipStatus === "company_car") {
			const sphFile = formData.get("sphDocument") as File | null;
			if (!sphFile || sphFile.size === 0) {
				return new Response(
					JSON.stringify({
						error: "Surat Pelepasan Hak (SPH) wajib diunggah untuk mobil atas nama perusahaan.",
					}),
					{ status: 400, headers: { "Content-Type": "application/json" } },
				);
			}

			if (sphFile.size > 4 * 1024 * 1024) {
				return new Response(
					JSON.stringify({
						error: "Ukuran berkas SPH melebihi batas maksimal 4 MB.",
					}),
					{ status: 400, headers: { "Content-Type": "application/json" } },
				);
			}

			const origName = sphFile.name || "dokumen-sph.pdf";
			const ext = origName.split(".").pop()?.toLowerCase() || "";
			const allowedMimeTypes: Record<string, string> = {
				pdf: "application/pdf",
				doc: "application/msword",
				docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			};

			if (!allowedMimeTypes[ext]) {
				return new Response(
					JSON.stringify({
						error: "Format berkas SPH harus berupa PDF, DOC, atau DOCX.",
					}),
					{ status: 400, headers: { "Content-Type": "application/json" } },
				);
			}

			const contentType =
				sphFile.type && sphFile.type !== "application/octet-stream"
					? sphFile.type
					: allowedMimeTypes[ext];

			const sphBuffer = await sphFile.arrayBuffer();
			const timestamp = Date.now();
			const r2Key = `documents/tradein-${id}-sph-${timestamp}.${ext}`;

			await env.IMAGES_BUCKET.put(r2Key, sphBuffer, {
				httpMetadata: { contentType },
			});

			uploadedDocs.push({
				type: "sph",
				label: "Surat Pelepasan Hak (SPH)",
				url: `/api/images/${r2Key}`,
				filename: origName,
				size: sphFile.size,
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
			plateNumber,
			ownershipStatus,
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
			documents: uploadedDocs.length > 0 ? uploadedDocs : null,
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
