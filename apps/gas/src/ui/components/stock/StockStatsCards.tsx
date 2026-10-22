import { useMemo } from "preact/hooks";
import IconBadgeCheck from "~icons/lucide/badge-check";
import IconCar from "~icons/lucide/car";
import IconClock from "~icons/lucide/clock";
import IconTag from "~icons/lucide/tag";
import { StockCarItem } from "../../../shared/schema";

interface StockStatsCardsProps {
	stocks: StockCarItem[];
}

export function StockStatsCards({ stocks }: StockStatsCardsProps) {
	const stats = useMemo(() => {
		const totalUnits = stocks.length;
		const readyUnits = stocks.filter((s) => s.status === "Ready").length;
		const dpUnits = stocks.filter((s) => s.status === "Ter-DP").length;
		const soldUnits = stocks.filter((s) => s.status === "Sold").length;
		const readyPercent = totalUnits > 0 ? Math.round((readyUnits / totalUnits) * 100) : 0;

		return {
			totalUnits,
			readyUnits,
			dpUnits,
			soldUnits,
			readyPercent,
		};
	}, [stocks]);

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
			{/* Total Unit */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Total Unit
					</p>
					<h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalUnits}</h3>
					<p className="text-xs text-slate-400 mt-0.5">Semua unit di database</p>
				</div>
				<div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
					<IconCar className="w-6 h-6" />
				</div>
			</div>

			{/* Unit Ready */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Unit Ready
					</p>
					<h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.readyUnits}</h3>
					<div className="flex items-center gap-1.5 mt-0.5">
						<span className="text-xs font-medium text-emerald-600">{stats.readyPercent}%</span>
						<span className="text-slate-300">•</span>
						<span className="text-xs text-slate-400">Siap dipasarkan</span>
					</div>
				</div>
				<div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
					<IconBadgeCheck className="w-6 h-6" />
				</div>
			</div>

			{/* Unit Ter-DP */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Unit Ter-DP
					</p>
					<h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.dpUnits}</h3>
					<p className="text-xs text-slate-400 mt-0.5">Proses transaksi & DP</p>
				</div>
				<div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
					<IconClock className="w-6 h-6" />
				</div>
			</div>

			{/* Unit Terjual */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Unit Terjual
					</p>
					<h3 className="text-2xl font-bold text-indigo-600 mt-1">{stats.soldUnits}</h3>
					<p className="text-xs text-slate-400 mt-0.5">Tuntas serah terima</p>
				</div>
				<div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
					<IconTag className="w-6 h-6" />
				</div>
			</div>
		</div>
	);
}
