import { and, eq, gte, isNull, like, lte, or, sql, desc, asc } from "drizzle-orm";
import { cars, type Car } from "./schema";

export interface CarFilterParams {
	make?: string;
	model?: string;
	yearFrom?: string | number;
	yearTo?: string | number;
	price?: string;
	mileageFrom?: string | number;
	mileageTo?: string | number;
	fuelType?: string;
	bodyType?: string;
	transmission?: string;
	color?: string;
	ownershipStatus?: string;
	search?: string;
	sort?: "price-asc" | "price-desc" | "mileage-asc" | "mileage-desc" | "year-asc" | "year-desc";
	page?: number;
	limit?: number;
}

export interface QueryOptions {
	includeHidden?: boolean;
	includeDeleted?: boolean;
	adminView?: boolean;
}

export async function getFilteredCars(
	db: any,
	params: CarFilterParams = {},
	options: QueryOptions = {},
): Promise<Car[]> {
	const conditions = [];

	if (!options.includeDeleted) {
		conditions.push(isNull(cars.deletedAt));
	}

	if (!options.includeHidden) {
		conditions.push(eq(cars.hidden, false));
	}

	if (!options.adminView) {
		// Public site excludes removed cars
		conditions.push(or(isNull(cars.archiveReason), sql`${cars.archiveReason} != 'removed'`));
	}

	if (params.make && params.make !== "all") {
		conditions.push(eq(cars.make, params.make));
	}

	if (params.model && params.model !== "all") {
		conditions.push(eq(cars.model, params.model));
	}

	if (params.yearFrom) {
		conditions.push(gte(cars.year, Number(params.yearFrom)));
	}

	if (params.yearTo) {
		conditions.push(lte(cars.year, Number(params.yearTo)));
	}

	if (params.price && params.price !== "all") {
		const parts = params.price.split("-");
		const minPrice = Number(parts[0]);
		const maxPrice = parts[1] ? Number(parts[1]) : undefined;

		if (!Number.isNaN(minPrice)) {
			conditions.push(gte(cars.price, minPrice));
		}
		if (maxPrice && !Number.isNaN(maxPrice)) {
			conditions.push(lte(cars.price, maxPrice));
		}
	}

	if (params.mileageFrom) {
		conditions.push(gte(cars.mileage, Number(params.mileageFrom)));
	}

	if (params.mileageTo) {
		conditions.push(lte(cars.mileage, Number(params.mileageTo)));
	}

	if (params.fuelType && params.fuelType !== "all") {
		conditions.push(eq(cars.fuelType, params.fuelType as any));
	}

	if (params.bodyType && params.bodyType !== "all") {
		conditions.push(eq(cars.bodyType, params.bodyType as any));
	}

	if (params.transmission && params.transmission !== "all") {
		conditions.push(eq(cars.transmission, params.transmission as any));
	}

	if (params.color && params.color !== "all") {
		conditions.push(eq(cars.color, params.color));
	}

	if (params.ownershipStatus && params.ownershipStatus !== "all") {
		conditions.push(eq(cars.ownershipStatus, params.ownershipStatus as any));
	}

	if (params.search) {
		const terms = params.search
			.toLowerCase()
			.replace(/[^a-zA-Z0-9\s]/g, "")
			.split(/\s+/)
			.filter(Boolean);

		for (const term of terms) {
			const pattern = `%${term}%`;
			conditions.push(
				or(
					like(cars.make, pattern),
					like(cars.model, pattern),
					like(cars.title, pattern),
					like(cars.bodyType, pattern),
					like(cars.color, pattern),
					like(cars.transmission, pattern),
					like(cars.fuelType, pattern),
					sql`CAST(${cars.year} AS TEXT) LIKE ${pattern}`,
				),
			);
		}
	}

	const orderClauses = [];

	if (!options.adminView) {
		// Sold cars always pushed to the bottom on public storefront
		orderClauses.push(sql`CASE WHEN ${cars.archiveReason} = 'sold' THEN 1 ELSE 0 END ASC`);
	}

	if (params.sort) {
		switch (params.sort) {
			case "price-asc":
				orderClauses.push(asc(cars.price));
				break;
			case "price-desc":
				orderClauses.push(desc(cars.price));
				break;
			case "mileage-asc":
				orderClauses.push(asc(cars.mileage));
				break;
			case "mileage-desc":
				orderClauses.push(desc(cars.mileage));
				break;
			case "year-asc":
				orderClauses.push(asc(cars.year));
				break;
			case "year-desc":
				orderClauses.push(desc(cars.year));
				break;
		}
	} else {
		orderClauses.push(desc(cars.publishDate));
	}

	const query = db
		.select()
		.from(cars)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(...orderClauses);

	return await query;
}

/**
 * Returns distinct makes and their respective models for filters.
 */
export async function getMakeModelSet(db: any): Promise<{ make: string; models: string[] }[]> {
	const rows = (await db
		.selectDistinct({ make: cars.make, model: cars.model })
		.from(cars)
		.where(and(isNull(cars.deletedAt), eq(cars.hidden, false)))
		.orderBy(asc(cars.make), asc(cars.model))) as { make: string; model: string }[];

	const map = new Map<string, Set<string>>();
	for (const { make, model } of rows) {
		if (!map.has(make)) {
			map.set(make, new Set());
		}
		map.get(make)!.add(model);
	}

	return Array.from(map.entries()).map(([make, models]) => ({
		make,
		models: Array.from(models),
	}));
}

/**
 * Returns all distinct colors currently in stock.
 */
export async function getDistinctColors(db: any): Promise<string[]> {
	const rows = (await db
		.selectDistinct({ color: cars.color })
		.from(cars)
		.where(and(isNull(cars.deletedAt), eq(cars.hidden, false)))
		.orderBy(asc(cars.color))) as { color: string }[];

	return rows.map((r) => r.color).filter(Boolean);
}
