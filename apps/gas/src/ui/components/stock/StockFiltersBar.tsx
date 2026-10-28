import IconPlus from "~icons/lucide/plus";
import IconRefreshCw from "~icons/lucide/refresh-cw";
import IconRotateCcw from "~icons/lucide/rotate-ccw";
import IconSearch from "~icons/lucide/search";
import { StockCarItem } from "../../../shared/schema";
import { StockFilterState } from "../../types";
import { Select } from "../Select";

interface StockFiltersBarProps {
	filters: StockFilterState;
	onChange: (filters: StockFilterState) => void;
	stocks: StockCarItem[];
	onAddNew: () => void;
	onRefresh: () => void;
	isLoading: boolean;
}

export function StockFiltersBar({
	filters,
	onChange,
	stocks,
	onAddNew,
	onRefresh,
	isLoading,
}: StockFiltersBarProps) {
	// Extract unique vehicle makes
	const makes = Array.from(new Set(stocks.map((s) => s.make).filter(Boolean))).sort();

	const handleReset = () => {
		onChange({
			...filters,
			searchQuery: "",
			status: "ALL",
			make: "ALL",
		});
	};

	const hasActiveFilters =
		filters.searchQuery !== "" || filters.status !== "ALL" || filters.make !== "ALL";

	return (
		<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm mb-4 space-y-3">
			<div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
				{/* Search Bar */}
				<div className="relative flex-1">
					<IconSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
					<input
						type="text"
						value={filters.searchQuery}
						onInput={(e) =>
							onChange({
								...filters,
								searchQuery: (e.target as HTMLInputElement).value,
							})
						}
						placeholder="Cari mobil, plat, merek, dokumen..."
						className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
					/>
				</div>

				{/* Primary Action Buttons */}
				<div className="flex items-center gap-2">
					<button
						onClick={onRefresh}
						disabled={isLoading}
						type="button"
						title="Muat ulang data dari Google Sheet"
						className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
					>
						<IconRefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
						<span>Refresh</span>
					</button>

					<button
						onClick={onAddNew}
						type="button"
						className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
					>
						<IconPlus className="w-4 h-4" />
						<span>Tambah Unit Stok</span>
					</button>
				</div>
			</div>

			{/* Filters Row */}
			<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
				{/* Status Filter */}
				<div>
					<label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
						Status
					</label>
					<Select
						value={filters.status}
						onChange={(e) =>
							onChange({
								...filters,
								status: (e.target as HTMLSelectElement).value,
							})
						}
						className="px-2.5 py-1.5"
					>
						<option value="ALL">Semua Status</option>
						<option value="Ready">Ready (Tersedia)</option>
						<option value="Ter-DP">Ter-DP (Booking)</option>
						<option value="Sold">Sold (Terjual)</option>
					</Select>
				</div>

				{/* Make / Merek Filter */}
				<div>
					<label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
						Merek
					</label>
					<Select
						value={filters.make}
						onChange={(e) =>
							onChange({
								...filters,
								make: (e.target as HTMLSelectElement).value,
							})
						}
						className="px-2.5 py-1.5"
					>
						<option value="ALL">Semua Merek</option>
						{makes.map((m) => (
							<option key={m} value={m}>
								{m}
							</option>
						))}
					</Select>
				</div>

				{/* Reset Button */}
				<div className="flex items-end">
					{hasActiveFilters && (
						<button
							onClick={handleReset}
							type="button"
							className="w-full px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
						>
							<IconRotateCcw className="w-3.5 h-3.5 text-slate-500" />
							<span>Reset Filter</span>
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
