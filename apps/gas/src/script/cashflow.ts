import {
	CASH_COLUMNS,
	CASH_DATA_START_ROW_INDEX,
	CASH_HEADER_ROW_INDEX,
	CASH_SHEET_NAME,
	CashTransactionCreateInput,
	CashTransactionCreateSchema,
	CashTransactionItem,
	CashTransactionUpdateInput,
	CashTransactionUpdateSchema,
	PickerConfig,
	UploadReceiptInput,
	UploadReceiptInputSchema,
	parseRp,
} from "../shared/schema";
import { withDocumentLock } from "./lock";

/**
 * Get or initialize the PENGELUARAN KAS worksheet.
 * Banner is at A1 ("CASHFLOW"), Headers at Row 3 (A3:G3).
 */
export function getCashSheet(): GoogleAppsScript.Spreadsheet.Sheet {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	let sheet = ss.getSheetByName(CASH_SHEET_NAME);

	if (!sheet) {
		sheet = ss.insertSheet(CASH_SHEET_NAME);
		// Row 1 Banner
		const bannerCell = sheet.getRange(1, 1);
		bannerCell.setValue("CASHFLOW");
		bannerCell.setFontWeight("bold");
		bannerCell.setFontColor("#ffffff");
		bannerCell.setBackground("#4a86e8");

		// Row 3 Headers
		const headers = [...CASH_COLUMNS];
		const range = sheet.getRange(CASH_HEADER_ROW_INDEX, 1, 1, headers.length);
		range.setValues([headers]);
		range.setFontWeight("bold");
		range.setBackground("#f1f5f9");
	} else {
		// Ensure headers exist at row 3 if missing
		const range = sheet.getRange(CASH_HEADER_ROW_INDEX, 1, 1, CASH_COLUMNS.length);
		const values = range.getValues()[0];
		if (!values[0]) {
			range.setValues([[...CASH_COLUMNS]]);
			range.setFontWeight("bold");
			range.setBackground("#f1f5f9");
		}
	}

	return sheet;
}

/**
 * Retrieve the configured Google Drive Receipts folder ID from Script Properties.
 */
export function getReceiptsFolderId(): string {
	try {
		return PropertiesService.getScriptProperties().getProperty("RECEIPTS_FOLDER_ID") || "";
	} catch (e) {
		console.warn("Could not read RECEIPTS_FOLDER_ID from ScriptProperties:", e);
		return "";
	}
}

/**
 * Provide OAuth token, target folder, and optional developer key for the Google Drive Picker UI.
 */
export function getPickerConfig(): PickerConfig {
	let oauthToken = "";
	try {
		oauthToken = ScriptApp.getOAuthToken();
	} catch (e) {
		console.warn("Could not retrieve OAuth token for Drive Picker:", e);
	}

	const folderId = getReceiptsFolderId();
	let developerKey = "";
	try {
		developerKey = PropertiesService.getScriptProperties().getProperty("DEVELOPER_KEY") || "";
	} catch {
		// ignore
	}

	return {
		oauthToken,
		folderId: folderId || undefined,
		developerKey: developerKey || undefined,
		appId: "714475522924",
	};
}

/**
 * Upload a receipt file (image/PDF) directly into the configured Google Drive Receipts folder.
 * Returns the created Drive fileId, fileName, and view URL.
 */
export function uploadReceiptToDrive(input: UploadReceiptInput): {
	fileId: string;
	fileName: string;
	fileUrl: string;
} {
	try {
		const parsed = UploadReceiptInputSchema.parse(input);
		const folderId = getReceiptsFolderId();
		let folder: GoogleAppsScript.Drive.Folder;

		if (folderId) {
			try {
				folder = DriveApp.getFolderById(folderId);
			} catch (e) {
				console.warn("Folder ID tidak valid atau tidak dapat diakses, menggunakan root Drive:", e);
				folder = DriveApp.getRootFolder();
			}
		} else {
			folder = DriveApp.getRootFolder();
		}

		const decodedBytes = Utilities.base64Decode(parsed.base64Data);
		const blob = Utilities.newBlob(decodedBytes, parsed.mimeType, parsed.fileName);
		const file = folder.createFile(blob);

		try {
			file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
		} catch {
			// Ignore if organization policy restricts public links
		}

		return {
			fileId: file.getId(),
			fileName: file.getName(),
			fileUrl: file.getUrl(),
		};
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes("Permission denied while enabling APIs: drive")) {
			throw new Error(
				"Google Drive API belum diaktifkan pada Google Cloud Project 714475522924. Aktifkan Drive API di Google Cloud Console, atau gunakan tombol 'Tempel Link Drive'.",
				{ cause: err },
			);
		}
		throw err;
	}
}

