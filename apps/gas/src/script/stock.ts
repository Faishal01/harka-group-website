import {
	hashPlate,
	normalizePlate,
	parseRp,
	STOCK_COLUMNS,
	STOCK_DATA_START_ROW_INDEX,
	STOCK_HEADER_ROW_INDEX,
	STOCK_SHEET_NAME,
	StockCarCreateInput,
	StockCarCreateSchema,
	StockCarItem,
	StockCarUpdateInput,
	StockCarUpdateSchema,
} from "../shared/schema";
import { findVehicleRowRange, getExpenditureSheet } from "./expenditure";
import { withDocumentLock } from "./lock";
import { getTransactionSheet, findRowByPlateHash } from "./transaction";

/**
 * Get or initialize the STOK MOBIL worksheet.
 * Headers are located at Row 2 (A2:J2).
 */
export function getStockSheet(): GoogleAppsScript.Spreadsheet.Sheet {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	let sheet = ss.getSheetByName(STOCK_SHEET_NAME);

	if (!sheet) {
		sheet = ss.insertSheet(STOCK_SHEET_NAME);
		const headers = [...STOCK_COLUMNS];
		const range = sheet.getRange(STOCK_HEADER_ROW_INDEX, 1, 1, headers.length);
		range.setValues([headers]);
		range.setFontWeight("bold");
		range.setBackground("#f1f5f9");
	} else {
		// Ensure headers exist at row 2
		const range = sheet.getRange(STOCK_HEADER_ROW_INDEX, 1, 1, STOCK_COLUMNS.length);
		const values = range.getValues()[0];
		if (!values[0]) {
			range.setValues([[...STOCK_COLUMNS]]);
			range.setFontWeight("bold");
			range.setBackground("#f1f5f9");
		}
	}

	return sheet;
}

/**
 * Locate the row index of a car in STOK MOBIL by its normalized plate hash.
 * Column D is "Plat Mobil/ No Polisi" (1-based index 4).
 */
export function findStockCarRowIndex(
	sheet: GoogleAppsScript.Spreadsheet.Sheet,
	targetPlateHash: string,
): number | null {
	const lastRow = sheet.getLastRow();
	if (lastRow < STOCK_DATA_START_ROW_INDEX) {
		return null;
	}

	const totalRows = lastRow - STOCK_DATA_START_ROW_INDEX + 1;
	const values = sheet.getRange(STOCK_DATA_START_ROW_INDEX, 4, totalRows, 1).getValues();

	for (let i = 0; i < values.length; i++) {
		const cellValue = String(values[i][0] || "").trim();
		if (cellValue && hashPlate(cellValue) === targetPlateHash) {
			return STOCK_DATA_START_ROW_INDEX + i;
		}
	}

	return null;
}

/**
 * Read all cars from STOK MOBIL.
 */
export function getStocks(): StockCarItem[] {
	const sheet = getStockSheet();
	const lastRow = sheet.getLastRow();

	if (lastRow < STOCK_DATA_START_ROW_INDEX) {
		return [];
	}

	const totalRows = lastRow - STOCK_DATA_START_ROW_INDEX + 1;
	// Read Columns A through J (10 columns)
	const values = sheet.getRange(STOCK_DATA_START_ROW_INDEX, 1, totalRows, 10).getValues();

	const items: StockCarItem[] = [];

	for (let i = 0; i < values.length; i++) {
		const row = values[i];
		const plateNumber = String(row[3] || "").trim();
		if (!plateNumber) continue;

		const no = Number(row[0]) || items.length + 1;
		const make = String(row[1] || "").trim();
		const carDescription = String(row[2] || "").trim();
		const documents = String(row[4] || "").trim();
		const rawStatus = String(row[5] || "").trim();
		const status = rawStatus === "Ter-DP" || rawStatus === "Sold" ? rawStatus : "Ready";
		const sellingPrice = parseRp(row[6]);
		const capitalCost = parseRp(row[7]);
		const serviceExpense = parseRp(row[8]);

		// Format date if present
		let soldDate: string | undefined = undefined;
		if (row[9]) {
			if (row[9] instanceof Date) {
				const y = row[9].getFullYear();
				const m = String(row[9].getMonth() + 1).padStart(2, "0");
				const d = String(row[9].getDate()).padStart(2, "0");
				soldDate = `${y}-${m}-${d}`;
			} else {
				soldDate = String(row[9]).trim() || undefined;
			}
		}

		items.push({
			id: hashPlate(plateNumber),
			no,
			make: make || "LAINNYA",
			carDescription,
			plateNumber,
			documents,
			status,
			sellingPrice,
			capitalCost,
			serviceExpense,
			soldDate,
		});
	}

	return items;
}

