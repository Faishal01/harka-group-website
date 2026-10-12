import { Effect } from "effect";
import type { TradeInSubmission } from "@harka/db";

export const notifyTradeInSubmission = (
	submission: TradeInSubmission,
	webhookUrl?: string,
) =>
	Effect.gen(function* () {
		yield* Effect.sync(() => {
			console.log(
				`[Trade-In Submission] New inquiry from ${submission.customerName} (${submission.customerPhone}) for ${submission.year} ${submission.make} ${submission.model} - Asking: Rp ${submission.sellingPrice.toLocaleString("id-ID")}`,
			);
		});

		if (webhookUrl) {
			yield* Effect.tryPromise({
				try: () =>
					fetch(webhookUrl, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							event: "trade_in_submission",
							data: submission,
						}),
					}),
				catch: (err) => {
					console.error("Webhook notification failed:", err);
				},
			}).pipe(Effect.ignoreLogged);
		}
	});
