import {
	DATA_START_ROW_INDEX,
	formatDateToDDMMYY,
	formatRp,
	HEADER_ROW_INDEX,
	hashPlate,
	parseRp,
	SHEET_COLUMNS,
	SHEET_NAME,
	TransactionCategory,
	TransactionCreateInput,
	TransactionItem,
	TransactionStatus,
	TransactionUpdateInput,
} from "../shared/schema";

/**
 * Get or initialize the TRANSAKSI worksheet.
 */
export function getTransactionSheet(): GoogleAppsScript.Spreadsheet.Sheet {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	let sheet = ss.getSheetByName(SHEET_NAME);

	if (!sheet) {
		sheet = ss.insertSheet(SHEET_NAME);
		const headers = [...SHEET_COLUMNS];
		const range = sheet.getRange(HEADER_ROW_INDEX, 1, 1, headers.length);
		range.setValues([headers]);
		range.setFontWeight("bold");
		range.setBackground("#f1f5f9");
	} else {
		// Ensure headers exist at row 3
		const range = sheet.getRange(HEADER_ROW_INDEX, 1, 1, SHEET_COLUMNS.length);
		const values = range.getValues()[0];
		if (!values[0]) {
			range.setValues([[...SHEET_COLUMNS]]);
			range.setFontWeight("bold");
			range.setBackground("#f1f5f9");
		}
	}

	return sheet;
}

/**
 * Locate the row index of a transaction by its normalized car plate hash.
 * Column D is "Plat mobil" (1-based index 4).
 */
export function findRowByPlateHash(
	sheet: GoogleAppsScript.Spreadsheet.Sheet,
	targetHash: string,
): number {
	const lastRow = sheet.getLastRow();
	if (lastRow < DATA_START_ROW_INDEX) {
		return -1;
	}

	const numRows = lastRow - DATA_START_ROW_INDEX + 1;
	const plateValues = sheet.getRange(DATA_START_ROW_INDEX, 4, numRows, 1).getValues();

	for (let i = 0; i < plateValues.length; i++) {
		const cellPlate = String(plateValues[i][0] || "").trim();
		if (cellPlate && hashPlate(cellPlate) === targetHash) {
			return DATA_START_ROW_INDEX + i;
		}
	}

	return -1;
}

/**
 * Fetch all transaction rows from the spreadsheet.
 */
export function getTransactions(): TransactionItem[] {
	const sheet = getTransactionSheet();
	const lastRow = sheet.getLastRow();

	if (lastRow < DATA_START_ROW_INDEX) {
		return [];
	}

	const numRows = lastRow - DATA_START_ROW_INDEX + 1;
	const data = sheet.getRange(DATA_START_ROW_INDEX, 1, numRows, SHEET_COLUMNS.length).getValues();

	const transactions: TransactionItem[] = [];

	for (let i = 0; i < data.length; i++) {
		const row = data[i];
		const no = Number(row[0]);
		if (!no || isNaN(no)) continue;

		const rawDate = row[1];
		let transactionDate: string;
		if (rawDate instanceof Date) {
			transactionDate = formatDateToDDMMYY(rawDate);
		} else {
			transactionDate = String(rawDate || "").trim();
		}

		const plateNumber = String(row[3] || "")
			.trim()
			.toUpperCase();
		const id = hashPlate(plateNumber);
		const sellingPrice = parseRp(row[7]);
		const downPayment = row[8] !== "" && row[8] != null ? parseRp(row[8]) : null;
		const remainingBalance = row[9] !== "" && row[9] != null ? parseRp(row[9]) : null;

		transactions.push({
			id,
			no,
			transactionDate,
			carDescription: String(row[2] || "").trim(),
			plateNumber,
			category: (String(row[4] || "").trim() as TransactionCategory) || "JUAL CASH LUNAS",
			buyerName: String(row[5] || "").trim(),
			phoneNumber: String(row[6] || "").trim(),
			sellingPrice,
			downPayment,
			remainingBalance,
			salesPerson: String(row[10] || "").trim(),
			status:
				(String(row[11] || "")
					.trim()
					.toUpperCase() as TransactionStatus) || "LUNAS",
			notes: row[12] ? String(row[12]).trim() : null,
		});
	}

	return transactions;
}

/**
 * Append a new transaction row to the TRANSAKSI sheet.
 */
