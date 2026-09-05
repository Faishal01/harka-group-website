import { z } from "astro/zod";
import { getDb } from "@harka/db";
import { cars as carsTable } from "@harka/db";

import type { Car } from "~/types";
type CarData = Car["data"];
type CarFilter = (data: CarData) => boolean;

const searchParamsSchema = z.object({
	make: z.string().optional(),
	model: z.string().optional(),
	yearFrom: z
		.string()
		.regex(/^\d{4}$/)
		.optional(),
	yearTo: z
		.string()
		.regex(/^\d{4}$/)
		.optional(),
	price: z.string().optional(),
	mileageFrom: z.string().optional(),
	mileageTo: z.string().optional(),
	fuelType: z.string().optional(),
	bodyType: z.string().optional(),
	transmission: z.string().optional(),
	color: z.string().optional(),
	condition: z.string().optional(),
	sort: z
		.enum(["mileage-desc", "mileage-asc", "price-desc", "price-asc", "year-desc", "year-asc"])
		.optional(),
	search: z.string().optional(),
});

export const getFilteredCars = async (searchParams: Record<string, string>, env: any) => {
	const result = searchParamsSchema.safeParse(searchParams);

	if (!result.success) {
		throw new Error("Invalid search parameters");
	}

	const {
		make,
		model,
		yearFrom,
		yearTo,
		price,
		mileageFrom,
		mileageTo,
		fuelType,
		bodyType,
		transmission,
		color,
		condition,
		sort,
		search,
	} = result.data;

	const filters: CarFilter[] = [(data) => !data.misc?.hidden && data.archiveReason !== "removed"];

	// Make
	if (make && make !== "all") {
		filters.push((data) => data.general.make === make);
	}

	// Model
	if (model && model !== "all") {
		if (make !== "all") {
			filters.push((data) => data.general.model === model);
		} else {
			throw new Error("Please provide a make");
		}
	}

	// Year
	if (yearFrom) {
		filters.push((data) => data.history.year >= Number.parseInt(yearFrom));
	}

	if (yearTo) {
		filters.push((data) => data.history.year <= Number.parseInt(yearTo));
	}

	// Price
	if (price && price !== "all") {
		const [minPrice, maxPrice] = price.split("-").map(Number);

		filters.push((data) => {
			const regularPrice = data.general.price;

			if (maxPrice) {
				return regularPrice >= minPrice && regularPrice <= maxPrice;
			}

			return regularPrice >= minPrice;
		});
	}

	// Mileage
	if (mileageFrom) {
		filters.push((data) => data.history.mileage >= Number.parseInt(mileageFrom));
	}

	if (mileageTo) {
		filters.push((data) => data.history.mileage <= Number.parseInt(mileageTo));
	}

	// Fuel Type
	if (fuelType && fuelType !== "all") {
		filters.push((data) => data.efficiency.fuelType === fuelType);
	}

	// Body Type
	if (bodyType && bodyType !== "all") {
		filters.push((data) => data.general.bodyType === bodyType);
	}

	// Transmission
	if (transmission && transmission !== "all") {
		filters.push((data) => data.technical.transmission === transmission);
	}

	// Color
	if (color && color !== "all") {
		filters.push((data) => data.exterior.color === color);
	}

	// Condition
	if (condition && condition !== "all") {
		filters.push((data) => data.general.condition === condition);
	}

	// Search
	if (search) {
		const searchQueries = search
			.toLowerCase()
			.replace(/[^a-zA-Z0-9\s]/g, "")
			.split(" ");

		filters.push((data) => {
			const searchableFields = [
				data.general.make,
				data.general.model,
				data.general.bodyType,
				data.exterior.color,
				data.technical.transmission,
				data.history.year.toString(), // Cast year to string for search
				data.general.condition,
			];

			return searchQueries.every((query) =>
				searchableFields.some((field) => field?.toLowerCase().includes(query) ?? false),
			);
		});
	}

	const db = getDb(env);
	const dbCars = await db.select().from(carsTable);
	const mappedCars = dbCars.map((car) => ({ id: car.id, data: car }));

	const allCars = mappedCars.filter(({ data }) => {
		return filters.every((filter) => filter(data));
	});

	// Sort
	allCars.sort((a, b) => {
		// 1. Always push sold cars to the end
		const aIsSold = a.data.archiveReason === "sold";
		const bIsSold = b.data.archiveReason === "sold";
		if (aIsSold && !bIsSold) return 1;
		if (!aIsSold && bIsSold) return -1;

		// 2. Apply user sorting (if selected)
		if (sort) {
			const order = sort.endsWith("-asc") ? 1 : -1;
			let aValue: number = 0;
			let bValue: number = 0;

			switch (sort) {
				case "price-asc":
				case "price-desc":
					aValue = a.data.general.price;
					bValue = b.data.general.price;
					break;
				case "mileage-asc":
				case "mileage-desc":
					aValue = a.data.history.mileage;
					bValue = b.data.history.mileage;
					break;
				case "year-asc":
				case "year-desc":
					aValue = a.data.history.year;
					bValue = b.data.history.year;
					break;
			}

			if (aValue < bValue) return -1 * order;
			if (aValue > bValue) return 1 * order;
		}

		return 0;
	});

	return allCars;
};
