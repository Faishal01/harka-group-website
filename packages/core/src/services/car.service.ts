import { Effect, Option, Schema } from "effect";
import {
	cars as carsTable,
	tradeInSubmissions as tradeInTable,
	getFilteredCars as getFilteredCarsFromDb,
	generateCarId,
	validatePlateNumber,
	formatPlateNumber,
	type Car,
	type InsertCar,
	type CarFilterParams,
	type QueryOptions,
} from "@harka/db";
import { eq, and, isNull } from "drizzle-orm";
import { DatabaseClient } from "../clients/database";
import { R2Client } from "../clients/r2";
import {
	CarNotFoundError,
	DatabaseError,
	ValidationError,
} from "../errors";
import {
	CarFilterParamsSchema,
	CreateCarInputSchema,
	UpdateCarInputSchema,
} from "../schemas/car";

export const getFilteredCars = (
	rawParams: unknown,
	options: QueryOptions = {},
) =>
	Effect.gen(function* () {
		const decoded = yield* Schema.decodeUnknown(CarFilterParamsSchema)(
			rawParams,
		).pipe(
			Effect.mapError(
				(err) =>
					new ValidationError({
						message: "Invalid car search parameters",
						details: err,
					}),
			),
		);

		const db = yield* DatabaseClient;

		const filterParams: CarFilterParams = {
			...decoded,
			ownershipStatus: decoded.ownershipStatus || decoded.condition,
		};

		return yield* Effect.tryPromise({
			try: () => getFilteredCarsFromDb(db, filterParams, options),
			catch: (cause) => new DatabaseError({ cause }),
		});
	});

export const getCarById = (id: string, options: { adminView?: boolean } = {}) =>
	Effect.gen(function* () {
		if (!id) {
			return yield* Effect.fail(
				new ValidationError({ message: "Car ID is required" }),
			);
		}

		const db = yield* DatabaseClient;
		const row = yield* Effect.tryPromise({
			try: () =>
				db
					.select()
					.from(carsTable)
					.where(eq(carsTable.id, id))
					.get(),
			catch: (cause) => new DatabaseError({ cause }),
		});

		if (!row) {
			return yield* Effect.fail(new CarNotFoundError({ id }));
		}

		if (!options.adminView) {
			if (row.deletedAt || row.hidden || row.archiveReason === "removed") {
				return yield* Effect.fail(new CarNotFoundError({ id }));
			}
		}

		return row as Car;
	});

export const getDistinctModelsByMake = (make: string, adminView = false) =>
	Effect.gen(function* () {
		if (!make) {
			return yield* Effect.fail(
				new ValidationError({ message: "Make is required" }),
			);
		}

		const db = yield* DatabaseClient;
		const conditions = [eq(carsTable.make, make), isNull(carsTable.deletedAt)];

		if (!adminView) {
			conditions.push(eq(carsTable.hidden, false));
		}

		const rows = yield* Effect.tryPromise({
			try: () =>
				db
					.selectDistinct({ model: carsTable.model })
					.from(carsTable)
					.where(and(...conditions)),
			catch: (cause) => new DatabaseError({ cause }),
		});

		return (rows as { model: string }[]).map((r) => r.model).sort();
	});

