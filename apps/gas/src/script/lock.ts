/**
 * Executes a callback within an exclusive Google Apps Script document lock.
 * Automatically commits pending changes with SpreadsheetApp.flush() before releasing lock.
 */
export function withDocumentLock<T>(action: () => T, timeoutMs = 30000): T {
	const lock = LockService.getDocumentLock();
	const hasLock = lock.tryLock(timeoutMs);
	if (!hasLock) {
		throw new Error(
			"Spreadsheet sedang sibuk memproses permintaan lain. Silakan coba beberapa detik lagi.",
		);
	}
	try {
		const result = action();
		SpreadsheetApp.flush(); // Commit all pending writes immediately
		return result;
	} finally {
		lock.releaseLock();
	}
}
