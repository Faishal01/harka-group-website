import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { interestRate } from "~/data/config";
import { getPrice } from "~/utils/helpers";

export const server = {
	getMonthlyInstallment: defineAction({
		accept: "form",
		input: z.object({
			amount: z.number(),
			duration: z.number(),
			finalinstallment: z.number().optional(),
		}),
		handler: async ({ amount, duration, finalinstallment }) => {
			if (amount <= 0) {
				throw new Error("Loan amount must be greater than 0.");
			}

			if (duration <= 0) {
				throw new Error("Loan duration must be greater than 0.");
			}

			if (finalinstallment && finalinstallment >= amount) {
				throw new Error("Final installment must be lower than the loan amount.");
			}

			if (!interestRate) {
				throw new Error("Interest rate is not set.");
			}

			const monthlyInterestRate = interestRate / 100 / 12;
			const principal = amount - (finalinstallment || 0);
			const monthlyInstallment =
				(principal * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -duration));
			const totalPayment = monthlyInstallment * duration + (finalinstallment || 0);

			const formattedMonthlyInstallment = getPrice(monthlyInstallment);
			const formattedTotalPayment = getPrice(totalPayment);

			return {
				monthlyInstallment: formattedMonthlyInstallment,
				totalPayment: formattedTotalPayment,
				interestRate,
			};
		},
	}),
};
