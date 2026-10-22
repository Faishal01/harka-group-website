import IconBadgeCheck from "~icons/lucide/badge-check";
import IconCar from "~icons/lucide/car";
import IconCoins from "~icons/lucide/coins";
import IconCreditCard from "~icons/lucide/credit-card";
import IconTag from "~icons/lucide/tag";
import IconTrendingUp from "~icons/lucide/trending-up";
import IconWallet from "~icons/lucide/wallet";
import IconWrench from "~icons/lucide/wrench";
import { formatCompactRp, formatRp } from "../../../shared/schema";

export interface DashboardStatsData {
	grossProfit: number;
	netProfit: number;
	totalRevenue: number;
	totalCapitalCost: number;
	totalServiceExpense: number;
	acquiredCount: number;
	readyCount: number;
	soldCount: number;
}

interface ExecutiveStatsCardsProps {
	stats: DashboardStatsData;
}

export function ExecutiveStatsCards({ stats }: ExecutiveStatsCardsProps) {
	const totalCost = stats.totalCapitalCost + stats.totalServiceExpense;
	const roiPercent = totalCost > 0 ? ((stats.netProfit / totalCost) * 100).toFixed(1) : "0.0";
	const isProfitPositive = stats.netProfit >= 0;

	return (
		<div className="space-y-3.5 mb-5">
			{/* Row 1: Financial Performance (4 Cards) */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
				{/* 1. Total Laba Kotor */}
				<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
					<div className="min-w-0 flex-1">
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
							Total Laba Kotor
						</p>
						<h3
							className="text-2xl font-bold text-slate-900 mt-1 tracking-tight"
							title={formatRp(stats.grossProfit)}
						>
							{formatCompactRp(stats.grossProfit)}
						</h3>
						<p className="text-xs font-medium text-slate-600 font-mono mt-0.5">
							{formatRp(stats.grossProfit)}
						</p>
						<p className="text-xs text-slate-400 mt-0.5">Omzet - Modal</p>
					</div>
					<div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
						<IconTrendingUp className="w-6 h-6" />
					</div>
				</div>

				{/* 2. Laba Bersih */}
				<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
					<div className="min-w-0 flex-1">
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
							Laba Bersih
						</p>
						<h3
							className={`text-2xl font-bold mt-1 tracking-tight ${
								isProfitPositive ? "text-emerald-600" : "text-rose-600"
							}`}
							title={formatRp(stats.netProfit)}
						>
							{isProfitPositive ? "+" : ""}
							{formatCompactRp(stats.netProfit)}
						</h3>
						<p
							className={`text-xs font-medium font-mono mt-0.5 ${
								isProfitPositive ? "text-emerald-600" : "text-rose-600"
							}`}
						>
							{isProfitPositive ? "+" : ""}
							{formatRp(stats.netProfit)}
						</p>
						<p className="text-xs text-slate-400 mt-0.5">
							<span
								className={`font-semibold ${
									isProfitPositive ? "text-emerald-600" : "text-rose-600"
								}`}
							>
								{isProfitPositive ? "+" : ""}
								{roiPercent}% ROI
							</span>{" "}
							• Net profit
						</p>
					</div>
					<div
						className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
							isProfitPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
						}`}
					>
						<IconCoins className="w-6 h-6" />
					</div>
				</div>

				{/* 3. OMSET */}
				<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
					<div className="min-w-0 flex-1">
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
							Omset Penjualan
						</p>
						<h3
							className="text-2xl font-bold text-slate-900 mt-1 tracking-tight"
							title={formatRp(stats.totalRevenue)}
						>
							{formatCompactRp(stats.totalRevenue)}
						</h3>
						<p className="text-xs font-medium text-slate-600 font-mono mt-0.5">
							{formatRp(stats.totalRevenue)}
						</p>
						<p className="text-xs text-slate-400 mt-0.5">{stats.soldCount} unit terjual</p>
					</div>
					<div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
						<IconCreditCard className="w-6 h-6" />
					</div>
				</div>

				{/* 4. Total Modal */}
				<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
					<div className="min-w-0 flex-1">
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
							Total Modal Beli
						</p>
						<h3
							className="text-2xl font-bold text-slate-900 mt-1 tracking-tight"
							title={formatRp(stats.totalCapitalCost)}
						>
							{formatCompactRp(stats.totalCapitalCost)}
						</h3>
						<p className="text-xs font-medium text-slate-600 font-mono mt-0.5">
							{formatRp(stats.totalCapitalCost)}
						</p>
						<p className="text-xs text-slate-400 mt-0.5">Modal unit terjual</p>
					</div>
					<div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
						<IconWallet className="w-6 h-6" />
					</div>
				</div>
			</div>

			{/* Row 2: Operational Expenses & Unit Inventory Volumes (4 Cards) */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
				{/* 5. Total Pengeluaran */}
				<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
					<div className="min-w-0 flex-1">
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
							Total Pengeluaran Service
						</p>
						<h3
							className="text-2xl font-bold text-slate-900 mt-1 tracking-tight"
							title={formatRp(stats.totalServiceExpense)}
						>
							{formatCompactRp(stats.totalServiceExpense)}
						</h3>
						<p className="text-xs text-slate-400 mt-0.5">Biaya perbaikan & rekondisi</p>
					</div>
					<div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
						<IconWrench className="w-6 h-6" />
					</div>
				</div>

				{/* 6. Unit Dibeli */}
				<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
					<div className="min-w-0 flex-1">
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
							Unit Dibeli
						</p>
						<h3 className="text-2xl font-bold text-blue-600 mt-1">{stats.acquiredCount}</h3>
						<p className="text-xs text-slate-400 mt-0.5">Unit terdata di periode ini</p>
					</div>
					<div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
						<IconCar className="w-6 h-6" />
					</div>
				</div>

				{/* 7. Unit Tersedia */}
				<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
					<div className="min-w-0 flex-1">
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
							Unit Tersedia
						</p>
						<h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.readyCount}</h3>
						<p className="text-xs text-slate-400 mt-0.5">Stok ready di showroom</p>
					</div>
					<div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
						<IconBadgeCheck className="w-6 h-6" />
					</div>
				</div>

				{/* 8. Unit Terjual */}
				<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
					<div className="min-w-0 flex-1">
						<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
							Unit Terjual
						</p>
						<h3 className="text-2xl font-bold text-indigo-600 mt-1">{stats.soldCount}</h3>
						<p className="text-xs text-slate-400 mt-0.5">Tuntas serah terima</p>
					</div>
					<div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
						<IconTag className="w-6 h-6" />
					</div>
				</div>
			</div>
		</div>
	);
}
