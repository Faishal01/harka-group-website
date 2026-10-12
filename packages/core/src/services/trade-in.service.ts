import { Effect, Schema } from "effect";
import {
	tradeInSubmissions as tradeInTable,
	generateId,
	validatePlateNumber,
	formatPlateNumber,
	ownershipStatuses,
	getTradeInSubmissions as getTradeInSubmissionsFromDb,
	getTradeInSubmissionById as getTradeInSubmissionByIdFromDb,
	type OwnershipStatus,
	type InsertTradeInSubmission,
	type TradeInSubmission,
	type TradeInPhoto,
	type TradeInDocument,
	type TradeInQueryParams,
} from "@harka/db";
import { eq } from "drizzle-orm";
import { DatabaseClient } from "../clients/database";
import {
	DatabaseError,
	TradeInNotFoundError,
	ValidationError,
} from "../errors";
import {
	PhotoMetaArraySchema,
	UpdateTradeInStatusSchema,
} from "../schemas/trade-in";
import { uploadTradeInPhoto, uploadSPHDocument } from "./storage.service";
import { notifyTradeInSubmission } from "../notifications/trade-in";

export const submitTradeIn = (formData: FormData, webhookUrl?: string) =>
	Effect.gen(function* () {
		const customerName = (formData.get("customerName") || "").toString().trim();
		const customerPhone = (formData.get("customerPhone") || "").toString().trim();
		const customerCity = (formData.get("customerCity") || "").toString().trim();
		const customerEmail =
			(formData.get("customerEmail") || "").toString().trim() || null;

		if (!customerName || !customerPhone || !customerCity) {
			return yield* Effect.fail(
				new ValidationError({
					message: "Nama, Nomor WhatsApp, dan Kota wajib diisi.",
				}),
			);
		}

		const make = (formData.get("make") || "").toString().trim();
		const model = (formData.get("model") || "").toString().trim();
		const year = Number(formData.get("year"));
		const mileage = Number(formData.get("mileage"));
		const transmission = (formData.get("transmission") || "").toString().trim();
		const fuelType = (formData.get("fuelType") || "").toString().trim() || null;
		const sellingPrice = Number(formData.get("sellingPrice"));

		if (
			!make ||
			!model ||
			!year ||
			!mileage ||
			!transmission ||
			!sellingPrice ||
			year < 1950
		) {
			return yield* Effect.fail(
				new ValidationError({
					message:
						"Spesifikasi kendaraan dan estimasi harga wajib diisi lengkap (tahun minimal 1950).",
				}),
			);
		}

		const plateNumberRaw = (formData.get("plateNumber") || "").toString().trim();
		if (!plateNumberRaw || !validatePlateNumber(plateNumberRaw)) {
			return yield* Effect.fail(
				new ValidationError({
					message:
						"Nomor Polisi / Plat Nomor wajib diisi dengan format yang valid (mis. B 1234 ABC).",
				}),
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
		const stnkTaxExpiry =
			(formData.get("stnkTaxExpiry") || "").toString().trim() || null;
		const hasFaktur = formData.get("hasFaktur") === "true";
		const hasServiceBook = formData.get("hasServiceBook") === "true";
		const hasSpareKey = formData.get("hasSpareKey") === "true";
		const adminNotes =
			(formData.get("adminNotes") || "").toString().trim() || null;

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
		const conditionNotes =
			(formData.get("conditionNotes") || "").toString().trim() || null;

		const photoMetaRaw = (formData.get("photoMeta") || "").toString();
		let parsedMeta: unknown;
		try {
			parsedMeta = JSON.parse(photoMetaRaw);
		} catch {
			return yield* Effect.fail(
				new ValidationError({ message: "Format metadata foto tidak valid." }),
			);
		}

		const photoMeta = yield* Schema.decodeUnknown(PhotoMetaArraySchema)(
			parsedMeta,
		).pipe(
			Effect.mapError(
				(err) =>
					new ValidationError({
						message: "Format metadata foto tidak valid.",
						details: err,
					}),
			),
		);

		if (photoMeta.length < 10) {
			return yield* Effect.fail(
				new ValidationError({
					message: "Minimal 10 foto kendaraan wajib diunggah.",
				}),
			);
		}

		const id = generateId(12);
		const uploadedPhotos: TradeInPhoto[] = [];

		for (const item of photoMeta) {
			const file = formData.get(item.fieldName) as File | null;
			if (!file) {
				return yield* Effect.fail(
					new ValidationError({
						message: `Foto untuk '${item.label}' tidak ditemukan.`,
					}),
				);
			}

			const photo = yield* uploadTradeInPhoto(
				file,
				id,
				item.slot,
				item.label,
			);
			uploadedPhotos.push(photo);
		}

		const uploadedDocs: TradeInDocument[] = [];
		if (ownershipStatus === "company_car") {
			const sphFile = formData.get("sphDocument") as File | null;
			if (!sphFile) {
				return yield* Effect.fail(
					new ValidationError({
						message:
							"Surat Pelepasan Hak (SPH) wajib diunggah untuk mobil atas nama perusahaan.",
					}),
				);
			}

			const doc = yield* uploadSPHDocument(sphFile, id);
			uploadedDocs.push(doc);
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

		const db = yield* DatabaseClient;

		yield* Effect.tryPromise({
			try: () => db.insert(tradeInTable).values(record),
			catch: (cause) => new DatabaseError({ cause }),
		});

		yield* notifyTradeInSubmission(record as TradeInSubmission, webhookUrl);

		return { success: true, id };
	});

export const getTradeInSubmissions = (params?: TradeInQueryParams) =>
	Effect.gen(function* () {
		const db = yield* DatabaseClient;
		return yield* Effect.tryPromise({
			try: () => getTradeInSubmissionsFromDb(db, params),
			catch: (cause) => new DatabaseError({ cause }),
		});
	});

export const getTradeInById = (id: string) =>
	Effect.gen(function* () {
		if (!id) {
			return yield* Effect.fail(
				new ValidationError({ message: "ID pengajuan tidak ditemukan" }),
			);
		}

		const db = yield* DatabaseClient;
		const row = yield* Effect.tryPromise({
			try: () => getTradeInSubmissionByIdFromDb(db, id),
			catch: (cause) => new DatabaseError({ cause }),
		});

		if (!row) {
			return yield* Effect.fail(new TradeInNotFoundError({ id }));
		}

		return row;
	});

export const updateTradeInStatus = (
	id: string,
	rawInput: unknown,
	reviewer: string,
) =>
	Effect.gen(function* () {
		if (!id) {
			return yield* Effect.fail(
				new ValidationError({ message: "ID pengajuan tidak ditemukan" }),
			);
		}

		const input = yield* Schema.decodeUnknown(UpdateTradeInStatusSchema)(
			rawInput,
		).pipe(
			Effect.mapError(
				(err) =>
					new ValidationError({
						message: "Status tidak valid",
						details: err,
					}),
			),
		);

		const db = yield* DatabaseClient;
		const existing = yield* Effect.tryPromise({
			try: () =>
				db
					.select()
					.from(tradeInTable)
					.where(eq(tradeInTable.id, id))
					.get(),
			catch: (cause) => new DatabaseError({ cause }),
		});

		if (!existing) {
			return yield* Effect.fail(new TradeInNotFoundError({ id }));
		}

		const now = new Date();
		const reviewedAt = input.status === "pending" ? null : now;
		const reviewedBy = input.status === "pending" ? null : reviewer;

		yield* Effect.tryPromise({
			try: () =>
				db
					.update(tradeInTable)
					.set({
						status: input.status,
						reviewedAt,
						reviewedBy,
						updatedAt: now,
					})
					.where(eq(tradeInTable.id, id)),
			catch: (cause) => new DatabaseError({ cause }),
		});

		return {
			success: true,
			status: input.status,
			reviewedAt: reviewedAt ? reviewedAt.toISOString() : null,
			reviewedBy,
		};
	});
