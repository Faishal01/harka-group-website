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
	return (unitSystem as string) === "imperial" ? "mi" : "km";
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
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})
		.format(price)
		.replace(/^Rp(?! )/, "Rp ");
}

/**
 * Returns a set of unique makes and models from the given cars collection.
 */
export async function getMakeModelSet(db: any) {
	const { getMakeModelSet: getFromDb } = await import("@harka/db");
	return await getFromDb(db);
}