export const createCar = (rawInput: unknown) =>
	Effect.gen(function* () {
		const input = yield* Schema.decodeUnknown(CreateCarInputSchema)(
			rawInput,
		).pipe(
			Effect.mapError(
				(err) =>
					new ValidationError({
						message: "Invalid car data",
						details: err,
					}),
			),
		);

		let formattedPlate: string | null = null;
		if (input.plateNumber) {
			if (!validatePlateNumber(input.plateNumber)) {
				return yield* Effect.fail(
					new ValidationError({
						message: "Format nomor polisi tidak valid (mis. B 1234 ABC).",
					}),
				);
			}
			formattedPlate = formatPlateNumber(input.plateNumber);
		}

		const id = generateCarId();
		const now = new Date();

		const title =
			input.title?.trim() || `${input.year} ${input.make} ${input.model}`;
		const isFloodFree =
			input.isFloodFree ??
			(input.hasFloodDamage !== undefined ? !input.hasFloodDamage : false);
		const isAccidentFree =
			input.isAccidentFree ??
			(input.hasAccidentDamage !== undefined
				? !input.hasAccidentDamage
				: false);

		const newCar: InsertCar = {
			id,
			title,
			excerpt: input.excerpt || null,
			relatedUrl: input.relatedUrl || input.videoTourUrl || null,
			make: input.make,
			model: input.model,
			price: input.price,
			year: input.year,
			mileage: input.mileage,
			bodyType: input.bodyType,
			fuelType: input.fuelType,
			transmission: input.transmission,
			color: input.color,
			horsePower: input.horsePower || null,
			engineSizeCC: input.engineSizeCC || null,
			ownershipStatus: input.ownershipStatus || null,
			isFloodFree,
			isAccidentFree,
			taxExpirationDate: input.taxExpirationDate
				? new Date(input.taxExpirationDate)
				: null,
			seatingCapacity: input.seatingCapacity || null,
			plateNumber: formattedPlate,
			gallery: input.gallery
				? input.gallery.map((g) => ({ image: g.image, alt: g.alt }))
				: null,
			hidden: input.hidden,
			publishDate: now,
			createdAt: now,
			updatedAt: now,
		};

		const db = yield* DatabaseClient;

		yield* Effect.tryPromise({
			try: () => db.insert(carsTable).values(newCar),
			catch: (cause) => new DatabaseError({ cause }),
		});

		if (input.fromTradeIn) {
			yield* Effect.tryPromise({
				try: () =>
					db
						.update(tradeInTable)
						.set({ convertedCarId: id, updatedAt: now })
						.where(eq(tradeInTable.id, input.fromTradeIn!)),
				catch: (cause) =>
					console.error("Failed to link convertedCarId:", cause),
			}).pipe(Effect.ignoreLogged);
		}

		return { success: true, id, title };
	});

export const updateCar = (id: string, rawInput: unknown) =>
	Effect.gen(function* () {
		if (!id) {
			return yield* Effect.fail(
				new ValidationError({ message: "Car ID is required" }),
			);
		}

		const input = yield* Schema.decodeUnknown(UpdateCarInputSchema)(
			rawInput,
		).pipe(
			Effect.mapError(
				(err) =>
					new ValidationError({
						message: "Invalid car data",
						details: err,
					}),
			),
		);

		const db = yield* DatabaseClient;
		const existing = yield* Effect.tryPromise({
			try: () =>
				db
					.select()
					.from(carsTable)
					.where(eq(carsTable.id, id))
					.get(),
			catch: (cause) => new DatabaseError({ cause }),
		});

		if (!existing) {
			return yield* Effect.fail(new CarNotFoundError({ id }));
		}

		// Cleanup orphaned images if gallery was updated
		const r2 = yield* R2Client;
		const oldGallery = (existing.gallery as { image: string }[] | null) || [];
		const newGallery = input.gallery || [];
		const newImageUrls = new Set(newGallery.map((g) => g.image));
		const orphanedImages = oldGallery.filter((g) => !newImageUrls.has(g.image));

		for (const img of orphanedImages) {
			const filename = img.image.split("/").pop();
			if (filename) {
				yield* r2.delete(filename).pipe(Effect.ignoreLogged);
			}
		}

		let formattedPlate: string | null = null;
		if (input.plateNumber) {
			if (!validatePlateNumber(input.plateNumber)) {
				return yield* Effect.fail(
					new ValidationError({
						message: "Format nomor polisi tidak valid (mis. B 1234 ABC).",
					}),
				);
			}
			formattedPlate = formatPlateNumber(input.plateNumber);
		}

		const title =
			input.title?.trim() || `${input.year} ${input.make} ${input.model}`;
		const isFloodFree =
			input.isFloodFree ??
			(input.hasFloodDamage !== undefined ? !input.hasFloodDamage : true);
		const isAccidentFree =
			input.isAccidentFree ??
			(input.hasAccidentDamage !== undefined
				? !input.hasAccidentDamage
				: true);

		const now = new Date();

		yield* Effect.tryPromise({
			try: () =>
				db
					.update(carsTable)
					.set({
						title,
						excerpt: input.excerpt || null,
						relatedUrl: input.relatedUrl || input.videoTourUrl || null,
						make: input.make,
						model: input.model,
						price: input.price,
						year: input.year,
						mileage: input.mileage,
						bodyType: input.bodyType,
						fuelType: input.fuelType,
						transmission: input.transmission,
						color: input.color,
						horsePower: input.horsePower || null,
						engineSizeCC: input.engineSizeCC || null,
						ownershipStatus: input.ownershipStatus || null,
						isFloodFree,
						isAccidentFree,
						taxExpirationDate: input.taxExpirationDate
							? new Date(input.taxExpirationDate)
							: null,
						seatingCapacity: input.seatingCapacity || null,
						plateNumber: formattedPlate,
						gallery: input.gallery
							? input.gallery.map((g) => ({ image: g.image, alt: g.alt }))
							: null,
						hidden: input.hidden,
						updatedAt: now,
					})
					.where(eq(carsTable.id, id)),
			catch: (cause) => new DatabaseError({ cause }),
		});

		return { success: true, id, title };
	});

