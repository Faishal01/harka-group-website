import { Effect, Schema } from "effect";
import {
	promos as promosTable,
	generateId,
	getActivePromos as getActivePromosFromDb,
	getAllPromos as getAllPromosFromDb,
	getPromoById as getPromoByIdFromDb,
	getPromoBySlug as getPromoBySlugFromDb,
	getCarsByIds as getCarsByIdsFromDb,
	getFilteredCars as getFilteredCarsFromDb,
	type Promo,
	type InsertPromo,
	type Car,
	type PromoMode,
	type PromoFilterParams,
} from "@harka/db";
import { eq } from "drizzle-orm";
import { DatabaseClient } from "../clients/database";
import { DatabaseError, PromoNotFoundError, ValidationError } from "../errors";
import {
	CreatePromoInputSchema,
	UpdatePromoInputSchema,
	type CreatePromoInput,
	type UpdatePromoInput,
} from "../schemas/promo";

export function slugify(text: string): string {
	return text
		.toString()
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-")
		.replace(/&/g, "-and-")
		.replace(/[^\w\-]+/g, "")
		.replace(/\-\-+/g, "-")
		.replace(/^-+/, "")
		.replace(/-+$/, "");
}

export const getActivePromos = () =>
	Effect.gen(function* () {
		const db = yield* DatabaseClient;
		return yield* Effect.tryPromise({
			try: () => getActivePromosFromDb(db),
			catch: (cause) => new DatabaseError({ cause }),
		});
	});

export const getAllPromos = () =>
	Effect.gen(function* () {
		const db = yield* DatabaseClient;
		return yield* Effect.tryPromise({
			try: () => getAllPromosFromDb(db),
			catch: (cause) => new DatabaseError({ cause }),
		});
	});

export const getPromoById = (id: string) =>
	Effect.gen(function* () {
		const db = yield* DatabaseClient;
		const promo = yield* Effect.tryPromise({
			try: () => getPromoByIdFromDb(db, id),
			catch: (cause) => new DatabaseError({ cause }),
		});

		if (!promo) {
			return yield* Effect.fail(new PromoNotFoundError({ identifier: id }));
		}

		return promo;
	});

export const getPromoBySlug = (slug: string) =>
	Effect.gen(function* () {
		const db = yield* DatabaseClient;
		const promo = yield* Effect.tryPromise({
			try: () => getPromoBySlugFromDb(db, slug),
			catch: (cause) => new DatabaseError({ cause }),
		});

		if (!promo) {
			return yield* Effect.fail(new PromoNotFoundError({ identifier: slug }));
		}

		let cars: Car[] = [];
		if (promo.mode === "filter") {
			const filter = promo.filterParams || {};
			cars = yield* Effect.tryPromise({
				try: () =>
					getFilteredCarsFromDb(
						db,
						{
							make: filter.make || undefined,
							bodyType: filter.bodyType || undefined,
							transmission: filter.transmission || undefined,
							price: filter.maxPrice ? `0-${filter.maxPrice}` : undefined,
							yearFrom: filter.minYear || undefined,
							mileageTo: filter.maxMileage || undefined,
						},
						{ adminView: false },
					),
				catch: (cause) => new DatabaseError({ cause }),
			});
		} else if (promo.mode === "custom") {
			const ids = promo.customCarIds || [];
			cars = yield* Effect.tryPromise({
				try: () => getCarsByIdsFromDb(db, ids),
				catch: (cause) => new DatabaseError({ cause }),
			});
		}

		return { promo, cars };
	});

export const createPromo = (rawInput: unknown) =>
	Effect.gen(function* () {
		const input = yield* Effect.try({
			try: () => Schema.decodeUnknownSync(CreatePromoInputSchema)(rawInput),
			catch: (err) => new ValidationError({ message: "Data promo tidak valid", details: err }),
		});

		const db = yield* DatabaseClient;
		const id = generateId();

		let slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.title);
		if (!slug) {
			slug = `promo-${id.slice(0, 6)}`;
		}

		// Check for existing slug
		const existingWithSlug = yield* Effect.tryPromise({
			try: () => getPromoBySlugFromDb(db, slug),
			catch: (cause) => new DatabaseError({ cause }),
		});

		if (existingWithSlug) {
			slug = `${slug}-${id.slice(0, 4)}`;
		}

		const startDate = input.startDate ? new Date(input.startDate) : null;
		const endDate = input.endDate ? new Date(input.endDate) : null;
		const now = new Date();

		const promoRecord: InsertPromo = {
			id,
			slug,
			title: input.title,
			description: input.description || null,
			bannerImage: input.bannerImage,
			bannerOriginalImage: input.bannerOriginalImage || null,
			bannerCropData: (input.bannerCropData as any) || null,
			mode: (input.mode || "filter") as PromoMode,
			filterParams: input.mode === "filter" ? (input.filterParams as PromoFilterParams) || null : null,
			customCarIds:
				input.mode === "custom" && input.customCarIds ? [...input.customCarIds] : null,
			isActive: input.isActive ?? true,
			startDate,
			endDate,
			order: input.order ?? 0,
			createdAt: now,
			updatedAt: now,
		};

		yield* Effect.tryPromise({
			try: () => db.insert(promosTable).values(promoRecord),
			catch: (cause) => new DatabaseError({ cause }),
		});

		return {
			success: true,
			id,
			slug,
			title: input.title,
		};
	});