/**
 * Append a new car into STOK MOBIL.
 * Writes whole-column lookup formula to Column I.
 */
export function appendStockCar(input: StockCarCreateInput): StockCarItem {
	return withDocumentLock(() => {
		const validated = StockCarCreateSchema.parse(input);
		const sheet = getStockSheet();

		const cleanPlate = normalizePlate(validated.plateNumber);
		const targetPlateHash = hashPlate(cleanPlate);

		// Check for duplicate plate in STOK MOBIL
		const existingRow = findStockCarRowIndex(sheet, targetPlateHash);
		if (existingRow !== null) {
			throw new Error(`Mobil dengan plat "${cleanPlate}" sudah terdaftar di Stok Mobil.`);
		}

		const nextRow = Math.max(sheet.getLastRow() + 1, STOCK_DATA_START_ROW_INDEX);
		const lastRow = sheet.getLastRow();
		const count =
			lastRow >= STOCK_DATA_START_ROW_INDEX ? lastRow - STOCK_DATA_START_ROW_INDEX + 1 : 0;
		const nextNo = count + 1;

		const rowValues = [
			nextNo,
			validated.make.toUpperCase(),
			validated.carDescription,
			cleanPlate,
			validated.documents,
			validated.status,
			validated.sellingPrice,
			validated.capitalCost,
			"", // Col I: formula set below
			validated.soldDate || "",
		];

		sheet.getRange(nextRow, 1, 1, 10).setValues([rowValues]);

		// Whole-column formula that survives row additions & deletions in PENGELUARAN PER UNIT
		sheet
			.getRange(nextRow, 9)
			.setFormula(`=IFERROR(VLOOKUP(D${nextRow}, 'PENGELUARAN PER UNIT'!C:F, 4, FALSE), 0)`);

		// Formats
		sheet.getRange(nextRow, 7).setNumberFormat("Rp #,##0");
		sheet.getRange(nextRow, 8).setNumberFormat("Rp #,##0");
		sheet.getRange(nextRow, 9).setNumberFormat("Rp #,##0");
		if (validated.soldDate) {
			sheet.getRange(nextRow, 10).setNumberFormat("yyyy-mm-dd");
		}

		// Horizontal alignment
		sheet.getRange(nextRow, 1).setHorizontalAlignment("center");
		sheet.getRange(nextRow, 4).setHorizontalAlignment("center");
		sheet.getRange(nextRow, 6).setHorizontalAlignment("center");
		sheet.getRange(nextRow, 7, 1, 3).setHorizontalAlignment("right");
		sheet.getRange(nextRow, 10).setHorizontalAlignment("center");

		SpreadsheetApp.flush();

		return {
			id: targetPlateHash,
			no: nextNo,
			make: validated.make.toUpperCase(),
			carDescription: validated.carDescription,
			plateNumber: cleanPlate,
			documents: validated.documents,
			status: validated.status,
			sellingPrice: validated.sellingPrice,
			capitalCost: validated.capitalCost,
			serviceExpense: 0,
			soldDate: validated.soldDate,
		};
	});
}

/**
 * Update a car in STOK MOBIL.
 */
