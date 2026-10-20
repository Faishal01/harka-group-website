import IconBadgeCheck from "~icons/lucide/badge-check";
import IconClipboardList from "~icons/lucide/clipboard-list";
import IconClock from "~icons/lucide/clock";
import IconCoins from "~icons/lucide/coins";
import { formatCompactRp, formatRp, TransactionItem } from "../../shared/schema";

interface StatsCardsProps {
	transactions: TransactionItem[];
}

export function StatsCards({ transactions }: StatsCardsProps) {
	const totalTransactions = transactions.length;

	const totalSales = transactions.reduce((acc, t) => acc + (t.sellingPrice || 0), 0);

	const totalPending = transactions.reduce((acc, t) => {
		if (t.status === "BELUM LUNAS") {
			return (
				acc +
				(t.remainingBalance != null ? t.remainingBalance : t.sellingPrice - (t.downPayment ?? 0))
			);
		}
		return acc;
	}, 0);

	const lunasCount = transactions.filter((t) => t.status === "LUNAS").length;
	const belumLunasCount = totalTransactions - lunasCount;
	const lunasPercent =
		totalTransactions > 0 ? Math.round((lunasCount / totalTransactions) * 100) : 0;

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
			{/* Total Transaksi */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Total Transaksi
					</p>
					<h3 className="text-2xl font-bold text-slate-900 mt-1">{totalTransactions}</h3>
					<p className="text-xs text-slate-400 mt-0.5">Unit mobil terjual</p>
				</div>
				<div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
					<IconClipboardList className="w-6 h-6" />
				</div>
			</div>

			{/* Total Penjualan */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Total Penjualan
					</p>
					<h3
						className="text-2xl font-bold text-slate-900 mt-1 tracking-tight"
						title={formatRp(totalSales)}
					>
						{formatCompactRp(totalSales)}
					</h3>
					<div className="flex flex-wrap items-center gap-1.5 mt-0.5">
						<span className="text-xs font-medium text-slate-600 font-mono">
							{formatRp(totalSales)}
						</span>
						<span className="text-slate-300">•</span>
						<span className="text-xs text-emerald-600 font-medium">Omzet kotor</span>
					</div>
				</div>
				<div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
					<IconCoins className="w-6 h-6" />
				</div>
			</div>

			{/* Sisa Piutang */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Piutang / Sisa
					</p>
					<h3
						className="text-2xl font-bold text-amber-600 mt-1 tracking-tight"
						title={formatRp(totalPending)}
					>
						{formatCompactRp(totalPending)}
					</h3>
					<div className="flex flex-wrap items-center gap-1.5 mt-0.5">
						<span className="text-xs font-medium text-slate-600 font-mono">
							{formatRp(totalPending)}
						</span>
						<span className="text-slate-300">•</span>
						<span className="text-xs text-amber-600 font-medium">
							{belumLunasCount} belum lunas
						</span>
					</div>
				</div>
				<div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
					<IconClock className="w-6 h-6" />
				</div>
			</div>

			{/* Status Pelunasan */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Status Pelunasan
					</p>
					<div className="flex items-baseline gap-2 mt-1">
						<h3 className="text-2xl font-bold text-slate-900">{lunasPercent}%</h3>
						<span className="text-xs text-slate-500">
							({lunasCount}/{totalTransactions})
						</span>
					</div>
					<div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
						<div
							className="bg-emerald-500 h-full rounded-full transition-all duration-500"
							style={{ width: `${lunasPercent}%` }}
						/>
					</div>
				</div>
				<div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
					<IconBadgeCheck className="w-6 h-6" />
				</div>
			</div>
		</div>
	);
}
