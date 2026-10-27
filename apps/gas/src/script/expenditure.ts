import {
	AddRepairInput,
	AddRepairInputSchema,
	EXPENDITURE_COLUMNS,
	EXPENDITURE_DATA_START_ROW_INDEX,
	EXPENDITURE_HEADER_ROW_INDEX,
	EXPENDITURE_SHEET_NAME,
	hashPlate,
	parseRp,
	UpdateVehicleDescriptionInput,
	UpdateVehicleDescriptionInputSchema,
	VehicleExpenditureCreateInput,
	VehicleExpenditureCreateSchema,
	VehicleExpenditureItem,
} from "../shared/schema";
import { deductInventoryByName, restoreInventoryByName } from "./inventory";
import { withDocumentLock } from "./lock";
import { getLunasPlateHashes } from "./transaction";

/**
 * Get or initialize the PENGELUARAN PER UNIT worksheet.
 */
export function getExpenditureSheet(): GoogleAppsScript.Spreadsheet.Sheet {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	let sheet = ss.getSheetByName(EXPENDITURE_SHEET_NAME);

	if (!sheet) {
		sheet = ss.insertSheet(EXPENDITURE_SHEET_NAME);
		const headers = [...EXPENDITURE_COLUMNS];
		const range = sheet.getRange(EXPENDITURE_HEADER_ROW_INDEX, 1, 1, headers.length);
		range.setValues([headers]);
		range.setFontWeight("bold");
		range.setBackground("#f1f5f9");
	} else {
		// Ensure headers exist at row 3
		const range = sheet.getRange(EXPENDITURE_HEADER_ROW_INDEX, 1, 1, EXPENDITURE_COLUMNS.length);
		const values = range.getValues()[0];
		if (!values[0]) {
			range.setValues([[...EXPENDITURE_COLUMNS]]);
			range.setFontWeight("bold");
			range.setBackground("#f1f5f9");
		}
	}

	return sheet;
}

export interface VehicleRowRange {
	startRow: number;
	endRow: number;
	numRows: number;
	no: number;
	carDescription: string;
	plateNumber: string;
}

/**
 * Dynamically locate the row boundaries of a vehicle by its plate hash.
 */
export function findVehicleRowRange(
	sheet: GoogleAppsScript.Spreadsheet.Sheet,
	targetPlateHash: string,
): VehicleRowRange | null {
	const lastRow = sheet.getLastRow();
	if (lastRow < EXPENDITURE_DATA_START_ROW_INDEX) {
		return null;
	}

	const totalRows = lastRow - EXPENDITURE_DATA_START_ROW_INDEX + 1;
	const values = sheet.getRange(EXPENDITURE_DATA_START_ROW_INDEX, 1, totalRows, 3).getValues();

	let inTargetBlock = false;
	let startRow = -1;
	let no = 0;
	let carDescription = "";
	let plateNumber = "";

	for (let i = 0; i < values.length; i++) {
		const row = values[i];
		const cellNo = row[0];
		const cellPlate = String(row[2] || "").trim();
		const currentRow = EXPENDITURE_DATA_START_ROW_INDEX + i;

		// Check if this row is the start of a vehicle block
		const isVehicleStart =
			(cellNo !== "" && cellNo !== null && cellNo !== undefined) || cellPlate !== "";

		if (isVehicleStart) {
			if (inTargetBlock) {
				// We reached the start of the next vehicle, so target ends at currentRow - 1
				return {
					startRow,
					endRow: currentRow - 1,
					numRows: currentRow - startRow,
					no,
					carDescription,
					plateNumber,
				};
			}

			if (cellPlate && hashPlate(cellPlate) === targetPlateHash) {
				inTargetBlock = true;
				startRow = currentRow;
				no = Number(cellNo) || 0;
				carDescription = String(row[1] || "").trim();
				plateNumber = cellPlate;
			}
		}
	}

	if (inTargetBlock) {
		return {
			startRow,
			endRow: lastRow,
			numRows: lastRow - startRow + 1,
			no,
			carDescription,
			plateNumber,
		};
	}

	return null;
}

/**
 * Fetch all grouped vehicle expenditures from the spreadsheet.
 * Columns (A..G):
 * 0 (A): No
 * 1 (B): Deskripsi Mobil
 * 2 (C): Plat Mobil
 * 3 (D): Deskripsi perbaikan
 * 4 (E): Kuantitas (numeric for Inventory Showroom items, blank for general/service items)
 * 5 (F): Biaya
 * 6 (G): Total
 */
