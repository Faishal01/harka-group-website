import {
	INVENTORY_COLUMNS,
	INVENTORY_DATA_START_ROW_INDEX,
	INVENTORY_HEADER_ROW_INDEX,
	INVENTORY_SHEET_NAME,
	InventoryConsumeInput,
	InventoryConsumeSchema,
	InventoryCreateInput,
	InventoryCreateSchema,
	InventoryItem,
	InventoryUpdateInput,
	InventoryUpdateSchema,
	parseRp,
} from "../shared/schema";
import { withDocumentLock } from "./lock";

/**
 * Get or initialize the Inventory Showroom worksheet.
 * Banner is at A1 ("KEBUTUHAN MOBIL"), Headers at Row 2 (A2:H2).
 */
export function getInventorySheet(): GoogleAppsScript.Spreadsheet.Sheet {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	let sheet = ss.getSheetByName(INVENTORY_SHEET_NAME);

	if (!sheet) {
		sheet = ss.insertSheet(INVENTORY_SHEET_NAME);
		// Row 1 Banner
		const bannerCell = sheet.getRange(1, 1);
		bannerCell.setValue("KEBUTUHAN MOBIL");
		bannerCell.setFontWeight("bold");
		bannerCell.setFontColor("#ffffff");
		bannerCell.setBackground("#4a86e8");

		// Row 2 Headers
		const headers = [...INVENTORY_COLUMNS];
		const range = sheet.getRange(INVENTORY_HEADER_ROW_INDEX, 1, 1, headers.length);
		range.setValues([headers]);
		range.setFontWeight("bold");
		range.setBackground("#f1f5f9");
	}

	return sheet;
}

/**
 * Helper to locate the row index of an inventory item by its sequence number (Column A).
 */
export function findRowByItemNo(
	sheet: GoogleAppsScript.Spreadsheet.Sheet,
	no: number,
): number | null {
	const lastRow = sheet.getLastRow();
	if (lastRow < INVENTORY_DATA_START_ROW_INDEX) return null;

	const numRows = lastRow - INVENTORY_DATA_START_ROW_INDEX + 1;
	const noValues = sheet.getRange(INVENTORY_DATA_START_ROW_INDEX, 1, numRows, 1).getValues();

	for (let i = 0; i < noValues.length; i++) {
		const rowNo = parseInt(String(noValues[i][0]).trim(), 10);
		if (rowNo === no) {
			return INVENTORY_DATA_START_ROW_INDEX + i;
		}
	}

	return null;
}

/**
 * Parse restock threshold from Column G formula e.g. "=IF(F3<=2;..." or "=IF(F3<=1,..."
 */
function parseThresholdFromFormula(formula: string): number {
	if (!formula) return 2;
	const match = formula.match(/<=?\s*(\d+)/i);
	if (match && match[1]) {
		const parsed = parseInt(match[1], 10);
		return isNaN(parsed) ? 2 : parsed;
	}
	return 2;
}

/**
 * Read all inventory items from the spreadsheet.
 */