export function updateStockCar(input: StockCarUpdateInput): StockCarItem {
	return withDocumentLock(() => {
		const validated = StockCarUpdateSchema.parse(input);
		const sheet = getStockSheet();

		const targetRow = findStockCarRowIndex(sheet, validated.id);
		if (!targetRow) {
			throw new Error("Kendaraan tidak ditemukan di Stok Mobil.");
		}

		// Update Columns B, C, E, F, G, H, J
		sheet.getRange(targetRow, 2).setValue(validated.make.toUpperCase());
		sheet.getRange(targetRow, 3).setValue(validated.carDescription);
		sheet.getRange(targetRow, 5).setValue(validated.documents);
		sheet.getRange(targetRow, 6).setValue(validated.status);
		sheet.getRange(targetRow, 7).setValue(validated.sellingPrice);
		sheet.getRange(targetRow, 8).setValue(validated.capitalCost);
		sheet.getRange(targetRow, 10).setValue(validated.soldDate || "");

		// Re-ensure formula is intact in Column I
		sheet
			.getRange(targetRow, 9)
			.setFormula(`=IFERROR(VLOOKUP(D${targetRow}, 'PENGELUARAN PER UNIT'!C:F, 4, FALSE), 0)`);

		SpreadsheetApp.flush();

		const stocks = getStocks();
		const updated = stocks.find((s) => s.id === validated.id);
		if (!updated) {
			throw new Error("Gagal mengambil data mobil setelah diperbarui.");
		}

		return updated;
	});
}

/**
 * Delete a car from STOK MOBIL with referential integrity guard.
 */
export function deleteStockCar(plateHash: string): void {
	return withDocumentLock(() => {
		const stockSheet = getStockSheet();
		const targetRow = findStockCarRowIndex(stockSheet, plateHash);
		if (!targetRow) {
			throw new Error("Mobil tidak ditemukan di Stok Mobil.");
		}

		// Referential Guard 1: Check TRANSAKSI
		const trxSheet = getTransactionSheet();
		const trxRow = findRowByPlateHash(trxSheet, plateHash);
		if (trxRow !== -1) {
			throw new Error(
				"Tidak dapat menghapus mobil ini karena masih tercatat di sheet TRANSAKSI. Hapus transaksi terkait terlebih dahulu.",
			);
		}

		// Referential Guard 2: Check PENGELUARAN PER UNIT
		const expSheet = getExpenditureSheet();
		const expRange = findVehicleRowRange(expSheet, plateHash);
		if (expRange !== null) {
			throw new Error(
				"Tidak dapat menghapus mobil ini karena masih memiliki rincian di PENGELUARAN PER UNIT. Hapus pengeluaran unit terlebih dahulu.",
			);
		}

		stockSheet.deleteRow(targetRow);

		// Renumber Column A so sequence stays contiguous
		const lastRow = stockSheet.getLastRow();
		if (lastRow >= STOCK_DATA_START_ROW_INDEX) {
			const count = lastRow - STOCK_DATA_START_ROW_INDEX + 1;
			const numbers: number[][] = [];
			for (let i = 1; i <= count; i++) {
				numbers.push([i]);
			}
			stockSheet.getRange(STOCK_DATA_START_ROW_INDEX, 1, count, 1).setValues(numbers);
		}

		SpreadsheetApp.flush();
	});
}

/**
 * Sync status, price, and date from a transaction into STOK MOBIL.
 * Called automatically from transaction operations.
 */
export function syncStockStatusFromTransaction(
	plateHash: string,
	trxStatus: string,
	salePrice: number,
	saleDate: string,
): void {
	const sheet = getStockSheet();
	const targetRow = findStockCarRowIndex(sheet, plateHash);
	if (!targetRow) return;

	if (trxStatus === "DP") {
		sheet.getRange(targetRow, 6).setValue("Ter-DP");
	} else if (trxStatus === "LUNAS" || trxStatus === "CASH" || trxStatus === "KREDIT") {
		sheet.getRange(targetRow, 6).setValue("Sold");
		if (salePrice > 0) {
			sheet.getRange(targetRow, 7).setValue(salePrice);
		}
		if (saleDate) {
			sheet.getRange(targetRow, 10).setValue(saleDate);
		}
	}
}

/**
 * Revert a car back to "Ready" when its sales transaction is deleted.
 */
export function revertStockStatusOnTransactionDelete(plateHash: string): void {
	const sheet = getStockSheet();
	const targetRow = findStockCarRowIndex(sheet, plateHash);
	if (!targetRow) return;

	sheet.getRange(targetRow, 6).setValue("Ready");
	sheet.getRange(targetRow, 10).setValue("");
}
