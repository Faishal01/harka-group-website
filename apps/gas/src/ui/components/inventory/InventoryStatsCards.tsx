import { useMemo } from "preact/hooks";
import IconAlertCircle from "~icons/lucide/alert-circle";
import IconAlertTriangle from "~icons/lucide/alert-triangle";
import IconPackage from "~icons/lucide/package";
import { InventoryItem } from "../../../shared/schema";

interface InventoryStatsCardsProps {
	items: InventoryItem[];
}

export function InventoryStatsCards({ items }: InventoryStatsCardsProps) {
	const stats = useMemo(() => {
		const totalItems = items.length;
		const restockItems = items.filter((item) => item.status === "PERLU RESTOCK");
		const outOfStockItems = items.filter((item) => item.tersedia <= 0);
		const restockCount = restockItems.length;
		const outOfStockCount = outOfStockItems.length;
		const amanCount = items.filter((item) => item.status === "AMAN" && item.tersedia > 0).length;

		return {
			totalItems,
			restockCount,
			outOfStockCount,
			amanCount,
		};
	}, [items]);

	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
			{/* 1. Total Jenis Barang */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Total Jenis Barang
					</p>
					<h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalItems}</h3>
					<div className="flex items-center gap-1.5 mt-0.5">
						<span className="text-xs font-medium text-emerald-600">{stats.amanCount} Aman</span>
						<span className="text-slate-300">•</span>
						<span className="text-xs text-slate-400">Tercatat di sistem</span>
					</div>
				</div>
				<div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
					<IconPackage className="w-6 h-6" />
				</div>
			</div>

			{/* 2. Perlu Restock */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Perlu Restock
					</p>
					<h3
						className={`text-2xl font-bold mt-1 ${
							stats.restockCount > 0 ? "text-amber-600" : "text-slate-900"
						}`}
					>
						{stats.restockCount}
					</h3>
					<div className="flex items-center gap-1.5 mt-0.5">
						<span className="text-xs font-medium text-amber-600">
							{stats.totalItems > 0
								? `${Math.round((stats.restockCount / stats.totalItems) * 100)}%`
								: "0%"}
						</span>
						<span className="text-slate-300">•</span>
						<span className="text-xs text-slate-400">Mencapai batas minimum</span>
					</div>
				</div>
				<div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
					<IconAlertTriangle className="w-6 h-6" />
				</div>
			</div>

			{/* 3. Stok Habis (0 Unit) */}
			<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
						Stok Habis (0 Unit)
					</p>
					<h3
						className={`text-2xl font-bold mt-1 ${
							stats.outOfStockCount > 0 ? "text-rose-600" : "text-slate-900"
						}`}
					>
						{stats.outOfStockCount}
					</h3>
					<div className="flex items-center gap-1.5 mt-0.5">
						<span className="text-xs font-medium text-rose-600">
							{stats.outOfStockCount > 0 ? "Segera pesan" : "Semua ada stok"}
						</span>
						<span className="text-slate-300">•</span>
						<span className="text-xs text-slate-400">Tersedia = 0</span>
					</div>
				</div>
				<div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
					<IconAlertCircle className="w-6 h-6" />
				</div>
			</div>
		</div>
	);
}
