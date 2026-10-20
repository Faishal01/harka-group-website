import {
	DATA_START_ROW_INDEX,
	formatDateToDDMMYY,
	formatRp,
	HEADER_ROW_INDEX,
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
 * Menu trigger on Google Sheets open.
 */
export function onOpen() {
	SpreadsheetApp.getUi()
		.createMenu("Harka Dashboard")
		.addItem("Open Dashboard", "openDialog")
		.addToUi();
}

/**
 * Open the Preact transaction dashboard modal dialog.
 */
export function openDialog() {
	const html = HtmlService.createHtmlOutputFromFile("Index")
		.setWidth(1200)
		.setHeight(780)
		.setTitle("Harka Dashboard");

	SpreadsheetApp.getUi().showModalDialog(html, "Harka Dashboard");
}

/**
 * Get or initialize the TRANSAKSI worksheet.
 */
function getTransactionSheet(): GoogleAppsScript.Spreadsheet.Sheet {
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
 * Fetch all transaction rows from the spreadsheet.
 */
export function getTransactions(): TransactionItem[] {
	const sheet = getTransactionSheet();
	const lastRow = sheet.getLastRow();

	if (lastRow < DATA_START_ROW_INDEX) {
		return [];
	}

	const numRows = lastRow - DATA_START_ROW_INDEX + 1;
	const data = sheet
		.getRange(DATA_START_ROW_INDEX, 1, numRows, SHEET_COLUMNS.length)
		.getValues();

	const transactions: TransactionItem[] = [];

	for (let i = 0; i < data.length; i++) {
		const row = data[i];
		const no = Number(row[0]);
		if (!no || isNaN(no)) continue;

		const rawDate = row[1];
		let transactionDate = "";
		if (rawDate instanceof Date) {
			transactionDate = formatDateToDDMMYY(rawDate);
		} else {
			transactionDate = String(rawDate || "").trim();
		}

		const sellingPrice = parseRp(row[7]);
		const downPayment =
			row[8] !== "" && row[8] != null ? parseRp(row[8]) : null;
		const remainingBalance =
			row[9] !== "" && row[9] != null ? parseRp(row[9]) : null;

		transactions.push({
			no,
			transactionDate,
			carDescription: String(row[2] || "").trim(),
			plateNumber: String(row[3] || "").trim().toUpperCase(),
			category:
				(String(row[4] || "").trim() as TransactionCategory) ||
				"JUAL CASH LUNAS",
			buyerName: String(row[5] || "").trim(),
			phoneNumber: String(row[6] || "").trim(),
			sellingPrice,
			downPayment,
			remainingBalance,
			salesPerson: String(row[10] || "").trim(),
			status:
				(String(row[11] || "").trim().toUpperCase() as TransactionStatus) ||
				"LUNAS",
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
	no: number;
} {
	const sheet = getTransactionSheet();
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

	const remainingBalance =
		payload.status === "LUNAS"
			? 0
			: payload.remainingBalance != null
				? payload.remainingBalance
				: payload.sellingPrice - (payload.downPayment ?? 0);

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
	return { success: true, no: nextNo };
}

/**
 * Update an existing transaction row by its number.
 */
export function updateTransaction(payload: TransactionUpdateInput): {
	success: boolean;
} {
	const sheet = getTransactionSheet();
	const lastRow = sheet.getLastRow();

	if (lastRow < DATA_START_ROW_INDEX) {
		throw new Error(`Transaksi #${payload.no} tidak ditemukan`);
	}

	const noValues = sheet
		.getRange(DATA_START_ROW_INDEX, 1, lastRow - DATA_START_ROW_INDEX + 1, 1)
		.getValues();

	let targetRow = -1;
	for (let i = 0; i < noValues.length; i++) {
		if (Number(noValues[i][0]) === payload.no) {
			targetRow = DATA_START_ROW_INDEX + i;
			break;
		}
	}

	if (targetRow === -1) {
		throw new Error(`Transaksi #${payload.no} tidak ditemukan`);
	}

	const remainingBalance =
		payload.status === "LUNAS"
			? 0
			: payload.remainingBalance != null
				? payload.remainingBalance
				: payload.sellingPrice - (payload.downPayment ?? 0);

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
 * Delete a transaction row by its number.
 */
export function deleteTransaction(no: number): { success: boolean } {
	const sheet = getTransactionSheet();
	const lastRow = sheet.getLastRow();

	if (lastRow < DATA_START_ROW_INDEX) {
		throw new Error(`Transaksi #${no} tidak ditemukan`);
	}

	const noValues = sheet
		.getRange(DATA_START_ROW_INDEX, 1, lastRow - DATA_START_ROW_INDEX + 1, 1)
		.getValues();

	let targetRow = -1;
	for (let i = 0; i < noValues.length; i++) {
		if (Number(noValues[i][0]) === no) {
			targetRow = DATA_START_ROW_INDEX + i;
			break;
		}
	}

	if (targetRow === -1) {
		throw new Error(`Transaksi #${no} tidak ditemukan`);
	}

	sheet.deleteRow(targetRow);
	return { success: true };
}

/**
 * Quickly mark a transaction as LUNAS and set remainingBalance to 0.
 */
export function quickMarkLunas(no: number): { success: boolean } {
	const sheet = getTransactionSheet();
	const lastRow = sheet.getLastRow();

	if (lastRow < DATA_START_ROW_INDEX) {
		throw new Error(`Transaksi #${no} tidak ditemukan`);
	}

	const noValues = sheet
		.getRange(DATA_START_ROW_INDEX, 1, lastRow - DATA_START_ROW_INDEX + 1, 1)
		.getValues();

	let targetRow = -1;
	for (let i = 0; i < noValues.length; i++) {
		if (Number(noValues[i][0]) === no) {
			targetRow = DATA_START_ROW_INDEX + i;
			break;
		}
	}

	if (targetRow === -1) {
		throw new Error(`Transaksi #${no} tidak ditemukan`);
	}

	// Column 10: sisa (1-based index 10)
	// Column 12: Status Transaksi (1-based index 12)
	sheet.getRange(targetRow, 10).setValue(formatRp(0));
	sheet.getRange(targetRow, 12).setValue("LUNAS");

	return { success: true };
}
