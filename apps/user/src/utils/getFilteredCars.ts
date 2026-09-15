import { z } from "astro/zod";
import { getDb, getFilteredCars as getCarsFromDb, type CarFilterParams } from "@harka/db";
import type { Car } from "~/types";

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
	ownershipStatus: z.string().optional(),
	condition: z.string().optional(),
	sort: z
		.enum(["mileage-desc", "mileage-asc", "price-desc", "price-asc", "year-desc", "year-asc"])
		.optional(),
	search: z.string().optional(),
});

export const getFilteredCars = async (
	searchParams: Record<string, string>,
	env: any,
): Promise<Car[]> => {
	const result = searchParamsSchema.safeParse(searchParams);

	if (!result.success) {
		throw new Error("Invalid search parameters");
	}

	const db = getDb(env);
	const params: CarFilterParams = {
		...result.data,
		ownershipStatus: result.data.ownershipStatus || result.data.condition,
	};

	return await getCarsFromDb(db, params, { adminView: false });
};
