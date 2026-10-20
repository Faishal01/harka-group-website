/**
 * Main Google Apps Script entry point.
 * Sets up spreadsheet menus, dialogs, and re-exports sheet modules.
 */

export function onOpen() {
	SpreadsheetApp.getUi()
		.createMenu("Harka Dashboard")
		.addItem("Open Dashboard", "openDialog")
		.addToUi();
}

export function openDialog() {
	const html = HtmlService.createHtmlOutputFromFile("Index")
		.setWidth(1200)
		.setHeight(850)
		.addMetaTag("viewport", "width=device-width, initial-scale=1")
		.setTitle("Harka Dashboard");

	SpreadsheetApp.getUi().showModalDialog(html, "Harka Dashboard");
}

// Re-export TRANSAKSI sheet operations
export * from "./transaction";
