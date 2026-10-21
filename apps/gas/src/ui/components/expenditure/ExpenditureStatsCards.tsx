import IconCalculator from "~icons/lucide/calculator";
import IconCar from "~icons/lucide/car";
import IconWrench from "~icons/lucide/wrench";
import { formatCompactRp, formatRp, VehicleExpenditureItem } from "../../../shared/schema";

interface ExpenditureStatsCardsProps {
	expenditures: VehicleExpenditureItem[];
}

export function ExpenditureStatsCards({ expenditures }: ExpenditureStatsCardsProps) {
	const totalUnits = expenditures.length;
	const totalExpenditure = expenditures.reduce((acc, v) => acc + (v.totalCost || 0), 0);
	const averageCost = totalUnits > 0 ? Math.round(totalExpenditure / totalUnits) : 0;

	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
			{/* Total Pengeluaran */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Total Pengeluaran
					</p>
					<h3
						className="text-2xl font-bold text-slate-900 mt-1 tracking-tight"
						title={formatRp(totalExpenditure)}
					>
						{formatCompactRp(totalExpenditure)}
					</h3>
					<div className="flex flex-wrap items-center gap-1.5 mt-0.5">
						<span className="text-xs font-medium text-slate-600 font-mono">
							{formatRp(totalExpenditure)}
						</span>
					</div>
				</div>
				<div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
					<IconWrench className="w-6 h-6" />
				</div>
			</div>

			{/* Unit Diperbaiki */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Unit Diperbaiki
					</p>
					<h3 className="text-2xl font-bold text-slate-900 mt-1">{totalUnits}</h3>
					<p className="text-xs text-slate-400 mt-0.5">Mobil tercatat rekondisi</p>
				</div>
				<div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
					<IconCar className="w-6 h-6" />
				</div>
			</div>

			{/* Rata-rata Biaya per Unit */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Rata-rata per Unit
					</p>
					<h3
						className="text-2xl font-bold text-slate-900 mt-1 tracking-tight"
						title={formatRp(averageCost)}
					>
						{formatCompactRp(averageCost)}
					</h3>
					<div className="flex flex-wrap items-center gap-1.5 mt-0.5">
						<span className="text-xs font-medium text-slate-600 font-mono">
							{formatRp(averageCost)} / mobil
						</span>
					</div>
				</div>
				<div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
					<IconCalculator className="w-6 h-6" />
				</div>
			</div>
		</div>
	);
}