export function getInventoryItems(): InventoryItem[] {
	const sheet = getInventorySheet();
	const lastRow = sheet.getLastRow();

	if (lastRow < INVENTORY_DATA_START_ROW_INDEX) {
		return [];
	}

	const numRows = lastRow - INVENTORY_DATA_START_ROW_INDEX + 1;
	const dataRange = sheet.getRange(INVENTORY_DATA_START_ROW_INDEX, 1, numRows, 8);
	const values = dataRange.getValues();
	const formulas = dataRange.getFormulas();

	const items: InventoryItem[] = [];

	for (let i = 0; i < values.length; i++) {
		const row = values[i];
		const rowFormulas = formulas[i];

		const rawNo = row[0];
		const namaBarang = String(row[1] ?? "").trim();
		if (!namaBarang && (rawNo === "" || rawNo === null || rawNo === undefined)) {
			continue;
		}

		const no = parseInt(String(rawNo).trim(), 10) || i + 1;
		const rawHarga = row[2];
		const harga = typeof rawHarga === "number" ? rawHarga : parseRp(rawHarga);

		const stokAwal = Math.max(0, parseInt(String(row[3] ?? "0").trim(), 10) || 0);
		const terpakai = Math.max(0, parseInt(String(row[4] ?? "0").trim(), 10) || 0);
		const tersedia = Math.max(0, stokAwal - terpakai);

		const gFormula = rowFormulas[6] || "";
		const threshold = parseThresholdFromFormula(gFormula);

		// Computed status based on threshold (e.g. <= threshold is PERLU RESTOCK)
		const rawStatus = String(row[6] ?? "")
			.trim()
			.toUpperCase();
		const status =
			rawStatus === "PERLU RESTOCK" || rawStatus === "AMAN"
				? rawStatus
				: tersedia <= threshold
					? "PERLU RESTOCK"
					: "AMAN";

		const ditujukan = String(row[7] ?? "").trim();

		items.push({
			no,
			namaBarang,
			harga,
			stokAwal,
			terpakai,
			tersedia,
			status,
			threshold,
			ditujukan,
		});
	}

	return items;
}

/**
 * Append a new inventory item to the worksheet.
 */
export function appendInventoryItem(rawInput: InventoryCreateInput): InventoryItem {
	return withDocumentLock(() => {
		const parsed = InventoryCreateSchema.parse(rawInput);
		const sheet = getInventorySheet();
		const lastRow = sheet.getLastRow();

		// Calculate next No
		let maxNo = 0;
		if (lastRow >= INVENTORY_DATA_START_ROW_INDEX) {
			const numRows = lastRow - INVENTORY_DATA_START_ROW_INDEX + 1;
			const noValues = sheet.getRange(INVENTORY_DATA_START_ROW_INDEX, 1, numRows, 1).getValues();
			for (const val of noValues) {
				const n = parseInt(String(val[0]).trim(), 10);
				if (!isNaN(n) && n > maxNo) {
					maxNo = n;
				}
			}
		}

		const targetRow = lastRow + 1;
		const nextNo = maxNo + 1;
		const threshold = parsed.threshold ?? 2;

		const rowData: (string | number)[] = [
			nextNo,
			parsed.namaBarang,
			parsed.harga > 0 ? parsed.harga : "",
			parsed.stokAwal,
			0, // Initial Terpakai is 0
			`=D${targetRow}-E${targetRow}`,
			`=IF(F${targetRow}<=${threshold};"PERLU RESTOCK";"AMAN")`,
			parsed.ditujukan || "",
		];

		const range = sheet.getRange(targetRow, 1, 1, 8);
		range.setValues([rowData]);

		// Formatting
		sheet.getRange(targetRow, 1).setHorizontalAlignment("center");
		if (parsed.harga > 0) {
			sheet.getRange(targetRow, 3).setNumberFormat("Rp #,##0");
		}
		sheet.getRange(targetRow, 4, 1, 4).setHorizontalAlignment("center");

		return {
			no: nextNo,
			namaBarang: parsed.namaBarang,
			harga: parsed.harga,
			stokAwal: parsed.stokAwal,
			terpakai: 0,
			tersedia: parsed.stokAwal,
			status: parsed.stokAwal <= threshold ? "PERLU RESTOCK" : "AMAN",
			threshold,
			ditujukan: parsed.ditujukan || "",
		};
	});
}

/**
 * Update an existing inventory item.
 */
