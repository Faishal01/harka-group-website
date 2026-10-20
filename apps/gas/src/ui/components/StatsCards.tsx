import { formatRp, TransactionItem } from "../../shared/schema";

interface StatsCardsProps {
	transactions: TransactionItem[];
}

export function StatsCards({ transactions }: StatsCardsProps) {
	const totalTransactions = transactions.length;

	const totalSales = transactions.reduce((acc, t) => acc + (t.sellingPrice || 0), 0);

	const totalPending = transactions.reduce((acc, t) => {
		if (t.status === "BELUM LUNAS") {
			return acc + (t.remainingBalance != null ? t.remainingBalance : t.sellingPrice - (t.downPayment ?? 0));
		}
		return acc;
	}, 0);

	const lunasCount = transactions.filter((t) => t.status === "LUNAS").length;
	const belumLunasCount = totalTransactions - lunasCount;
	const lunasPercent = totalTransactions > 0 ? Math.round((lunasCount / totalTransactions) * 100) : 0;

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
			{/* Total Transaksi */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
				<div>
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Transaksi</p>
					<h3 className="text-2xl font-bold text-slate-900 mt-1">{totalTransactions}</h3>
					<p className="text-xs text-slate-400 mt-0.5">Unit mobil terjual</p>
				</div>
				<div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
					<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
				</div>
			</div>

			{/* Total Penjualan */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
				<div>
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Penjualan</p>
					<h3 className="text-xl font-bold text-slate-900 mt-1 truncate max-w-[170px]" title={formatRp(totalSales)}>
						{formatRp(totalSales)}
					</h3>
					<p className="text-xs text-emerald-600 font-medium mt-0.5">Omzet kotor</p>
				</div>
				<div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
					<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
			</div>

			{/* Sisa Piutang */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
				<div>
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Piutang / Sisa</p>
					<h3
						className="text-xl font-bold text-amber-600 mt-1 truncate max-w-[170px]"
						title={formatRp(totalPending)}
					>
						{formatRp(totalPending)}
					</h3>
					<p className="text-xs text-amber-600/80 font-medium mt-0.5">{belumLunasCount} transaksi belum lunas</p>
				</div>
				<div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
					<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
			</div>

			{/* Status Pelunasan */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
				<div>
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Pelunasan</p>
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
				<div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
					<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
			</div>
		</div>
	);
}