/**
 * Extract Google Drive file ID from a URL.
 */
function extractDriveFileId(url: string): string | null {
	if (!url) return null;
	const match = url.match(/[-\w]{25,}/);
	return match ? match[0] : null;
}

/**
 * Format a cashflow data row to match the historical sheet styling:
 * - Yellow background (#ffff00)
 * - Poppins 11pt font
 * - Solid black borders
 * - Currency format ([$Rp]#,##0) on columns D, E, F
 */
function formatCashRow(sheet: GoogleAppsScript.Spreadsheet.Sheet, row: number): void {
	const rowRange = sheet.getRange(row, 1, 1, 7);
	rowRange.setBackground("#ffff00");
	rowRange.setFontFamily("Poppins").setFontSize(11);
	rowRange.setBorder(
		true,
		true,
		true,
		true,
		true,
		true,
		"#000000",
		SpreadsheetApp.BorderStyle.SOLID,
	);
	sheet.getRange(row, 4, 1, 3).setNumberFormat("[$Rp]#,##0");
}

/**
 * Write Column G (Ket) as an authentic Google Drive Smart Chip using Google Sheets API v4.
 * Gracefully falls back to a standard RichText hyperlink if the API call is unavailable.
 */
function setCellSmartChip(
	sheet: GoogleAppsScript.Spreadsheet.Sheet,
	row: number,
	fileUrl?: string,
	displayText?: string,
	notesText?: string,
): void {
	const cell = sheet.getRange(row, 7);

	if (!fileUrl) {
		cell.setValue(notesText || "");
		return;
	}

	const fileId = extractDriveFileId(fileUrl);
	let chipApplied = false;

	if (fileId) {
		try {
			const driveUri = `https://drive.google.com/open?id=${fileId}`;
			const spreadsheetId = sheet.getParent().getId();
			const sheetId = sheet.getSheetId();
			const rowIdx = row - 1; // 0-based row index for Google Sheets API

			const payload = {
				requests: [
					{
						updateCells: {
							rows: [
								{
									values: [
										{
											userEnteredValue: {
												stringValue: "@",
											},
											chipRuns: [
												{
													startIndex: 0,
													chip: {
														richLinkProperties: {
															uri: driveUri,
														},
													},
												},
											],
											userEnteredFormat: {
												backgroundColor: {
													red: 1,
													green: 1,
													blue: 0,
												},
												borders: {
													top: { style: "SOLID", width: 1, color: {} },
													bottom: { style: "SOLID", width: 1, color: {} },
													left: { style: "SOLID", width: 1, color: {} },
													right: { style: "SOLID", width: 1, color: {} },
												},
												textFormat: {
													fontFamily: "Poppins",
													fontSize: 11,
												},
											},
										},
									],
								},
							],
							range: {
								sheetId,
								startRowIndex: rowIdx,
								endRowIndex: rowIdx + 1,
								startColumnIndex: 6,
								endColumnIndex: 7,
							},
							fields: "userEnteredValue,chipRuns,userEnteredFormat",
						},
					},
				],
			};

			const response = UrlFetchApp.fetch(
				`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
				{
					method: "post",
					contentType: "application/json",
					headers: {
						Authorization: `Bearer ${ScriptApp.getOAuthToken()}`,
					},
					payload: JSON.stringify(payload),
					muteHttpExceptions: true,
				},
			);

			if (response.getResponseCode() === 200) {
				chipApplied = true;
			} else {
				console.warn(
					"batchUpdate smart chip returned status",
					response.getResponseCode(),
					response.getContentText(),
				);
			}
		} catch (err) {
			console.warn("Failed to create Smart Chip via Sheets API:", err);
		}
	}

	// Fallback to rich text hyperlink if chip couldn't be applied
	if (!chipApplied) {
		const text = displayText || notesText || "Lampiran Drive";
		const richText = SpreadsheetApp.newRichTextValue().setText(text).setLinkUrl(fileUrl).build();
		cell.setRichTextValue(richText);
	}
}

/**
 * Read all cash transactions from the spreadsheet.
 */
export function getCashTransactions(): CashTransactionItem[] {
	const sheet = getCashSheet();
	const lastRow = sheet.getLastRow();

	if (lastRow < CASH_DATA_START_ROW_INDEX) {
		return [];
	}

	const numRows = lastRow - CASH_DATA_START_ROW_INDEX + 1;
	const dataRange = sheet.getRange(CASH_DATA_START_ROW_INDEX, 1, numRows, 7);
	const values = dataRange.getValues();
	const richTextValues = dataRange.getRichTextValues();

	// Fetch chipRuns for Column G via Sheets API v4 to resolve Google Drive Smart Chips
	const chipUrlsByRow = new Map<number, string>();
	try {
		const spreadsheetId = sheet.getParent().getId();
		const sheetName = sheet.getName();
		const res = UrlFetchApp.fetch(
			`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?ranges=${encodeURIComponent(sheetName)}!G4:G${lastRow}&fields=sheets.data.rowData.values(chipRuns)`,
			{
				headers: {
					Authorization: `Bearer ${ScriptApp.getOAuthToken()}`,
				},
				muteHttpExceptions: true,
			},
		);
		if (res.getResponseCode() === 200) {
			const data = JSON.parse(res.getContentText());
			const rowData = data.sheets?.[0]?.data?.[0]?.rowData || [];
			for (let r = 0; r < rowData.length; r++) {
				const chipUri = rowData[r]?.values?.[0]?.chipRuns?.[0]?.chip?.richLinkProperties?.uri;
				if (chipUri) {
					chipUrlsByRow.set(r + 4, chipUri);
				}
			}
		}
	} catch (e) {
		console.warn("Could not batch-fetch chipRuns:", e);
	}

	const items: CashTransactionItem[] = [];

	for (let i = 0; i < values.length; i++) {
		const row = values[i];
		const rowIdx = CASH_DATA_START_ROW_INDEX + i;

		const rawDate = row[0];
		let dateStr = "";
		if (rawDate instanceof Date) {
			dateStr = Utilities.formatDate(rawDate, Session.getScriptTimeZone(), "dd/MM/yy");
		} else if (rawDate) {
			dateStr = String(rawDate).trim();
		}

		const description = String(row[1] || "").trim();
		const category = String(row[2] || "").trim();
		const cashIn = parseRp(row[3]);
		const cashOut = parseRp(row[4]);
		const balance = parseRp(row[5]);

		// Skip row if completely empty
		if (!dateStr && !description && !category && cashIn === 0 && cashOut === 0) {
			continue;
		}

		// Parse Column G (Ket) rich text / smart chip
		const richText = richTextValues[i] ? richTextValues[i][6] : null;
		const notes = richText ? richText.getText() : String(row[6] || "").trim();
		let attachmentUrl = chipUrlsByRow.get(rowIdx) || "";

		if (!attachmentUrl && richText) {
			attachmentUrl = richText.getLinkUrl() || "";
			if (!attachmentUrl && richText.getRuns) {
				const runs = richText.getRuns();
				for (let r = 0; r < runs.length; r++) {
					const u = runs[r].getLinkUrl();
					if (u) {
						attachmentUrl = u;
						break;
					}
				}
			}
		}

		// If no rich text URL, check if notes itself is a valid URL
		if (!attachmentUrl && notes && /^https?:\/\//i.test(notes)) {
			attachmentUrl = notes;
		}

		let attachmentType: "pdf" | "image" | "file" | undefined = undefined;
		if (attachmentUrl || notes) {
			const combined = `${attachmentUrl} ${notes}`.toLowerCase();
			if (combined.includes(".pdf")) {
				attachmentType = "pdf";
			} else if (
				combined.includes(".jpg") ||
				combined.includes(".jpeg") ||
				combined.includes(".png") ||
				combined.includes(".webp")
			) {
				attachmentType = "image";
			} else if (attachmentUrl) {
				attachmentType = "file";
			}
		}

		const type: "IN" | "OUT" = cashIn > 0 && cashOut === 0 ? "IN" : "OUT";
		const amount = type === "IN" ? cashIn : cashOut;

		items.push({
			rowIdx,
			date: dateStr,
			description,
			category,
			type,
			amount,
			cashIn,
			cashOut,
			balance,
			notes,
			attachmentUrl: attachmentUrl || undefined,
			attachmentType,
		});
	}

	return items;
}

/**
 * Append a new cash transaction row.
 * Guarantees running balance formula integrity `=F{row-1}+D{row}-E{row}`.
 */
export function appendCashTransaction(input: CashTransactionCreateInput): CashTransactionItem {
	return withDocumentLock(() => {
		const parsed = CashTransactionCreateSchema.parse(input);
		const sheet = getCashSheet();
		const targetRow = Math.max(sheet.getLastRow() + 1, CASH_DATA_START_ROW_INDEX);

		const cashIn = parsed.type === "IN" ? parsed.amount : 0;
		const cashOut = parsed.type === "OUT" ? parsed.amount : 0;

		// 1. Set A..C values (Tanggal, Keterangan, Kategori)
		sheet
			.getRange(targetRow, 1, 1, 3)
			.setValues([[parsed.date, parsed.description, parsed.category]]);

		// 2. Set Uang Masuk (Col D) & Uang Keluar (Col E)
		// Explicitly clear the non-applicable column so it remains completely empty ({}) rather than zero
		if (parsed.type === "IN") {
			sheet.getRange(targetRow, 4).setValue(parsed.amount);
			sheet.getRange(targetRow, 5).clearContent();
		} else {
			sheet.getRange(targetRow, 4).clearContent();
			sheet.getRange(targetRow, 5).setValue(parsed.amount);
		}

		// 3. Set Column F (Sisa) running balance formula
		const balanceFormula =
			targetRow === CASH_DATA_START_ROW_INDEX
				? "=D4-E4"
				: `=F${targetRow - 1}+D${targetRow}-E${targetRow}`;
		sheet.getRange(targetRow, 6).setFormula(balanceFormula);

		// 4. Set Column G (Ket) with Smart Chip or notes
		setCellSmartChip(sheet, targetRow, parsed.fileUrl, parsed.fileName, parsed.notes);

		// 5. Format row styling (yellow #ffff00 background, black borders, Poppins 11pt, currency format)
		formatCashRow(sheet, targetRow);

		SpreadsheetApp.flush();

		const balance = parseRp(sheet.getRange(targetRow, 6).getValue());

		let attachmentType: "pdf" | "image" | "file" | undefined = undefined;
		if (parsed.fileUrl) {
			const combined = `${parsed.fileUrl} ${parsed.fileName || ""}`.toLowerCase();
			if (combined.includes(".pdf")) attachmentType = "pdf";
			else if (
				combined.includes(".jpg") ||
				combined.includes(".jpeg") ||
				combined.includes(".png") ||
				combined.includes(".webp")
			)
				attachmentType = "image";
			else attachmentType = "file";
		}

		return {
			rowIdx: targetRow,
			date: parsed.date,
			description: parsed.description,
			category: parsed.category,
			type: parsed.type,
			amount: parsed.amount,
			cashIn,
			cashOut,
			balance,
			notes: parsed.fileName || parsed.notes || "",
			attachmentUrl: parsed.fileUrl,
			attachmentType,
		};
	});
}

/**
 * Update an existing cash transaction row.
 */
export function updateCashTransaction(input: CashTransactionUpdateInput): CashTransactionItem {
	return withDocumentLock(() => {
		const parsed = CashTransactionUpdateSchema.parse(input);
		const sheet = getCashSheet();
		const lastRow = sheet.getLastRow();

		if (parsed.rowIdx < CASH_DATA_START_ROW_INDEX || parsed.rowIdx > lastRow) {
			throw new Error(`Baris transaksi #${parsed.rowIdx} tidak ditemukan dalam sheet.`);
		}

		const targetRow = parsed.rowIdx;
		const cashIn = parsed.type === "IN" ? parsed.amount : 0;
		const cashOut = parsed.type === "OUT" ? parsed.amount : 0;

		// 1. Update A..C values
		sheet
			.getRange(targetRow, 1, 1, 3)
			.setValues([[parsed.date, parsed.description, parsed.category]]);

		// 2. Update Uang Masuk (Col D) & Uang Keluar (Col E)
		// Explicitly clear the non-applicable column so it remains completely empty ({}) rather than zero
		if (parsed.type === "IN") {
			sheet.getRange(targetRow, 4).setValue(parsed.amount);
			sheet.getRange(targetRow, 5).clearContent();
		} else {
			sheet.getRange(targetRow, 4).clearContent();
			sheet.getRange(targetRow, 5).setValue(parsed.amount);
		}

		// 3. Ensure running balance formula on F
		const balanceFormula =
			targetRow === CASH_DATA_START_ROW_INDEX
				? "=D4-E4"
				: `=F${targetRow - 1}+D${targetRow}-E${targetRow}`;
		sheet.getRange(targetRow, 6).setFormula(balanceFormula);

		// 3. Update Column G (Ket)
		let finalNotes = parsed.notes || "";
		let finalUrl = parsed.fileUrl || "";

		if (parsed.preserveAttachment) {
			// Read existing Col G to return in the response
			const existingRich = sheet.getRange(targetRow, 7).getRichTextValue();
			if (existingRich) {
				finalNotes = existingRich.getText();
				finalUrl = existingRich.getLinkUrl() || "";
			}
			if (!finalUrl) {
				const existingId = extractDriveFileId(finalNotes);
				if (existingId) {
					finalUrl = `https://drive.google.com/open?id=${existingId}`;
				}
			}
		} else {
			setCellSmartChip(sheet, targetRow, parsed.fileUrl, parsed.fileName, parsed.notes);
			finalNotes = parsed.fileName || parsed.notes || "";
			finalUrl = parsed.fileUrl || "";
		}

		// 4. Format row styling
		formatCashRow(sheet, targetRow);

		SpreadsheetApp.flush();

		const balance = parseRp(sheet.getRange(targetRow, 6).getValue());

		let attachmentType: "pdf" | "image" | "file" | undefined = undefined;
		if (finalUrl || finalNotes) {
			const combined = `${finalUrl} ${finalNotes}`.toLowerCase();
			if (combined.includes(".pdf")) attachmentType = "pdf";
			else if (
				combined.includes(".jpg") ||
				combined.includes(".jpeg") ||
				combined.includes(".png") ||
				combined.includes(".webp")
			)
				attachmentType = "image";
			else if (finalUrl) attachmentType = "file";
		}

		return {
			rowIdx: targetRow,
			date: parsed.date,
			description: parsed.description,
			category: parsed.category,
			type: parsed.type,
			amount: parsed.amount,
			cashIn,
			cashOut,
			balance,
			notes: finalNotes,
			attachmentUrl: finalUrl || undefined,
			attachmentType,
		};
	});
}