export function appendTransaction(payload: TransactionCreateInput): {
	success: boolean;
	id: string;
	no: number;
} {
	const sheet = getTransactionSheet();
	const plateHash = hashPlate(payload.plateNumber);

	// Enforce 1:1 plate uniqueness
	const existingRow = findRowByPlateHash(sheet, plateHash);
	if (existingRow !== -1) {
		throw new Error(
			`Mobil dengan plat nomor "${payload.plateNumber.toUpperCase()}" sudah terdaftar dalam transaksi.`,
		);
	}

	const lastRow = sheet.getLastRow();

	let nextNo = 1;
	if (lastRow >= DATA_START_ROW_INDEX) {
		const noValues = sheet
			.getRange(DATA_START_ROW_INDEX, 1, lastRow - DATA_START_ROW_INDEX + 1, 1)
			.getValues();
		for (let i = 0; i < noValues.length; i++) {
			const val = Number(noValues[i][0]);
			if (!isNaN(val) && val >= nextNo) {
				nextNo = val + 1;
			}
		}
	}

	const hasDp = payload.downPayment != null && payload.downPayment > 0;
	const remainingBalance =
		payload.remainingBalance != null
			? payload.remainingBalance
			: hasDp
				? Math.max(0, payload.sellingPrice - (payload.downPayment ?? 0))
				: payload.status === "LUNAS"
					? 0
					: payload.sellingPrice;

	const rowValues = [
		nextNo,
		payload.transactionDate,
		payload.carDescription,
		payload.plateNumber.toUpperCase(),
		payload.category,
		payload.buyerName,
		payload.phoneNumber,
		formatRp(payload.sellingPrice),
		payload.downPayment != null ? formatRp(payload.downPayment) : "",
		formatRp(remainingBalance),
		payload.salesPerson,
		payload.status,
		payload.notes || "",
	];

	sheet.appendRow(rowValues);
	return { success: true, id: plateHash, no: nextNo };
}

/**
 * Update an existing transaction row located by its plate hash.
 */
export function updateTransaction(payload: TransactionUpdateInput): {
	success: boolean;
} {
	const sheet = getTransactionSheet();
	const targetHash = payload.id || hashPlate(payload.plateNumber);
	const targetRow = findRowByPlateHash(sheet, targetHash);

	if (targetRow === -1) {
		throw new Error(`Transaksi dengan plat "${payload.plateNumber}" tidak ditemukan`);
	}

	const hasDp = payload.downPayment != null && payload.downPayment > 0;
	const remainingBalance =
		payload.remainingBalance != null
			? payload.remainingBalance
			: hasDp
				? Math.max(0, payload.sellingPrice - (payload.downPayment ?? 0))
				: payload.status === "LUNAS"
					? 0
					: payload.sellingPrice;

	const rowValues = [
		payload.no,
		payload.transactionDate,
		payload.carDescription,
		payload.plateNumber.toUpperCase(),
		payload.category,
		payload.buyerName,
		payload.phoneNumber,
		formatRp(payload.sellingPrice),
		payload.downPayment != null ? formatRp(payload.downPayment) : "",
		formatRp(remainingBalance),
		payload.salesPerson,
		payload.status,
		payload.notes || "",
	];

	sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
	return { success: true };
}

/**
 * Delete a transaction row by its plate hash.
 */
export function deleteTransaction(id: string): { success: boolean } {
	const sheet = getTransactionSheet();
	const targetRow = findRowByPlateHash(sheet, id);

	if (targetRow === -1) {
		throw new Error("Transaksi tidak ditemukan");
	}

	sheet.deleteRow(targetRow);
	return { success: true };
}

/**
 * Quickly mark a transaction as LUNAS by its plate hash.
 */
export function quickMarkLunas(id: string): { success: boolean } {
	const sheet = getTransactionSheet();
	const targetRow = findRowByPlateHash(sheet, id);

	if (targetRow === -1) {
		throw new Error("Transaksi tidak ditemukan");
	}

	// Column 10: sisa (1-based index 10)
	// Column 12: Status Transaksi (1-based index 12)
	sheet.getRange(targetRow, 10).setValue(formatRp(0));
	sheet.getRange(targetRow, 12).setValue("LUNAS");

	return { success: true };
}
