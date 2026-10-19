export function onOpen() {
	SpreadsheetApp.getUi().createMenu("Harka Dasboard").addItem("Open", "openDialog").addToUi();
}

export function openDialog() {
	var html = HtmlService.createHtmlOutputFromFile("Index");
	SpreadsheetApp.getUi().showModalDialog(html, "Dialog title");
}