export function getExpenditures(): VehicleExpenditureItem[] {
	const sheet = getExpenditureSheet();
	const lastRow = sheet.getLastRow();

	if (lastRow < EXPENDITURE_DATA_START_ROW_INDEX) {
		return [];
	}

	const totalRows = lastRow - EXPENDITURE_DATA_START_ROW_INDEX + 1;
	const values = sheet.getRange(EXPENDITURE_DATA_START_ROW_INDEX, 1, totalRows, 7).getValues();

	// Fetch set of LUNAS vehicle plate hashes in TRANSAKSI
	const lunasSet = getLunasPlateHashes();

	const result: VehicleExpenditureItem[] = [];
	let currentVehicle: VehicleExpenditureItem | null = null;

	for (let i = 0; i < values.length; i++) {
		const row = values[i];
		const cellNo = row[0];
		const cellCar = String(row[1] || "").trim();
		const cellPlate = String(row[2] || "").trim();
		const repairDesc = String(row[3] || "").trim();
		const rawQty = parseInt(String(row[4] ?? "").trim(), 10);
		const quantity = !isNaN(rawQty) && rawQty > 0 ? rawQty : null;
		const repairCost = parseRp(row[5]);

		const isNewVehicleStart =
			(cellNo !== "" && cellNo !== null && cellNo !== undefined) || cellPlate !== "";

		if (isNewVehicleStart) {
			if (currentVehicle) {
				currentVehicle.totalCost = currentVehicle.repairs.reduce((sum, r) => sum + r.cost, 0);
				result.push(currentVehicle);
			}

			const parsedNo = Number(cellNo) || result.length + 1;
			const id = hashPlate(cellPlate);
			const isLunas = lunasSet.has(id);

			currentVehicle = {
				id,
				no: parsedNo,
				carDescription: cellCar,
				plateNumber: cellPlate,
				repairs: [],
				totalCost: 0,
				isLunas,
			};
		}

		if (currentVehicle && (repairDesc || repairCost > 0)) {
			currentVehicle.repairs.push({
				id: `${currentVehicle.id}-r${currentVehicle.repairs.length + 1}`,
				description: repairDesc || "Perbaikan",
				quantity,
				cost: repairCost,
			});
		}
	}

	if (currentVehicle) {
		currentVehicle.totalCost = currentVehicle.repairs.reduce((sum, r) => sum + r.cost, 0);
		result.push(currentVehicle);
	}

	return result;
}

/**
 * Applies standard grid borders and alignments to a vehicle block in PENGELUARAN PER UNIT.
 * - Solid borders on all outer and inner cell boundaries (7 columns A..G).
 * - Vertical alignment: TOP for all cells.
 * - Horizontal alignment:
 *   - Col A (1 - No): center
 *   - Col B (2 - Deskripsi Mobil): left
 *   - Col C (3 - Plat Mobil): center
 *   - Col D (4 - Deskripsi perbaikan): left
 *   - Col E (5 - Kuantitas): center
 *   - Col F (6 - Biaya): right
 *   - Col G (7 - Total): right
 */
export function formatVehicleRange(
	sheet: GoogleAppsScript.Spreadsheet.Sheet,
	startRow: number,
	numRows: number,
	isLunas = false,
): void {
	const blockRange = sheet.getRange(startRow, 1, numRows, 7);

	// Full grid solid borders (top, left, bottom, right, vertical, horizontal)
	blockRange.setBorder(
		true,
		true,
		true,
		true,
		true,
		true,
		"#000000",
		SpreadsheetApp.BorderStyle.SOLID,
	);

	// Background fill: soft yellow (#fff2cc) for entire vehicle block if LUNAS in TRANSAKSI, white (#ffffff) otherwise
	blockRange.setBackground(isLunas ? "#fff2cc" : "#ffffff");

	// All cells vertically top-aligned
	blockRange.setVerticalAlignment("top");

	// Horizontal alignments
	sheet.getRange(startRow, 1, numRows, 1).setHorizontalAlignment("center");
	sheet.getRange(startRow, 2, numRows, 1).setHorizontalAlignment("left");
	sheet.getRange(startRow, 3, numRows, 1).setHorizontalAlignment("center");
	sheet.getRange(startRow, 4, numRows, 1).setHorizontalAlignment("left");
	sheet.getRange(startRow, 5, numRows, 1).setHorizontalAlignment("center");
	sheet.getRange(startRow, 6, numRows, 1).setHorizontalAlignment("right");
	sheet.getRange(startRow, 7, numRows, 1).setHorizontalAlignment("right");
}