export const softDeleteCar = (
	id: string,
	archiveReason: "sold" | "removed" = "removed",
) =>
	Effect.gen(function* () {
		if (!id) {
			return yield* Effect.fail(
				new ValidationError({ message: "Car ID is required" }),
			);
		}

		const db = yield* DatabaseClient;
		const now = new Date();

		yield* Effect.tryPromise({
			try: () =>
				db
					.update(carsTable)
					.set({
						deletedAt: now,
						archiveReason,
						updatedAt: now,
					})
					.where(eq(carsTable.id, id)),
			catch: (cause) => new DatabaseError({ cause }),
		});

		return { success: true, id };
	});

export const restoreCar = (id: string) =>
	Effect.gen(function* () {
		if (!id) {
			return yield* Effect.fail(
				new ValidationError({ message: "Car ID is required" }),
			);
		}

		const db = yield* DatabaseClient;
		const now = new Date();

		yield* Effect.tryPromise({
			try: () =>
				db
					.update(carsTable)
					.set({
						deletedAt: null,
						archiveReason: null,
						updatedAt: now,
					})
					.where(eq(carsTable.id, id)),
			catch: (cause) => new DatabaseError({ cause }),
		});

		return { success: true, id };
	});

export const hardDeleteCar = (id: string) =>
	Effect.gen(function* () {
		if (!id) {
			return yield* Effect.fail(
				new ValidationError({ message: "Car ID is required" }),
			);
		}

		const db = yield* DatabaseClient;
		const r2 = yield* R2Client;

		const car = yield* Effect.tryPromise({
			try: () =>
				db
					.select()
					.from(carsTable)
					.where(eq(carsTable.id, id))
					.get(),
			catch: (cause) => new DatabaseError({ cause }),
		});

		if (car?.gallery && Array.isArray(car.gallery)) {
			for (const img of car.gallery as { image: string }[]) {
				const filename = img.image.split("/").pop();
				if (filename) {
					yield* r2.delete(filename).pipe(Effect.ignoreLogged);
				}
			}
		}

		yield* Effect.tryPromise({
			try: () => db.delete(carsTable).where(eq(carsTable.id, id)),
			catch: (cause) => new DatabaseError({ cause }),
		});

		return { success: true, id };
	});

