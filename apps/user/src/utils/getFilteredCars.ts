import { createCore } from "@harka/core";
import type { Car } from "~/types";

export const getFilteredCars = async (
	searchParams: Record<string, string>,
	env: Env,
): Promise<Car[]> => {
	const core = createCore(env);
	return (await core.cars.getFiltered(searchParams, {
		adminView: false,
	})) as Car[];
};