/**
 * Synchronize the background fill color of a vehicle block in PENGELUARAN PER UNIT
 * to yellow (#fff2cc) if LUNAS, or white (#ffffff) if not.
 */
export function syncVehicleLunasBackground(plateHash: string, isLunas: boolean): void {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName(EXPENDITURE_SHEET_NAME);
	if (!sheet) return;

	const range = findVehicleRowRange(sheet, plateHash);
	if (!range) return;

	sheet
		.getRange(range.startRow, 1, range.numRows, 7)
		.setBackground(isLunas ? "#fff2cc" : "#ffffff");
}

/**
 * Append a new vehicle with one or more repair items to PENGELUARAN PER UNIT.
 */
export function appendVehicleExpenditure(
	payload: VehicleExpenditureCreateInput,
): VehicleExpenditureItem {
	return withDocumentLock(() => {
		const parsed = VehicleExpenditureCreateSchema.parse(payload);
		const sheet = getExpenditureSheet();
		const targetHash = hashPlate(parsed.plateNumber);

		const existing = findVehicleRowRange(sheet, targetHash);
		if (existing) {
			throw new Error(`Kendaraan dengan plat "${parsed.plateNumber}" sudah terdaftar.`);
		}

		// Deduct inventory stock for any repair item with quantity > 0
		for (const r of parsed.repairs) {
			if (r.quantity && r.quantity > 0) {
				deductInventoryByName(r.description, r.quantity, parsed.carDescription);
			}
		}

		const existingVehicles = getExpenditures();
		const nextNo = existingVehicles.reduce((max, v) => Math.max(max, v.no), 0) + 1;

		const startRow = Math.max(sheet.getLastRow() + 1, EXPENDITURE_DATA_START_ROW_INDEX);
		const numRows = parsed.repairs.length;
		const endRow = startRow + numRows - 1;

		const rowData: (string | number)[][] = [];
		for (let i = 0; i < numRows; i++) {
			const qtyVal =
				parsed.repairs[i].quantity && parsed.repairs[i].quantity! > 0
					? parsed.repairs[i].quantity!
					: "";
			if (i === 0) {
				rowData.push([
					nextNo,
					parsed.carDescription,
					parsed.plateNumber,
					parsed.repairs[i].description,
					qtyVal,
					parsed.repairs[i].cost,
					"",
				]);
			} else {
				rowData.push([
					"",
					"",
					"",
					parsed.repairs[i].description,
					qtyVal,
					parsed.repairs[i].cost,
					"",
				]);
			}
		}

		sheet.getRange(startRow, 1, numRows, 7).setValues(rowData);

		// Explicitly clear Col E (Kuantitas) for non-inventory rows so they remain blank
		for (let i = 0; i < numRows; i++) {
			if (!parsed.repairs[i].quantity || parsed.repairs[i].quantity! <= 0) {
				sheet.getRange(startRow + i, 5).clearContent();
			}
		}

		// Merge Columns A (1), B (2), C (3), G (7) across the vehicle rows if numRows > 1
		if (numRows > 1) {
			sheet.getRange(startRow, 1, numRows, 1).merge();
			sheet.getRange(startRow, 2, numRows, 1).merge();
			sheet.getRange(startRow, 3, numRows, 1).merge();
			sheet.getRange(startRow, 7, numRows, 1).merge();
		}

		// Set dynamic formula in Column G (7) summing Column F (Biaya)
		sheet.getRange(startRow, 7).setFormula(`=SUM(F${startRow}:F${endRow})`);

		// Number formats
		sheet.getRange(startRow, 6, numRows, 1).setNumberFormat("Rp #,##0");
		sheet.getRange(startRow, 7, 1, 1).setNumberFormat("Rp #,##0");

		const isLunas = getLunasPlateHashes().has(targetHash);

		// Apply borders, alignments, and LUNAS yellow background
		formatVehicleRange(sheet, startRow, numRows, isLunas);

		return {
			id: targetHash,
			no: nextNo,
			carDescription: parsed.carDescription,
			plateNumber: parsed.plateNumber,
			repairs: parsed.repairs.map((r, idx) => ({
				id: `${targetHash}-r${idx + 1}`,
				description: r.description,
				quantity: r.quantity && r.quantity > 0 ? r.quantity : null,
				cost: r.cost,
			})),
			totalCost: parsed.repairs.reduce((sum, r) => sum + r.cost, 0),
			isLunas,
		};
	});
}

