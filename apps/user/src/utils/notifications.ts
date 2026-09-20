import type { TradeInSubmission } from "@harka/db";

/**
 * Extensible notification hook for new trade-in submissions.
 * Prepared for future webhook dispatch (e.g. Telegram, Discord, CRM webhook).
 */
export async function notifyTradeInSubmission(
	submission: TradeInSubmission,
	_env?: unknown,
): Promise<void> {
	// Future implementation: if (_env?.TRADE_IN_WEBHOOK_URL) { await fetch(...) }
	console.log(
		`[Trade-In Submission] New inquiry from ${submission.customerName} (${submission.customerPhone}) for ${submission.year} ${submission.make} ${submission.model} - Asking: Rp ${submission.sellingPrice.toLocaleString("id-ID")}`,
	);
}
