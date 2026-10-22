/**
 * Main Google Apps Script entry point.
 * Sets up spreadsheet menus, dialogs, and re-exports sheet modules.
 */

declare const __APP_VERSION__: string;

export function onOpen() {
	SpreadsheetApp.getUi().createMenu("Harka Group").addItem("Dashboard", "openDialog").addToUi();
}

export function openDialog() {
	const html = HtmlService.createHtmlOutputFromFile("Index")
		.setWidth(1200)
		.setHeight(850)
		.addMetaTag("viewport", "width=device-width, initial-scale=1")
		.setTitle(`Harka Dashboard ${__APP_VERSION__}`);

	SpreadsheetApp.getUi().showModalDialog(html, `Harka Dashboard ${__APP_VERSION__}`);
}

// Re-export sheet operations
export * from "./transaction";
export * from "./expenditure";
export * from "./stock";
