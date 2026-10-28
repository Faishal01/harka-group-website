import IconPlus from "~icons/lucide/plus";
import IconRefreshCw from "~icons/lucide/refresh-cw";
import IconSearch from "~icons/lucide/search";

interface ExpenditureFiltersBarProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	onAddNew: () => void;
	onRefresh: () => void;
	isLoading: boolean;
}

export function ExpenditureFiltersBar({
	searchQuery,
	onSearchChange,
	onAddNew,
	onRefresh,
	isLoading,
}: ExpenditureFiltersBarProps) {
	return (
		<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm mb-4">
			<div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
				{/* Search Bar */}
				<div className="relative flex-1">
					<IconSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
					<input
						type="text"
						value={searchQuery}
						onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
						placeholder="Cari mobil, plat, atau perbaikan..."
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
						<span>Tambah Unit</span>
					</button>
				</div>
			</div>
		</div>
	);
}
