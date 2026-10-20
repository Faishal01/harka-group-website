import { TRANSACTION_CATEGORIES, TRANSACTION_STATUSES, TransactionItem } from "../../shared/schema";
import { FilterState } from "../types";

interface FiltersBarProps {
	filters: FilterState;
	onChange: (newFilters: FilterState) => void;
	transactions: TransactionItem[];
	onAddNew: () => void;
	onRefresh: () => void;
	isLoading: boolean;
}

export function FiltersBar({
	filters,
	onChange,
	transactions,
	onAddNew,
	onRefresh,
	isLoading,
}: FiltersBarProps) {
	// Extract unique months (MM/YY)
	const months = Array.from(
		new Set(
			transactions
				.map((t) => {
					if (!t.transactionDate || !t.transactionDate.includes("/")) return null;
					const parts = t.transactionDate.split("/");
					if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
					return null;
				})
				.filter(Boolean) as string[],
		),
	).sort();

	// Extract unique sales
	const salesList = Array.from(
		new Set(transactions.map((t) => t.salesPerson?.trim()).filter(Boolean)),
	).sort();

	const handleReset = () => {
		onChange({
			searchQuery: "",
			month: "ALL",
			status: "ALL",
			category: "ALL",
			salesPerson: "ALL",
			sortBy: "no",
			sortDirection: "desc",
		});
	};

	const hasActiveFilters =
		filters.searchQuery !== "" ||
		filters.month !== "ALL" ||
		filters.status !== "ALL" ||
		filters.category !== "ALL" ||
		filters.salesPerson !== "ALL";

	return (
		<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm mb-4 space-y-3">
			<div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
				{/* Search Bar */}
				<div className="relative flex-1">
					<svg
						className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<input
						type="text"
						value={filters.searchQuery}
						onInput={(e) =>
							onChange({ ...filters, searchQuery: (e.target as HTMLInputElement).value })
						}
						placeholder="Cari mobil, plat, pembeli, telpon, sales..."
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
						<svg
							className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
						<span>Refresh</span>
					</button>

					<button
						onClick={onAddNew}
						type="button"
						className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
						</svg>
						<span>Tambah Transaksi</span>
					</button>
				</div>
			</div>

			{/* Filters Row */}
			<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
				{/* Bulan Filter */}
				<div>
					<label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
						Bulan
					</label>
					<select
						value={filters.month}
						onChange={(e) =>
							onChange({ ...filters, month: (e.target as HTMLSelectElement).value })
						}
						className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
					>
						<option value="ALL">Semua Bulan</option>
						{months.map((m) => (
							<option key={m} value={m}>
								{m}
							</option>
						))}
					</select>
				</div>

				{/* Status Filter */}
				<div>
					<label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
						Status
					</label>
					<select
						value={filters.status}
						onChange={(e) =>
							onChange({ ...filters, status: (e.target as HTMLSelectElement).value })
						}
						className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
					>
						<option value="ALL">Semua Status</option>
						{TRANSACTION_STATUSES.map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
				</div>

				{/* Kategori Filter */}
				<div>
					<label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
						Kategori
					</label>
					<select
						value={filters.category}
						onChange={(e) =>
							onChange({ ...filters, category: (e.target as HTMLSelectElement).value })
						}
						className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
					>
						<option value="ALL">Semua Kategori</option>
						{TRANSACTION_CATEGORIES.map((c) => (
							<option key={c} value={c}>
								{c}
							</option>
						))}
					</select>
				</div>

				{/* Sales Filter */}
				<div>
					<label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
						Sales / Marketing
					</label>
					<select
						value={filters.salesPerson}
						onChange={(e) =>
							onChange({ ...filters, salesPerson: (e.target as HTMLSelectElement).value })
						}
						className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
					>
						<option value="ALL">Semua Sales</option>
						{salesList.map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
				</div>

				{/* Reset Button */}
				<div className="flex items-end">
					{hasActiveFilters && (
						<button
							onClick={handleReset}
							type="button"
							className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-center"
						>
							Reset Filter
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