export function updateInventoryItem(rawInput: InventoryUpdateInput): InventoryItem {
	return withDocumentLock(() => {
		const parsed = InventoryUpdateSchema.parse(rawInput);
		const sheet = getInventorySheet();
		const rowIdx = findRowByItemNo(sheet, parsed.no);

		if (!rowIdx) {
			throw new Error(`Item inventaris dengan No #${parsed.no} tidak ditemukan.`);
		}

		const threshold = parsed.threshold ?? 2;
		const tersedia = Math.max(0, parsed.stokAwal - parsed.terpakai);

		const rowData: (string | number)[] = [
			parsed.no,
			parsed.namaBarang,
			parsed.harga > 0 ? parsed.harga : "",
			parsed.stokAwal,
			parsed.terpakai,
			`=D${rowIdx}-E${rowIdx}`,
			`=IF(F${rowIdx}<=${threshold};"PERLU RESTOCK";"AMAN")`,
			parsed.ditujukan || "",
		];

		const range = sheet.getRange(rowIdx, 1, 1, 8);
		range.setValues([rowData]);

		if (parsed.harga > 0) {
			sheet.getRange(rowIdx, 3).setNumberFormat("Rp #,##0");
		}

		return {
			no: parsed.no,
			namaBarang: parsed.namaBarang,
			harga: parsed.harga,
			stokAwal: parsed.stokAwal,
			terpakai: parsed.terpakai,
			tersedia,
			status: tersedia <= threshold ? "PERLU RESTOCK" : "AMAN",
			threshold,
			ditujukan: parsed.ditujukan || "",
		};
	});
}

/**
 * Record usage of an inventory item on a vehicle.
 */
export function useInventoryItem(rawInput: InventoryConsumeInput): InventoryItem {
	return withDocumentLock(() => {
		const parsed = InventoryConsumeSchema.parse(rawInput);
		const sheet = getInventorySheet();
		const rowIdx = findRowByItemNo(sheet, parsed.no);

		if (!rowIdx) {
			throw new Error(`Item inventaris dengan No #${parsed.no} tidak ditemukan.`);
		}

		const currentValues = sheet.getRange(rowIdx, 1, 1, 8).getValues()[0];
		const currentFormulas = sheet.getRange(rowIdx, 1, 1, 8).getFormulas()[0];

		const namaBarang = String(currentValues[1] ?? "").trim();
		const rawHarga = currentValues[2];
		const harga = typeof rawHarga === "number" ? rawHarga : parseRp(rawHarga);
		const stokAwal = parseInt(String(currentValues[3] ?? "0").trim(), 10) || 0;
		const currentTerpakai = parseInt(String(currentValues[4] ?? "0").trim(), 10) || 0;
		const existingDitujukan = String(currentValues[7] ?? "").trim();

		const newTerpakai = currentTerpakai + parsed.qty;
		const newTersedia = Math.max(0, stokAwal - newTerpakai);

		const updatedDitujukan = existingDitujukan
			? `${existingDitujukan}, ${parsed.carName}`
			: parsed.carName;

		const threshold = parseThresholdFromFormula(currentFormulas[6] || "");

		// Update Column E (Terpakai) and Column H (Ditujukan)
		sheet.getRange(rowIdx, 5).setValue(newTerpakai);
		sheet.getRange(rowIdx, 8).setValue(updatedDitujukan);

		return {
			no: parsed.no,
			namaBarang,
			harga,
			stokAwal,
			terpakai: newTerpakai,
			tersedia: newTersedia,
			status: newTersedia <= threshold ? "PERLU RESTOCK" : "AMAN",
			threshold,
			ditujukan: updatedDitujukan,
		};
	});
}

/**
 * Delete an inventory item row by its sequence number.
 */
export function deleteInventoryItem(no: number): boolean {
	return withDocumentLock(() => {
		const sheet = getInventorySheet();
		const rowIdx = findRowByItemNo(sheet, no);

		if (!rowIdx) {
			throw new Error(`Item inventaris dengan No #${no} tidak ditemukan.`);
		}

		sheet.deleteRow(rowIdx);
		return true;
	});
}

/**
 * Helper to locate the row index of an inventory item by its name (Column B, case-insensitive).
 */
