import { siteLang, siteCurrency } from "~/data/config";

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
