import { siteLang, unitSystem, siteCurrency } from "~/data/config";


/**
 * Formats a given mileage number into a localized string representation.
 *
 * @param mileage - The mileage number to be formatted.
 * @returns A string representing the formatted mileage.
 */
export function getMileage(mileage: number): string {
	return mileage.toLocaleString(siteLang, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});
}

/**
 * Returns the mileage unit based on the unit system.
 *
 * @returns {string} The mileage unit, either "mi" for imperial or "km" for metric.
 */
export function getMileageUnit(): string {
	return unitSystem === "imperial" ? "mi" : "km";
}

/**
 * Returns the label for mileage based on the unit system.
 *
 * @returns {string} The label, either "Mileage" for imperial or "Kilometerage" for metric.
 */
export function getMileageLabel(): string {
	return unitSystem === "imperial" ? "Mileage" : "Kilometerage";
}

/**
 * Formats a given price number into a localized currency string representation.
 *
 * @param price - The price number to be formatted.
 * @returns A string representing the formatted price.
 */
export function getPrice(price: number): string {
	return new Intl.NumberFormat(siteLang, {
		style: "currency",
		currency: siteCurrency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(price);
}

/**
 * Returns the currency symbol based on the site language and currency.
 *
 * @returns {string} The currency symbol.
 */
export function getCurrencySymbol(): string {
	const formatter = new Intl.NumberFormat(siteLang, {
		style: "currency",
		currency: siteCurrency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});
	const parts = formatter.formatToParts(0);
	const symbol = parts.find((part) => part.type === "currency")?.value;
	return symbol || "";
}

/**
 * Returns a set of unique makes and models from the given cars collection.
 *
 */
export async function getMakeModelSet(db: any) {
	const { cars } = await import("~/db/schema");
	const allCarsDb = await db.select().from(cars);
	const allCars = allCarsDb.filter(c => !c.misc?.hidden);

	const makesWithModels = allCars.reduce((acc: { [key: string]: Set<string> }, car: any) => {
		if (car.misc?.hidden) return acc;
		const make = car.general.make;
		const model = car.general.model;

		if (!acc[make]) {
			acc[make] = new Set();
		}
		acc[make].add(model);

		return acc;
	}, {});

	const result = Object.entries(makesWithModels).map(([make, models]) => ({
		make,
		models: Array.from(models as Set<string>),
	}));

	return result;
}
