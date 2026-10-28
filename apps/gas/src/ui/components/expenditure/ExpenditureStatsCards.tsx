import { useMemo } from "preact/hooks";
import IconCalculator from "~icons/lucide/calculator";
import IconCar from "~icons/lucide/car";
import IconTrendingUp from "~icons/lucide/trending-up";
import IconWrench from "~icons/lucide/wrench";
import { formatCompactRp, formatRp, VehicleExpenditureItem } from "../../../shared/schema";

interface ExpenditureStatsCardsProps {
	expenditures: VehicleExpenditureItem[];
}

export function ExpenditureStatsCards({ expenditures }: ExpenditureStatsCardsProps) {
	const totalUnits = expenditures.length;
	const totalExpenditure = expenditures.reduce((acc, v) => acc + (v.totalCost || 0), 0);
	const averageCost = totalUnits > 0 ? Math.round(totalExpenditure / totalUnits) : 0;

	// Aggregate top 5 repair items by total spent with continuous HSL heatmap (Red 0% -> Yellow 45%)
	const topRepairItems = useMemo(() => {
		const map = new Map<string, { description: string; totalCost: number; count: number }>();

		for (const v of expenditures) {
			for (const r of v.repairs) {
				const desc = (r.description || "").trim();
				if (!desc || r.cost <= 0) continue;
				const key = desc.toUpperCase();
				const existing = map.get(key) || { description: desc, totalCost: 0, count: 0 };
				existing.totalCost += r.cost;
				existing.count += 1;
				map.set(key, existing);
			}
		}

		return Array.from(map.values())
			.sort((a, b) => b.totalCost - a.totalCost)
			.slice(0, 5)
			.map((item) => {
				const percent = totalExpenditure > 0 ? (item.totalCost / totalExpenditure) * 100 : 0;
				// Absolute ceiling: 30%+ is pure Red (Hue 0), 0% is Yellow (Hue 45)
				const ratio = Math.min(1, Math.max(0, percent / 30));
				const hue = Math.round(45 - ratio * 45);
				return {
					...item,
					percent,
					hue,
				};
			});
	}, [expenditures, totalExpenditure]);

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
			{/* 1. Total Pengeluaran */}
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

			{/* 2. Unit Diperbaiki */}
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

			{/* 3. Rata-rata Biaya per Unit */}
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

			{/* 4. Top 5 Jenis Perbaikan */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-start">
				<div className="flex items-center justify-between mb-1.5">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Top 5 Perbaikan
					</p>
					<IconTrendingUp className="w-3.5 h-3.5 text-purple-500" />
				</div>

				{topRepairItems.length > 0 ? (
					<div className="flex flex-wrap gap-1">
						{topRepairItems.map((item) => (
							<span
								key={item.description}
								style={{
									backgroundColor: `hsl(${item.hue}, 92%, 96%)`,
									borderColor: `hsl(${item.hue}, 80%, 82%)`,
									color: `hsl(${item.hue}, 95%, 26%)`,
								}}
								className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded border transition-opacity hover:opacity-85 select-none shadow-2xs"
								title={`${item.description}: ${formatRp(item.totalCost)} (${item.percent.toFixed(1)}% dari total pengeluaran • ${item.count} tindakan)`}
							>
								<span className="truncate max-w-[100px]">{item.description}</span>
								<span
									style={{ color: `hsl(${item.hue}, 85%, 36%)` }}
									className="font-mono font-semibold text-[9px]"
								>
									{formatCompactRp(item.totalCost)}
								</span>
							</span>
						))}
					</div>
				) : (
					<p className="text-xs text-slate-400 mt-1">Belum ada item perbaikan</p>
				)}
			</div>
		</div>
	);
}
