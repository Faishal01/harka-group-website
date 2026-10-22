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
		message: "Kategori transaksi wajib dipilih",
	}),
	buyerName: z.string().min(1, "Nama pembeli wajib diisi"),
	phoneNumber: z.string().min(1, "Nomor telpon wajib diisi"),
	sellingPrice: z.number().min(0, "Harga jual harus berupa angka positif"),
	downPayment: z.number().nullable().optional(),
	remainingBalance: z.number().nullable().optional(),
	salesPerson: z.string().min(1, "Sales/Marketing wajib diisi"),
	status: z.enum(TRANSACTION_STATUSES, {
		message: "Status transaksi wajib dipilih",
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
 * Format number into compact Indonesian Rupiah format (e.g. "Rp 2,46 M", "Rp 425 Jt").
 */
export function formatCompactRp(amount: number | null | undefined): string {
	if (amount === null || amount === undefined || isNaN(amount) || amount === 0) return "Rp 0";
	const abs = Math.abs(amount);
	const sign = amount < 0 ? "-" : "";

	if (abs >= 1_000_000_000) {
		const val = abs / 1_000_000_000;
		const formatted = new Intl.NumberFormat("id-ID", {
			maximumFractionDigits: 2,
		}).format(val);
		return `${sign}Rp ${formatted} M`;
	}

	if (abs >= 1_000_000) {
		const val = abs / 1_000_000;
		const formatted = new Intl.NumberFormat("id-ID", {
			maximumFractionDigits: 1,
		}).format(val);
		return `${sign}Rp ${formatted} Jt`;
	}

	return formatRp(amount);
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
 * Calculates recommended selling price based on 112% of total modal (capital + service),
 * rounded to the nearest Rp 100,000.
 */
export function calculateTargetSellingPrice(
	capitalCost: number = 0,
	serviceExpense: number = 0,
): number {
	const totalCost = (capitalCost || 0) + (serviceExpense || 0);
	if (totalCost <= 0) return 0;
	return Math.round((totalCost * 1.12) / 100_000) * 100_000;
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

/**
 * Convert DD/MM/YY or DD/MM/YYYY string to YYYY-MM-DD for HTML <input type="date">.
 */
export function ddmmyyToIsoDate(dStr: string): string {
	if (!dStr) return "";
	const universal = parseDateUniversal(dStr);
	return universal ? universal.iso : "";
}

/**
 * Universal date parser that handles:
 * - YYYY-MM-DD (ISO)
 * - D/M/YY or DD/MM/YYYY (Spreadsheet format)
 * - Date string / timestamp
 * Returns normalized { year, month: 0..11, day, iso: YYYY-MM-DD } or null.
 */
export function parseDateUniversal(dStr?: string): {
	year: number;
	month: number;
	day: number;
	iso: string;
} | null {
	if (!dStr) return null;
	const trimmed = String(dStr).trim();
	if (!trimmed) return null;

	// Check YYYY-MM-DD
	if (/^\d{4}-\d{1,2}-\d{1,2}/.test(trimmed)) {
		const parts = trimmed.split(/[-T ]/);
		const year = parseInt(parts[0], 10);
		const month = parseInt(parts[1], 10);
		const day = parseInt(parts[2], 10);
		if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
			const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
			return { year, month: month - 1, day, iso };
		}
	}

	// Check D/M/YY or DD/MM/YYYY
	if (trimmed.includes("/")) {
		const parts = trimmed.split("/");
		if (parts.length === 3) {
			const day = parseInt(parts[0], 10);
			const month = parseInt(parts[1], 10);
			let year = parseInt(parts[2], 10);
			if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
			if (year < 100) year += 2000;
			const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
			return { year, month: month - 1, day, iso };
		}
	}

	// Try standard Date parse
	const parsed = new Date(trimmed);
	if (!isNaN(parsed.getTime())) {
		const year = parsed.getFullYear();
		const month = parsed.getMonth();
		const day = parsed.getDate();
		const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
		return { year, month, day, iso };
	}

	return null;
}

/**
 * Convert YYYY-MM-DD (from HTML <input type="date">) to DD/MM/YY string format.
 */
export function isoDateToDdmmyy(isoStr: string): string {
	if (!isoStr) return "";
	const parts = isoStr.split("-");
	if (parts.length === 3) {
		const year = parts[0].slice(-2);
		const month = parts[1].padStart(2, "0");
		const day = parts[2].padStart(2, "0");
		return `${day}/${month}/${year}`;
	}
	return "";
}

// -------------------------------------------------------------
// PENGELUARAN PER UNIT (Unit Reconditioning & Repair Expenses)
// -------------------------------------------------------------

export const EXPENDITURE_SHEET_NAME = "PENGELUARAN PER UNIT";
export const EXPENDITURE_HEADER_ROW_INDEX = 3;
export const EXPENDITURE_DATA_START_ROW_INDEX = 4;

export const EXPENDITURE_COLUMNS = [
	"No",
	"Deskripsi Mobil",
	"Plat Mobil",
	"Deskripsi Perbaikan",
	"Biaya",
	"Total",
] as const;

export const RepairItemSchema = z.object({
	id: z.string().min(1),
	description: z.string().min(1, "Deskripsi perbaikan wajib diisi"),
	cost: z.number().min(0, "Biaya perbaikan harus berupa angka positif"),
});

export const VehicleExpenditureSchema = z.object({
	id: z.string().min(1), // hashPlate(plateNumber)
	no: z.number().int().positive("No harus berupa angka positif"),
	carDescription: z.string().min(1, "Deskripsi mobil wajib diisi"),
	plateNumber: z.string().min(1, "Plat mobil wajib diisi"),
	repairs: z.array(RepairItemSchema).min(1, "Minimal harus ada 1 item perbaikan"),
	totalCost: z.number().min(0),
	isLunas: z.boolean().optional(),
});

export const VehicleExpenditureCreateSchema = z.object({
	carDescription: z.string().min(1, "Deskripsi mobil wajib diisi"),
	plateNumber: z.string().min(1, "Plat mobil wajib diisi"),
	repairs: z
		.array(
			z.object({
				description: z.string().min(1, "Deskripsi perbaikan wajib diisi"),
				cost: z.number().min(0, "Biaya perbaikan harus berupa angka positif"),
			}),
		)
		.min(1, "Minimal harus ada 1 item perbaikan"),
});

export const AddRepairInputSchema = z.object({
	vehiclePlateHash: z.string().min(1, "ID kendaraan wajib ada"),
	description: z.string().min(1, "Deskripsi perbaikan wajib diisi"),
	cost: z.number().min(0, "Biaya perbaikan harus berupa angka positif"),
});

export const UpdateVehicleDescriptionInputSchema = z.object({
	vehiclePlateHash: z.string().min(1, "ID kendaraan wajib ada"),
	carDescription: z.string().trim().min(1, "Deskripsi mobil wajib diisi"),
});

export type RepairItem = z.infer<typeof RepairItemSchema>;
export type VehicleExpenditureItem = z.infer<typeof VehicleExpenditureSchema>;
export type VehicleExpenditureCreateInput = z.infer<typeof VehicleExpenditureCreateSchema>;
export type AddRepairInput = z.infer<typeof AddRepairInputSchema>;
export type UpdateVehicleDescriptionInput = z.infer<typeof UpdateVehicleDescriptionInputSchema>;

// -------------------------------------------------------------
// STOK MOBIL (Master Car Inventory Database)
// -------------------------------------------------------------

export const STOCK_SHEET_NAME = "STOK MOBIL";
export const STOCK_HEADER_ROW_INDEX = 2;
export const STOCK_DATA_START_ROW_INDEX = 3;

export const STOCK_COLUMNS = [
	"No",
	"MEREK",
	"DESKRIPSI MOBIL",
	"Plat Mobil/ No Polisi",
	"Kelengkapan",
	"Kategori Transaksi",
	"Harga Jual",
	"Modal",
	"Pengeluaran Service",
	"Tanggal Terjual",
] as const;

export const STOCK_STATUS_OPTIONS = ["Ready", "Ter-DP", "Sold"] as const;
export type StockStatus = (typeof STOCK_STATUS_OPTIONS)[number];

export const DEFAULT_MAKES = [
	"TOYOTA",
	"DAIHATSU",
	"HONDA",
	"SUZUKI",
	"HYUNDAI",
	"MITSUBISHI",
	"NISSAN",
	"MAZDA",
	"WULING",
] as const;

export const DEFAULT_DOCUMENTS = [
	"BPKB",
	"STNK",
	"FAKTUR",
	"Kunci Serep",
	"Buku Service",
	"Buku Manual",
	"SPH",
	"Kuitansi Blangko",
] as const;

export const StockCarItemSchema = z.object({
	id: z.string().min(1), // hashPlate(plateNumber)
	no: z.number().int().positive("No harus berupa angka positif"),
	make: z.string().min(1, "Merek mobil wajib diisi"),
	carDescription: z.string().min(1, "Deskripsi mobil wajib diisi"),
	plateNumber: z.string().min(1, "Plat mobil wajib diisi"),
	documents: z.string().default(""), // comma-separated e.g. "BPKB,STNK,FAKTUR"
	status: z.enum(STOCK_STATUS_OPTIONS).default("Ready"),
	sellingPrice: z.number().min(0).default(0),
	capitalCost: z.number().min(0, "Modal beli harus berupa angka positif"),
	serviceExpense: z.number().min(0).default(0), // from Col I formula
	soldDate: z.string().optional(), // M/D/YY or YYYY-MM-DD
});

export const StockCarCreateSchema = z.object({
	make: z.string().trim().min(1, "Merek mobil wajib diisi"),
	carDescription: z.string().trim().min(1, "Deskripsi mobil wajib diisi"),
	plateNumber: z.string().trim().min(1, "Plat mobil wajib diisi"),
	documents: z.string().default(""),
	status: z.enum(STOCK_STATUS_OPTIONS).default("Ready"),
	sellingPrice: z.number().min(0).default(0),
	capitalCost: z.number().min(0, "Modal beli harus berupa angka positif"),
	soldDate: z.string().optional(),
});

export const StockCarUpdateSchema = z.object({
	id: z.string().min(1, "ID kendaraan wajib ada"),
	make: z.string().trim().min(1, "Merek mobil wajib diisi"),
	carDescription: z.string().trim().min(1, "Deskripsi mobil wajib diisi"),
	documents: z.string().default(""),
	status: z.enum(STOCK_STATUS_OPTIONS).default("Ready"),
	sellingPrice: z.number().min(0).default(0),
	capitalCost: z.number().min(0, "Modal beli harus berupa angka positif"),
	soldDate: z.string().optional(),
});

export type StockCarItem = z.infer<typeof StockCarItemSchema>;
export type StockCarCreateInput = z.infer<typeof StockCarCreateSchema>;
export type StockCarUpdateInput = z.infer<typeof StockCarUpdateSchema>;
