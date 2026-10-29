import { useMemo } from "preact/hooks";
import IconPlus from "~icons/lucide/plus";
import IconRefreshCw from "~icons/lucide/refresh-cw";
import IconRotateCcw from "~icons/lucide/rotate-ccw";
import IconSearch from "~icons/lucide/search";
import { CashFilterState, CashTransactionItem, parseDateMonthYear } from "../../../shared/schema";
import { CustomSelect, CustomSelectOption } from "../CustomSelect";
import { Select } from "../Select";

interface CashflowFiltersBarProps {
	filters: CashFilterState;
	onChange: (newFilters: CashFilterState) => void;
	items: CashTransactionItem[];
	onAddNew: () => void;
	onRefresh: () => void;
	isLoading: boolean;
}

export function CashflowFiltersBar({
	filters,
	onChange,
	items,
	onAddNew,
	onRefresh,
	isLoading,
}: CashflowFiltersBarProps) {
	// Extract unique months sorted in descending order
	const monthOptions: CustomSelectOption[] = useMemo(() => {
		const map = new Map<string, { label: string; year: number; month: number }>();
		for (const it of items) {
			const parsed = parseDateMonthYear(it.date);
			if (parsed && !map.has(parsed.key)) {
				map.set(parsed.key, {
					label: parsed.label,
					year: parsed.year,
					month: parsed.month,
				});
			}
		}
		const sorted = Array.from(map.entries()).sort((a, b) => {
			return b[1].year !== a[1].year ? b[1].year - a[1].year : b[1].month - a[1].month;
		});
		return [
			{ label: "Semua Bulan", value: "ALL" },
			...sorted.map(([key, val]) => ({
				label: val.label,
				value: key,
			})),
		];
	}, [items]);

	// Extract unique categories
	const categories = useMemo(() => {
		const set = new Set<string>();
		for (const it of items) {
			if (it.category?.trim()) {
				set.add(it.category.trim());
			}
		}
		return Array.from(set).sort();
	}, [items]);

	const handleReset = () => {
		onChange({
			searchQuery: "",
			month: "ALL",
			category: "ALL",
			type: "ALL",
			sortBy: "date",
			sortDirection: "desc",
		});
	};

	const hasActiveFilters =
		filters.searchQuery !== "" ||
		filters.month !== "ALL" ||
		filters.category !== "ALL" ||
		filters.type !== "ALL";

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
							onChange({ ...filters, searchQuery: (e.target as HTMLInputElement).value })
						}
						placeholder="Cari keterangan, mobil/plat, kategori, atau catatan..."
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
						<span>Tambah Transaksi Kas</span>
					</button>
				</div>
			</div>

			{/* Filters Row */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
				{/* Bulan Filter */}
				<div>
					<label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
						Bulan
					</label>
					<CustomSelect
						value={filters.month}
						onChange={(val) => onChange({ ...filters, month: val })}
						options={monthOptions}
						placeholder="Semua Bulan"
						size="sm"
						menuWidth="w-52 sm:w-56"
					/>
				</div>

				{/* Jenis Filter */}
				<div>
					<label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
						Jenis Transaksi
					</label>
					<Select
						value={filters.type}
						onChange={(e) =>
							onChange({
								...filters,
								type: (e.target as HTMLSelectElement).value as "ALL" | "IN" | "OUT",
							})
						}
						className="px-2.5 py-1.5"
					>
						<option value="ALL">Semua Jenis</option>
						<option value="OUT">Pengeluaran (Kas Keluar)</option>
						<option value="IN">Pemasukan (Kas Masuk)</option>
					</Select>
				</div>

				{/* Kategori Filter */}
				<div>
					<label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
						Kategori
					</label>
					<Select
						value={filters.category}
						onChange={(e) =>
							onChange({ ...filters, category: (e.target as HTMLSelectElement).value })
						}
						className="px-2.5 py-1.5"
					>
						<option value="ALL">Semua Kategori</option>
						{categories.map((c) => (
							<option key={c} value={c}>
								{c}
							</option>
						))}
					</Select>
				</div>

				{/* Reset Button */}
				<div className="flex items-end">
					<button
						onClick={handleReset}
						disabled={!hasActiveFilters}
						type="button"
						className={`w-full py-1.5 px-3 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
							hasActiveFilters
								? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
								: "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
						}`}
					>
						<IconRotateCcw className="w-3.5 h-3.5" />
						<span>Reset Filter</span>
					</button>
				</div>
			</div>
		</div>
	);
}
