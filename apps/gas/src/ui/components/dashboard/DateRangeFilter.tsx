import { useMemo } from "preact/hooks";
import IconRefreshCw from "~icons/lucide/refresh-cw";
import { ddmmyyToIsoDate, isoDateToDdmmyy } from "../../../shared/schema";
import { CustomSelect } from "../CustomSelect";
import { DatePicker } from "../DatePicker";

interface DateRangeFilterProps {
	startDate: string; // YYYY-MM-DD
	endDate: string; // YYYY-MM-DD
	onChange: (start: string, end: string) => void;
	onRefresh: () => void;
	isLoading: boolean;
}

export function DateRangeFilter({
	startDate,
	endDate,
	onChange,
	onRefresh,
	isLoading,
}: DateRangeFilterProps) {
	// Generate exactly the last 24 months descending from current month
	const monthsList = useMemo(() => {
		const list: { label: string; value: string; start: string; end: string }[] = [];
		const now = new Date();
		const curYear = now.getFullYear();
		const curMonth = now.getMonth();

		const monthNames = [
			"Januari",
			"Februari",
			"Maret",
			"April",
			"Mei",
			"Juni",
			"Juli",
			"Agustus",
			"September",
			"Oktober",
			"November",
			"Desember",
		];

		for (let i = 0; i < 24; i++) {
			const targetDate = new Date(curYear, curMonth - i, 1);
			const y = targetDate.getFullYear();
			const m = targetDate.getMonth();
			const mStr = String(m + 1).padStart(2, "0");
			const lastDay = new Date(y, m + 1, 0).getDate();
			const start = `${y}-${mStr}-01`;
			const end = `${y}-${mStr}-${String(lastDay).padStart(2, "0")}`;
			list.push({
				label: `${monthNames[m]} ${y}`,
				value: `${y}-${mStr}`,
				start,
				end,
			});
		}
		return list;
	}, []);

	// Active month if current startDate and endDate match a full month in the list
	const activeMonthValue = useMemo(() => {
		const match = monthsList.find((m) => m.start === startDate && m.end === endDate);
		return match ? match.value : "";
	}, [startDate, endDate, monthsList]);

	const handleMonthSelect = (val: string) => {
		if (!val) {
			onChange("", "");
			return;
		}
		const found = monthsList.find((m) => m.value === val);
		if (found) {
			onChange(found.start, found.end);
		}
	};

	// Preset handlers
	const handlePreset = (
		preset: "ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "THIS_YEAR",
	) => {
		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth(); // 0-indexed

		const formatYmd = (d: Date) => {
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, "0");
			const day = String(d.getDate()).padStart(2, "0");
			return `${y}-${m}-${day}`;
		};

		if (preset === "ALL") {
			onChange("", "");
			return;
		}

		if (preset === "THIS_MONTH") {
			const firstDay = new Date(currentYear, currentMonth, 1);
			const lastDay = new Date(currentYear, currentMonth + 1, 0);
			onChange(formatYmd(firstDay), formatYmd(lastDay));
			return;
		}

		if (preset === "LAST_MONTH") {
			const firstDay = new Date(currentYear, currentMonth - 1, 1);
			const lastDay = new Date(currentYear, currentMonth, 0);
			onChange(formatYmd(firstDay), formatYmd(lastDay));
			return;
		}

		if (preset === "THIS_QUARTER") {
			const quarterIdx = Math.floor(currentMonth / 3);
			const firstDay = new Date(currentYear, quarterIdx * 3, 1);
			const lastDay = new Date(currentYear, (quarterIdx + 1) * 3, 0);
			onChange(formatYmd(firstDay), formatYmd(lastDay));
			return;
		}

		if (preset === "THIS_YEAR") {
			const firstDay = new Date(currentYear, 0, 1);
			const lastDay = new Date(currentYear, 11, 31);
			onChange(formatYmd(firstDay), formatYmd(lastDay));
			return;
		}
	};

	return (
		<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm mb-4 space-y-3">
			<div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
				{/* Title & Description */}
				<div>
					<h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
						<span>DASHBOARD UTAMA</span>
						<span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
							Laporan Keuntungan
						</span>
					</h2>
					<p className="text-xs text-slate-500 mt-0.5">
						Analisis finansial, arus kas unit terjual, dan ringkasan laba rugi showroom
					</p>
				</div>

				{/* Primary Refresh Button */}
				<div className="flex items-center gap-2 self-end md:self-auto shrink-0">
					<button
						onClick={onRefresh}
						disabled={isLoading}
						type="button"
						title="Muat ulang data dari Google Sheet"
						className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
					>
						<IconRefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
						<span>Refresh Data</span>
					</button>
				</div>
			</div>

			{/* Filter Section: 2 Structured Rows (Pilihan Cepat & Rentang Kustom) */}
			<div className="pt-2.5 border-t border-slate-100 space-y-2.5">
				{/* Baris 1: Pilihan Cepat (Bulan dropdown + Presets pill) */}
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider min-w-[54px]">
						Periode:
					</span>

					{/* Month Selector via Custom Popover */}
					<div className="w-44 sm:w-48">
						<CustomSelect
							value={activeMonthValue}
							onChange={handleMonthSelect}
							options={[
								{ label: "Pilih Bulan...", value: "" },
								...monthsList.map((m) => ({ label: m.label, value: m.value })),
							]}
							headerTitle="24 Bulan Terakhir"
							placeholder="Pilih Bulan..."
							size="sm"
							menuWidth="w-48 sm:w-52"
						/>
					</div>

					<span className="text-[11px] font-semibold text-slate-300 mx-0.5 hidden sm:inline">
						|
					</span>

					<div className="flex flex-wrap items-center gap-1.5">
						<button
							type="button"
							onClick={() => handlePreset("THIS_MONTH")}
							className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
						>
							Bulan Ini
						</button>
						<button
							type="button"
							onClick={() => handlePreset("LAST_MONTH")}
							className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
						>
							Bulan Lalu
						</button>
						<button
							type="button"
							onClick={() => handlePreset("THIS_QUARTER")}
							className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
						>
							Kuartal Ini
						</button>
						<button
							type="button"
							onClick={() => handlePreset("THIS_YEAR")}
							className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
						>
							Tahun Ini
						</button>
						<button
							type="button"
							onClick={() => handlePreset("ALL")}
							className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
						>
							Semua
						</button>
					</div>
				</div>

				{/* Baris 2: Rentang Tanggal Kustom (Dari & Sampai + Reset halus) */}
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider min-w-[54px]">
						Kustom:
					</span>

					<div className="flex flex-wrap items-center gap-2">
						<div className="flex items-center gap-1.5">
							<label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
								Dari:
							</label>
							<div className="w-36 sm:w-40">
								<DatePicker
									value={isoDateToDdmmyy(startDate)}
									onChange={(dStr) => onChange(ddmmyyToIsoDate(dStr), endDate)}
									placeholder="Dari Tanggal"
									size="sm"
								/>
							</div>
						</div>

						<div className="flex items-center gap-1.5">
							<label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
								Sampai:
							</label>
							<div className="w-36 sm:w-40">
								<DatePicker
									value={isoDateToDdmmyy(endDate)}
									onChange={(dStr) => onChange(startDate, ddmmyyToIsoDate(dStr))}
									placeholder="Sampai Tanggal"
									size="sm"
									align="left"
								/>
							</div>
						</div>

						{/* Reset Button (tetap ada di DOM agar tidak terjadi layout shift) */}
						<button
							type="button"
							disabled={!startDate && !endDate}
							onClick={() => onChange("", "")}
							className={`text-xs font-medium px-2 py-1 rounded-lg transition-all ml-1 ${
								startDate || endDate
									? "text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer opacity-100"
									: "text-slate-300 cursor-not-allowed opacity-0 pointer-events-none"
							}`}
							title={startDate || endDate ? "Reset filter tanggal" : ""}
						>
							Reset Tanggal
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