export const updatePromo = (id: string, rawInput: unknown) =>
	Effect.gen(function* () {
		const input = yield* Effect.try({
			try: () => Schema.decodeUnknownSync(UpdatePromoInputSchema)(rawInput),
			catch: (err) => new ValidationError({ message: "Data promo tidak valid", details: err }),
		});

		const db = yield* DatabaseClient;
		const existing = yield* Effect.tryPromise({
			try: () => getPromoByIdFromDb(db, id),
			catch: (cause) => new DatabaseError({ cause }),
		});

		if (!existing) {
			return yield* Effect.fail(new PromoNotFoundError({ identifier: id }));
		}

		let slug = existing.slug;
		if (input.slug && input.slug.trim() !== existing.slug) {
			slug = slugify(input.slug);
			const conflict = yield* Effect.tryPromise({
				try: () => getPromoBySlugFromDb(db, slug),
				catch: (cause) => new DatabaseError({ cause }),
			});
			if (conflict && conflict.id !== id) {
				slug = `${slug}-${id.slice(0, 4)}`;
			}
		}

		const mode = input.mode !== undefined ? input.mode : existing.mode;
		const filterParams =
			mode === "filter"
				? input.filterParams !== undefined
					? (input.filterParams as PromoFilterParams)
					: existing.filterParams
				: null;

		const customCarIds =
			mode === "custom"
				? input.customCarIds !== undefined
					? input.customCarIds
					: existing.customCarIds
				: null;

		const startDate =
			input.startDate !== undefined
				? input.startDate
					? new Date(input.startDate)
					: null
				: existing.startDate;

		const endDate =
			input.endDate !== undefined
				? input.endDate
					? new Date(input.endDate)
					: null
				: existing.endDate;

		const updatePayload = {
			title: input.title ?? existing.title,
			slug,
			description: input.description !== undefined ? input.description : existing.description,
			bannerImage: input.bannerImage ?? existing.bannerImage,
			bannerOriginalImage:
				input.bannerOriginalImage !== undefined
					? input.bannerOriginalImage
					: existing.bannerOriginalImage,
			bannerCropData:
				input.bannerCropData !== undefined
					? (input.bannerCropData as any)
					: existing.bannerCropData,
			mode,
			filterParams,
			customCarIds: (customCarIds ? [...customCarIds] : null) as string[] | null,
			isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
			startDate,
			endDate,
			order: input.order !== undefined ? input.order : existing.order,
			updatedAt: new Date(),
		};

		yield* Effect.tryPromise({
			try: () => db.update(promosTable).set(updatePayload).where(eq(promosTable.id, id)),
			catch: (cause) => new DatabaseError({ cause }),
		});

		return { success: true, id, slug };
	});

export const deletePromo = (id: string) =>
	Effect.gen(function* () {
		const db = yield* DatabaseClient;
		const existing = yield* Effect.tryPromise({
			try: () => getPromoByIdFromDb(db, id),
			catch: (cause) => new DatabaseError({ cause }),
		});

		if (!existing) {
			return yield* Effect.fail(new PromoNotFoundError({ identifier: id }));
		}

		yield* Effect.tryPromise({
			try: () => db.delete(promosTable).where(eq(promosTable.id, id)),
			catch: (cause) => new DatabaseError({ cause }),
		});

		return { success: true, id };
	});

export const reorderPromos = (orderedIds: string[]) =>
	Effect.gen(function* () {
		const db = yield* DatabaseClient;
		yield* Effect.tryPromise({
			try: async () => {
				for (let i = 0; i < orderedIds.length; i++) {
					await db
						.update(promosTable)
						.set({ order: i, updatedAt: new Date() })
						.where(eq(promosTable.id, orderedIds[i]));
				}
			},
			catch: (cause) => new DatabaseError({ cause }),
		});

		return { success: true };
	});