export function findInventoryRowByName(
	sheet: GoogleAppsScript.Spreadsheet.Sheet,
	itemName: string,
): number | null {
	const target = itemName.trim().toLowerCase();
	if (!target) return null;

	const lastRow = sheet.getLastRow();
	if (lastRow < INVENTORY_DATA_START_ROW_INDEX) return null;

	const numRows = lastRow - INVENTORY_DATA_START_ROW_INDEX + 1;
	const nameValues = sheet.getRange(INVENTORY_DATA_START_ROW_INDEX, 2, numRows, 1).getValues();

	for (let i = 0; i < nameValues.length; i++) {
		const rowName = String(nameValues[i][0] ?? "")
			.trim()
			.toLowerCase();
		if (rowName === target) {
			return INVENTORY_DATA_START_ROW_INDEX + i;
		}
	}

	return null;
}

/**
 * Deduct stock in Inventory Showroom when an inventory item is added to Pengeluaran Per Unit.
 * Must be called inside withDocumentLock.
 */
export function deductInventoryByName(itemName: string, qty: number, carName: string): void {
	if (!qty || qty <= 0) return;

	const sheet = getInventorySheet();
	const rowIdx = findInventoryRowByName(sheet, itemName);
	if (!rowIdx) return;

	const currentValues = sheet.getRange(rowIdx, 1, 1, 8).getValues()[0];
	const namaBarang = String(currentValues[1] ?? "").trim();
	const stokAwal = parseInt(String(currentValues[3] ?? "0").trim(), 10) || 0;
	const currentTerpakai = parseInt(String(currentValues[4] ?? "0").trim(), 10) || 0;
	const tersedia = Math.max(0, stokAwal - currentTerpakai);

	if (qty > tersedia) {
		throw new Error(
			`Stok "${namaBarang}" tidak mencukupi (Tersedia: ${tersedia} unit, Diminta: ${qty} unit).`,
		);
	}

	const newTerpakai = currentTerpakai + qty;
	const existingDitujukan = String(currentValues[7] ?? "").trim();
	const cleanCarName = carName.trim();
	const updatedDitujukan = existingDitujukan
		? `${existingDitujukan}, ${cleanCarName}`
		: cleanCarName;

	sheet.getRange(rowIdx, 5).setValue(newTerpakai);
	sheet.getRange(rowIdx, 8).setValue(updatedDitujukan);
}

/**
 * Restore stock in Inventory Showroom when a repair item with Kuantitas > 0 is deleted from Pengeluaran Per Unit.
 * Must be called inside withDocumentLock.
 */
export function restoreInventoryByName(itemName: string, qty: number, carName: string): void {
	if (!qty || qty <= 0) return;

	const sheet = getInventorySheet();
	const rowIdx = findInventoryRowByName(sheet, itemName);
	if (!rowIdx) return;

	const currentValues = sheet.getRange(rowIdx, 1, 1, 8).getValues()[0];
	const currentTerpakai = parseInt(String(currentValues[4] ?? "0").trim(), 10) || 0;
	const existingDitujukan = String(currentValues[7] ?? "").trim();

	const newTerpakai = Math.max(0, currentTerpakai - qty);

	// Remove one occurrence of carName from comma-separated Ditujukan list
	let updatedDitujukan = existingDitujukan;
	if (existingDitujukan && carName.trim()) {
		const targetCar = carName.trim().toLowerCase();
		const parts = existingDitujukan
			.split(",")
			.map((p) => p.trim())
			.filter(Boolean);
		const removeIdx = parts.findIndex((p) => p.toLowerCase() === targetCar);
		if (removeIdx !== -1) {
			parts.splice(removeIdx, 1);
		}
		updatedDitujukan = parts.join(", ");
	}

	sheet.getRange(rowIdx, 5).setValue(newTerpakai);
	sheet.getRange(rowIdx, 8).setValue(updatedDitujukan);
}