/**
 * Delete a cash transaction row.
 * Automatically repairs downstream balance formulas to prevent #REF! corruption.
 */
export function deleteCashTransaction(rowIdx: number): { success: boolean; deletedRow: number } {
	return withDocumentLock(() => {
		const sheet = getCashSheet();
		const lastRow = sheet.getLastRow();

		if (rowIdx < CASH_DATA_START_ROW_INDEX || rowIdx > lastRow) {
			throw new Error(`Baris transaksi #${rowIdx} tidak valid untuk dihapus.`);
		}

		// Delete the target row
		sheet.deleteRow(rowIdx);

		// Repair formulas on downstream rows to guarantee continuous balance calculation
		const newLastRow = sheet.getLastRow();
		if (newLastRow >= CASH_DATA_START_ROW_INDEX) {
			const startRepairRow = Math.min(rowIdx, newLastRow);
			const numToRepair = newLastRow - startRepairRow + 1;

			if (numToRepair > 0) {
				const formulas: string[][] = [];
				for (let r = startRepairRow; r <= newLastRow; r++) {
					if (r === CASH_DATA_START_ROW_INDEX) {
						formulas.push(["=D4-E4"]);
					} else {
						formulas.push([`=F${r - 1}+D${r}-E${r}`]);
					}
				}
				sheet.getRange(startRepairRow, 6, numToRepair, 1).setFormulas(formulas);
			}
		}

		SpreadsheetApp.flush();
		return { success: true, deletedRow: rowIdx };
	});
}
