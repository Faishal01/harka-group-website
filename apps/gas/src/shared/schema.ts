import { z } from "zod";

export const TRANSACTION_CATEGORIES = [
	"JUAL CASH LUNAS",
	"TERIMA DP PEMBELI",
	"TUKAR TAMBAH",
] as const;

export const TRANSACTION_STATUSES = ["LUNAS", "BELUM LUNAS"] as const;

export const PLATE_NUMBER_REGEX = /^([A-Za-z]{1,2})\s*([1-9][0-9]{0,3})\s*([A-Za-z]{0,3})$/;

/**
 * Normalize car plate: eliminate all whitespace and convert to uppercase.
 */
export function normalizePlate(plate: string): string {
	return (plate || "").replace(/\s+/g, "").toUpperCase();
}

/**
 * Deterministic 32-bit FNV-1a hash returning an 8-character hex identifier.
 */
export function hashPlate(plate: string): string {
	const clean = normalizePlate(plate);
	let hash = 0x811c9dc5;
	for (let i = 0; i < clean.length; i++) {
		hash ^= clean.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return (hash >>> 0).toString(16).padStart(8, "0");
}

export const TransactionSchema = z.object({
	id: z.string().optional(),
	no: z.number().int().positive("No harus berupa angka positif"),
	transactionDate: z
		.string()
		.min(1, "Tanggal transaksi wajib diisi")
		.regex(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/, "Format tanggal harus DD/MM/YY atau DD/MM/YYYY"),
	carDescription: z.string().min(1, "Deskripsi mobil wajib diisi"),
	plateNumber: z
		.string()
		.min(1, "Plat mobil wajib diisi")
		.regex(PLATE_NUMBER_REGEX, "Format plat nomor tidak valid (contoh: B 1234 CD)"),
	category: z.enum(TRANSACTION_CATEGORIES, {
		message: "Kategori transaksi tidak valid",
	}),
	buyerName: z.string().min(1, "Nama pembeli wajib diisi"),
	phoneNumber: z.string().min(1, "Nomor telpon wajib diisi"),
	sellingPrice: z.number().min(0, "Harga jual harus berupa angka positif"),
	downPayment: z.number().nullable().optional(),
	remainingBalance: z.number().nullable().optional(),
	salesPerson: z.string().min(1, "Sales/Marketing wajib diisi"),
	status: z.enum(TRANSACTION_STATUSES, {
		message: "Status transaksi tidak valid",
	}),
	notes: z.string().nullable().optional(),
});

export const TransactionCreateSchema = TransactionSchema.omit({ id: true, no: true });
export const TransactionUpdateSchema = TransactionSchema.extend({
	id: z.string().min(1, "ID transaksi wajib ada"),
});

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
export type TransactionItem = z.infer<typeof TransactionSchema>;
export type TransactionCreateInput = z.infer<typeof TransactionCreateSchema>;
export type TransactionUpdateInput = z.infer<typeof TransactionUpdateSchema>;

export const SHEET_NAME = "TRANSAKSI";
export const HEADER_ROW_INDEX = 3; // 1-based index (Row 3)
export const DATA_START_ROW_INDEX = 4; // 1-based index (Row 4)

export const SHEET_COLUMNS = [
	"No",
	"Tanggal Transaksi",
	"Deskripsi Mobil",
	"Plat mobil",
	"Kategori Transaksi",
	"Nama Pembeli",
	"Nomor Telpon",
	"Harga Jual",
	"DP/ Panjar",
	"sisa",
	"Sales/Marketing",
	"Status Transaksi",
	"Catatan",
] as const;

/**
 * Format number to Indonesian Rupiah currency format.
 */
export function formatRp(amount: number | null | undefined): string {
	if (amount === null || amount === undefined || isNaN(amount)) return "Rp 0";
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(amount);
}

/**
 * Parse any string, currency string ("Rp 150.000.000"), or raw number into a clean number.
 */
export function parseRp(val: unknown): number {
	if (typeof val === "number") return isNaN(val) ? 0 : val;
	if (!val || typeof val !== "string") return 0;
	// Remove Rp, dots, spaces, commas
	const clean = val.replace(/[^0-9-]/g, "");
	const parsed = parseInt(clean, 10);
	return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse date string into timestamp for sorting.
 */
export function parseDate(dStr: string): number {
	if (!dStr) return 0;
	const parts = dStr.split("/");
	if (parts.length === 3) {
		const day = parseInt(parts[0], 10);
		const month = parseInt(parts[1], 10) - 1;
		let year = parseInt(parts[2], 10);
		if (year < 100) year += 2000;
		return new Date(year, month, day).getTime();
	}
	return Date.parse(dStr) || 0;
}

/**
 * Format a Date to DD/MM/YY string format.
 */
export function formatDateToDDMMYY(date: Date = new Date()): string {
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = String(date.getFullYear()).slice(-2);
	return `${day}/${month}/${year}`;
}