/**
 * Append a single repair item in-place to an existing vehicle block.
 */
export function appendRepairToVehicle(payload: AddRepairInput): VehicleExpenditureItem {
	return withDocumentLock(() => {
		const parsed = AddRepairInputSchema.parse(payload);
		const sheet = getExpenditureSheet();

		const range = findVehicleRowRange(sheet, parsed.vehiclePlateHash);
		if (!range) {
			throw new Error("Kendaraan tidak ditemukan di spreadsheet.");
		}

		// Deduct inventory stock if quantity > 0
		if (parsed.quantity && parsed.quantity > 0) {
			deductInventoryByName(parsed.description, parsed.quantity, range.carDescription);
		}

		// Insert 1 row right after the car's current last row
		sheet.insertRowAfter(range.endRow);
		const newRow = range.endRow + 1;
		const newNumRows = range.numRows + 1;

		const qtyVal = parsed.quantity && parsed.quantity > 0 ? parsed.quantity : "";

		// Populate the new repair row across 7 columns (A..G)
		sheet
			.getRange(newRow, 1, 1, 7)
			.setValues([["", "", "", parsed.description, qtyVal, parsed.cost, ""]]);

		if (!parsed.quantity || parsed.quantity <= 0) {
			sheet.getRange(newRow, 5).clearContent();
		}

		// Unmerge old columns A (1), B (2), C (3), G (7)
		if (range.numRows > 1) {
			sheet.getRange(range.startRow, 1, range.numRows, 1).breakApart();
			sheet.getRange(range.startRow, 2, range.numRows, 1).breakApart();
			sheet.getRange(range.startRow, 3, range.numRows, 1).breakApart();
			sheet.getRange(range.startRow, 7, range.numRows, 1).breakApart();
		}

		// Ensure vehicle metadata is preserved at startRow
		sheet
			.getRange(range.startRow, 1, 1, 3)
			.setValues([[range.no, range.carDescription, range.plateNumber]]);

		// Re-merge columns A (1), B (2), C (3), G (7) across the expanded span
		sheet.getRange(range.startRow, 1, newNumRows, 1).merge();
		sheet.getRange(range.startRow, 2, newNumRows, 1).merge();
		sheet.getRange(range.startRow, 3, newNumRows, 1).merge();
		sheet.getRange(range.startRow, 7, newNumRows, 1).merge();

		// Update Column G (7) formula summing Column F (Biaya)
		sheet.getRange(range.startRow, 7).setFormula(`=SUM(F${range.startRow}:F${newRow})`);

		// Number formats
		sheet.getRange(newRow, 6).setNumberFormat("Rp #,##0");
		sheet.getRange(range.startRow, 7).setNumberFormat("Rp #,##0");

		const isLunas = getLunasPlateHashes().has(parsed.vehiclePlateHash);

		// Apply borders and alignments to expanded vehicle block
		formatVehicleRange(sheet, range.startRow, newNumRows, isLunas);

		const updated = getExpenditures().find((v) => v.id === parsed.vehiclePlateHash);
		if (!updated) {
			throw new Error("Gagal mengambil data kendaraan yang telah diperbarui.");
		}
		return updated;
	});
}

/**
 * Delete a specific repair item from a vehicle.
 * If this was the last repair item of the vehicle, the entire vehicle row is deleted.
 * Automatically restores Inventory Showroom stock if the deleted repair had Kuantitas > 0.
 */
