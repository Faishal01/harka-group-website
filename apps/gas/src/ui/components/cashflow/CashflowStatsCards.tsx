import { useMemo } from "preact/hooks";
import IconArrowDownLeft from "~icons/lucide/arrow-down-left";
import IconArrowUpRight from "~icons/lucide/arrow-up-right";
import IconReceipt from "~icons/lucide/receipt";
import IconWallet from "~icons/lucide/wallet";
import { CashTransactionItem, formatCompactRp, formatRp } from "../../../shared/schema";

interface CashflowStatsCardsProps {
	allItems: CashTransactionItem[];
}

export function CashflowStatsCards({ allItems }: CashflowStatsCardsProps) {
	// Current total cash balance is the latest recorded balance in the sheet
	const currentBalance = allItems.length > 0 ? allItems[allItems.length - 1].balance : 0;

	// Calculate cumulative all-time metrics across the entire cash ledger
	const { totalExpense, totalIncome, expenseCount, incomeCount } = useMemo(() => {
		let expense = 0;
		let income = 0;
		let expCount = 0;
		let incCount = 0;

		for (const item of allItems) {
			if (item.cashOut > 0) {
				expense += item.cashOut;
				expCount++;
			}
			if (item.cashIn > 0) {
				income += item.cashIn;
				incCount++;
			}
		}

		return {
			totalExpense: expense,
			totalIncome: income,
			expenseCount: expCount,
			incomeCount: incCount,
		};
	}, [allItems]);

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
			{/* 1. Sisa Saldo Kas */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Sisa Saldo Kas
					</p>
					<h3
						className="text-2xl font-bold text-slate-900 mt-1 tracking-tight"
						title={formatRp(currentBalance)}
					>
						{formatCompactRp(currentBalance)}
					</h3>
					<div className="flex flex-wrap items-center gap-1.5 mt-0.5">
						<span
							className={`text-xs font-medium font-mono ${
								currentBalance >= 0 ? "text-slate-600" : "text-rose-600"
							}`}
						>
							{formatRp(currentBalance)}
						</span>
						<span className="text-slate-300">•</span>
						<span className="text-xs text-emerald-600 font-medium">Saldo riil saat ini</span>
					</div>
				</div>
				<div
					className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
						currentBalance >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
					}`}
				>
					<IconWallet className="w-6 h-6" />
				</div>
			</div>

			{/* 2. Total Pengeluaran (Akumulasi) */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Total Pengeluaran (Akumulasi)
					</p>
					<h3
						className="text-2xl font-bold text-rose-600 mt-1 tracking-tight"
						title={formatRp(totalExpense)}
					>
						{formatCompactRp(totalExpense)}
					</h3>
					<div className="flex flex-wrap items-center gap-1.5 mt-0.5">
						<span className="text-xs font-medium text-slate-600 font-mono">
							{formatRp(totalExpense)}
						</span>
						<span className="text-slate-300">•</span>
						<span className="text-xs text-slate-400 font-medium">{expenseCount} transaksi</span>
					</div>
				</div>
				<div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
					<IconArrowUpRight className="w-6 h-6" />
				</div>
			</div>

			{/* 3. Total Pemasukan (Akumulasi) */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Total Pemasukan (Akumulasi)
					</p>
					<h3
						className="text-2xl font-bold text-emerald-600 mt-1 tracking-tight"
						title={formatRp(totalIncome)}
					>
						{formatCompactRp(totalIncome)}
					</h3>
					<div className="flex flex-wrap items-center gap-1.5 mt-0.5">
						<span className="text-xs font-medium text-slate-600 font-mono">
							{formatRp(totalIncome)}
						</span>
						<span className="text-slate-300">•</span>
						<span className="text-xs text-slate-400 font-medium">{incomeCount} transaksi</span>
					</div>
				</div>
				<div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
					<IconArrowDownLeft className="w-6 h-6" />
				</div>
			</div>

			{/* 4. Total Transaksi (Akumulasi) */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Total Transaksi Kas
					</p>
					<h3 className="text-2xl font-bold text-slate-900 mt-1">{allItems.length}</h3>
					<p className="text-xs text-slate-400 mt-0.5">
						{expenseCount} Keluar • {incomeCount} Masuk (Akumulasi)
					</p>
				</div>
				<div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
					<IconReceipt className="w-6 h-6" />
				</div>
			</div>
		</div>
	);
}
