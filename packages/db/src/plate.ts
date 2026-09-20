export interface ParsedPlate {
	isValid: boolean;
	prefix: string;
	number: number;
	suffix: string;
	formatted: string;
	masked: string;
}

/**
 * Generic Indonesian TNKB (Tanda Nomor Kendaraan Bermotor) regex pattern.
 * Format: [1-2 letters] [1-4 digits (1-9999)] [0-3 letters]
 * Examples: "B 1234 ABC", "DK 9999 ZZ", "B 1"
 */
export const TNKB_REGEX = /^([A-Za-z]{1,2})\s*([1-9][0-9]{0,3})\s*([A-Za-z]{0,3})$/;

/**
 * Parses raw input into Indonesian plate components.
 * Returns null if the input does not match the valid TNKB structure.
 */
export function parsePlateNumber(input: string | null | undefined): ParsedPlate | null {
	if (!input) return null;

	const clean = input.trim().toUpperCase().replace(/[-_.]/g, " ").replace(/\s+/g, " ");
	const match = clean.match(TNKB_REGEX);

	if (!match) {
		return null;
	}

	const prefix = match[1].toUpperCase();
	const num = parseInt(match[2], 10);
	const suffix = (match[3] || "").toUpperCase();

	const formatted = suffix ? `${prefix} ${num} ${suffix}` : `${prefix} ${num}`;

	// Masking: Keep prefix visible, mask each number and suffix letter with bullet (•)
	const maskedDigits = "•".repeat(match[2].length);
	const maskedSuffix = suffix ? "•".repeat(suffix.length) : "";
	const masked = maskedSuffix ? `${prefix} ${maskedDigits} ${maskedSuffix}` : `${prefix} ${maskedDigits}`;

	return {
		isValid: true,
		prefix,
		number: num,
		suffix,
		formatted,
		masked,
	};
}

/**
 * Checks if a string is a valid Indonesian plate number.
 */
export function validatePlateNumber(input: string | null | undefined): boolean {
	if (!input || typeof input !== "string") return false;
	return parsePlateNumber(input) !== null;
}

/**
 * Formats a raw plate number string into canonical uppercase format (e.g. "B 1234 ABC").
 * Returns null if input is invalid.
 */
export function formatPlateNumber(input: string | null | undefined): string | null {
	const parsed = parsePlateNumber(input);
	return parsed ? parsed.formatted : null;
}

/**
 * Masks a plate number on the server, leaving only the area code visible (e.g. "B •••• •••" or "DK ••••").
 * Returns null if input is empty or invalid.
 */
export function maskPlateNumber(input: string | null | undefined): string | null {
	const parsed = parsePlateNumber(input);
	return parsed ? parsed.masked : null;
}