export function deleteRepair(vehiclePlateHash: string, repairIndex: number): void {
	withDocumentLock(() => {
		const sheet = getExpenditureSheet();
		const range = findVehicleRowRange(sheet, vehiclePlateHash);
		if (!range) {
			throw new Error("Kendaraan tidak ditemukan di spreadsheet.");
		}

		if (repairIndex < 0 || repairIndex >= range.numRows) {
			throw new Error("Indeks perbaikan tidak valid.");
		}

		const targetRow = range.startRow + repairIndex;

		// Read targetRow Col D (Deskripsi perbaikan) & Col E (Kuantitas) before deleting to restore inventory
		const deletedRowVals = sheet.getRange(targetRow, 4, 1, 2).getValues()[0];
		const deletedDesc = String(deletedRowVals[0] ?? "").trim();
		const deletedQty = parseInt(String(deletedRowVals[1] ?? "").trim(), 10);
		if (deletedDesc && !isNaN(deletedQty) && deletedQty > 0) {
			restoreInventoryByName(deletedDesc, deletedQty, range.carDescription);
		}

		// If this is the only repair item, delete the entire vehicle block
		if (range.numRows <= 1) {
			sheet.deleteRow(range.startRow);
			return;
		}

		// Unmerge columns A (1), B (2), C (3), G (7) before deleting the row
		sheet.getRange(range.startRow, 1, range.numRows, 1).breakApart();
		sheet.getRange(range.startRow, 2, range.numRows, 1).breakApart();
		sheet.getRange(range.startRow, 3, range.numRows, 1).breakApart();
		sheet.getRange(range.startRow, 7, range.numRows, 1).breakApart();

		sheet.deleteRow(targetRow);

		const newNumRows = range.numRows - 1;
		const newEndRow = range.startRow + newNumRows - 1;

		// Ensure top row has metadata
		sheet
			.getRange(range.startRow, 1, 1, 3)
			.setValues([[range.no, range.carDescription, range.plateNumber]]);

		// Re-merge if multiple rows remain
		if (newNumRows > 1) {
			sheet.getRange(range.startRow, 1, newNumRows, 1).merge();
			sheet.getRange(range.startRow, 2, newNumRows, 1).merge();
			sheet.getRange(range.startRow, 3, newNumRows, 1).merge();
			sheet.getRange(range.startRow, 7, newNumRows, 1).merge();
		}

		// Update formula in Column G (7) summing Column F (Biaya)
		sheet.getRange(range.startRow, 7).setFormula(`=SUM(F${range.startRow}:F${newEndRow})`);
		sheet.getRange(range.startRow, 7).setNumberFormat("Rp #,##0");

		const isLunas = getLunasPlateHashes().has(vehiclePlateHash);

		// Apply borders and alignments to remaining vehicle block
		formatVehicleRange(sheet, range.startRow, newNumRows, isLunas);
	});
}

/**
 * Delete all rows belonging to a vehicle block.
 * Automatically restores Inventory Showroom stock for any repair rows with Kuantitas > 0.
 */
export function deleteVehicleExpenditure(vehiclePlateHash: string): void {
	withDocumentLock(() => {
		const sheet = getExpenditureSheet();
		const range = findVehicleRowRange(sheet, vehiclePlateHash);
		if (!range) {
			throw new Error("Kendaraan tidak ditemukan di spreadsheet.");
		}

		// Restore inventory for any repair rows with Kuantitas > 0
		const repairRowsVals = sheet.getRange(range.startRow, 4, range.numRows, 2).getValues();
		for (let i = 0; i < repairRowsVals.length; i++) {
			const desc = String(repairRowsVals[i][0] ?? "").trim();
			const qty = parseInt(String(repairRowsVals[i][1] ?? "").trim(), 10);
			if (desc && !isNaN(qty) && qty > 0) {
				restoreInventoryByName(desc, qty, range.carDescription);
			}
		}

		sheet.deleteRows(range.startRow, range.numRows);
	});
}

/**
 * Update the description of a vehicle in the PENGELUARAN PER UNIT worksheet.
 * Updates the vertically merged Deskripsi Mobil cell (Column B) at startRow.
 */
export function updateVehicleDescription(
	payload: UpdateVehicleDescriptionInput,
): VehicleExpenditureItem {
	return withDocumentLock(() => {
		const sheet = getExpenditureSheet();
		const validated = UpdateVehicleDescriptionInputSchema.parse(payload);
		const range = findVehicleRowRange(sheet, validated.vehiclePlateHash);
		if (!range) {
			throw new Error("Kendaraan tidak ditemukan di spreadsheet.");
		}

		// Update Deskripsi Mobil (Column B)
		sheet.getRange(range.startRow, 2).setValue(validated.carDescription);

		const expenditures = getExpenditures();
		const updated = expenditures.find((item) => item.id === validated.vehiclePlateHash);
		if (!updated) {
			throw new Error("Gagal mengambil data kendaraan setelah diperbarui.");
		}

		return updated;
	});
}
