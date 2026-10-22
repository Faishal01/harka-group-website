import {
	BarController,
	BarElement,
	CategoryScale,
	Chart,
	Legend,
	LinearScale,
	Tooltip,
} from "chart.js";
import { useEffect, useMemo, useRef } from "preact/hooks";
import IconTrendingUp from "~icons/lucide/trending-up";
import {
	formatCompactRp,
	formatRp,
	parseDateUniversal,
	StockCarItem,
} from "../../../shared/schema";

// Register Chart.js components once
Chart.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend);

export interface IncomeExpenseBucket {
	key: string;
	label: string; // "1-7 Okt" or "Agu 26"
	fullLabel: string; // "Minggu 1 (1 - 7 Oktober 2026)" or "Agustus 2026"
	startIso: string;
	endIso: string;
	revenue: number; // Pemasukan (Omzet)
	expense: number; // Pengeluaran (Modal + Service)
	profit: number; // Laba Bersih
	count: number;
}

interface IncomeExpenseChartProps {
	stocks: StockCarItem[];
	startDate?: string;
	endDate?: string;
}

const SHORT_MONTH_NAMES = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"Mei",
	"Jun",
	"Jul",
	"Agu",
	"Sep",
	"Okt",
	"Nov",
	"Des",
];

const FULL_MONTH_NAMES = [
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

function getDaysDiff(startIso: string, endIso: string): number {
	const d1 = new Date(startIso);
	const d2 = new Date(endIso);
	if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
	return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function generateWeeklyBuckets(startIso: string, endIso: string): IncomeExpenseBucket[] {
	const buckets: IncomeExpenseBucket[] = [];
	const startDate = new Date(startIso);
	const endDate = new Date(endIso);

	const toIso = (d: Date) => {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${y}-${m}-${day}`;
	};

	let currStart = new Date(startDate);
	let weekNum = 1;

	while (currStart <= endDate) {
		const currEnd = new Date(currStart);
		currEnd.setDate(currEnd.getDate() + 6);
		if (currEnd > endDate) {
			currEnd.setTime(endDate.getTime());
		}

		const startStr = toIso(currStart);
		const endStr = toIso(currEnd);

		const startDay = currStart.getDate();
		const endDay = currEnd.getDate();
		const monthIdx = currEnd.getMonth();
		const year = currEnd.getFullYear();

		const shortMonth = SHORT_MONTH_NAMES[monthIdx];
		const fullMonth = FULL_MONTH_NAMES[monthIdx];

		const label = `${startDay}-${endDay} ${shortMonth}`;
		const fullLabel = `Minggu ${weekNum} (${startDay} - ${endDay} ${fullMonth} ${year})`;

		buckets.push({
			key: `${startStr}_${endStr}`,
			label,
			fullLabel,
			startIso: startStr,
			endIso: endStr,
			revenue: 0,
			expense: 0,
			profit: 0,
			count: 0,
		});

		const nextStart = new Date(currEnd);
		nextStart.setDate(nextStart.getDate() + 1);
		currStart = nextStart;
		weekNum += 1;
	}

	return buckets;
}

function generateMonthlyBuckets(
	startIso?: string,
	endIso?: string,
	soldCars: StockCarItem[] = [],
): IncomeExpenseBucket[] {
	const buckets: IncomeExpenseBucket[] = [];

	let startY: number;
	let startM: number;
	let endY: number;
	let endM: number;

	if (startIso && endIso) {
		const sDate = new Date(startIso);
		const eDate = new Date(endIso);
		startY = sDate.getFullYear();
		startM = sDate.getMonth();
		endY = eDate.getFullYear();
		endM = eDate.getMonth();
	} else if (startIso) {
		const sDate = new Date(startIso);
		startY = sDate.getFullYear();
		startM = sDate.getMonth();
		const now = new Date();
		endY = now.getFullYear();
		endM = now.getMonth();
	} else if (endIso) {
		const eDate = new Date(endIso);
		endY = eDate.getFullYear();
		endM = eDate.getMonth();
		const sDate = new Date(endY, endM - 11, 1);
		startY = sDate.getFullYear();
		startM = sDate.getMonth();
	} else {
		// "Semua": derive from soldCars or rolling 12 months up to latest
		const dates = soldCars
			.map((c) => parseDateUniversal(c.soldDate))
			.filter((p): p is NonNullable<typeof p> => p !== null);

		if (dates.length === 0) {
			const now = new Date();
			startY = now.getFullYear();
			startM = now.getMonth();
			endY = startY;
			endM = startM;
		} else {
			const sorted = dates.sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
			const first = sorted[0];
			const last = sorted[sorted.length - 1];

			if (last.year * 12 + last.month - (first.year * 12 + first.month) >= 12) {
				endY = last.year;
				endM = last.month;
				const sDate = new Date(endY, endM - 11, 1);
				startY = sDate.getFullYear();
				startM = sDate.getMonth();
			} else {
				startY = first.year;
				startM = first.month;
				endY = last.year;
				endM = last.month;
			}
		}
	}

	let currY = startY;
	let currM = startM;

	while (currY < endY || (currY === endY && currM <= endM)) {
		const key = `${currY}-${String(currM + 1).padStart(2, "0")}`;
		const lastDay = new Date(currY, currM + 1, 0).getDate();
		const startIsoStr = `${currY}-${String(currM + 1).padStart(2, "0")}-01`;
		const endIsoStr = `${currY}-${String(currM + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

		buckets.push({
			key,
			label: `${SHORT_MONTH_NAMES[currM]} ${String(currY).slice(-2)}`,
			fullLabel: `${FULL_MONTH_NAMES[currM]} ${currY}`,
			startIso: startIsoStr,
			endIso: endIsoStr,
			revenue: 0,
			expense: 0,
			profit: 0,
			count: 0,
		});

		currM++;
		if (currM > 11) {
			currM = 0;
			currY++;
		}
	}

	return buckets;
}

export function IncomeExpenseChart({ stocks, startDate, endDate }: IncomeExpenseChartProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const chartInstanceRef = useRef<Chart | null>(null);

	// Adaptive buckets and granularity mode
	const { buckets, granularityMode } = useMemo(() => {
		const soldCars = stocks.filter((s) => s.status === "Sold" && s.soldDate);

		let mode: "weekly" | "monthly" = "monthly";

		if (startDate && endDate) {
			const diffDays = getDaysDiff(startDate, endDate);
			if (diffDays <= 31) {
				mode = "weekly";
			}
		}

		const generatedBuckets: IncomeExpenseBucket[] =
			mode === "weekly"
				? generateWeeklyBuckets(startDate!, endDate!)
				: generateMonthlyBuckets(startDate, endDate, soldCars);

		// Aggregate car data into matching buckets
		for (const car of soldCars) {
			const parsed = parseDateUniversal(car.soldDate);
			if (!parsed) continue;

			if (startDate && parsed.iso < startDate) continue;
			if (endDate && parsed.iso > endDate) continue;

			const bucket = generatedBuckets.find(
				(b) => parsed.iso >= b.startIso && parsed.iso <= b.endIso,
			);

			if (bucket) {
				const revenue = car.sellingPrice || 0;
				const expense = (car.capitalCost || 0) + (car.serviceExpense || 0);
				bucket.revenue += revenue;
				bucket.expense += expense;
				bucket.count += 1;
			}
		}

		for (const b of generatedBuckets) {
			b.profit = b.revenue - b.expense;
		}

		return { buckets: generatedBuckets, granularityMode: mode };
	}, [stocks, startDate, endDate]);

	const totalWindowRevenue = useMemo(() => {
		return buckets.reduce((acc, d) => acc + d.revenue, 0);
	}, [buckets]);

	const totalWindowExpense = useMemo(() => {
		return buckets.reduce((acc, d) => acc + d.expense, 0);
	}, [buckets]);

	const totalWindowProfit = totalWindowRevenue - totalWindowExpense;

	useEffect(() => {
		if (!canvasRef.current || buckets.length === 0) return;

		// Cleanup existing chart
		if (chartInstanceRef.current) {
			chartInstanceRef.current.destroy();
			chartInstanceRef.current = null;
		}

		const ctx = canvasRef.current.getContext("2d");
		if (!ctx) return;

		const labels = buckets.map((d) => d.label);
		const revenueData = buckets.map((d) => d.revenue);
		const expenseData = buckets.map((d) => d.expense);

		chartInstanceRef.current = new Chart(ctx, {
			type: "bar",
			data: {
				labels,
				datasets: [
					{
						label: "Pemasukan (Omzet)",
						data: revenueData,
						backgroundColor: "rgba(16, 185, 129, 0.85)", // emerald-500
						borderColor: "#10b981",
						borderWidth: 1,
						borderRadius: 6,
						hoverBackgroundColor: "#059669",
					},
					{
						label: "Pengeluaran (Modal + Service)",
						data: expenseData,
						backgroundColor: "rgba(245, 158, 11, 0.85)", // amber-500
						borderColor: "#f59e0b",
						borderWidth: 1,
						borderRadius: 6,
						hoverBackgroundColor: "#d97706",
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: "index",
					intersect: false,
				},
				plugins: {
					legend: {
						display: false,
					},
					tooltip: {
						backgroundColor: "rgba(15, 23, 42, 0.95)",
						titleColor: "#ffffff",
						titleFont: { size: 12, weight: "bold" },
						bodyColor: "#e2e8f0",
						bodyFont: { size: 11 },
						padding: 12,
						cornerRadius: 8,
						boxPadding: 4,
						callbacks: {
							title: (items) => {
								if (!items || items.length === 0) return "";
								const index = items[0].dataIndex;
								return `${buckets[index].fullLabel} (${buckets[index].count} unit)`;
							},
							label: (context) => {
								const val = context.raw as number;
								return ` ${context.dataset.label}: ${formatRp(val)}`;
							},
							afterBody: (items) => {
								if (!items || items.length === 0) return [];
								const index = items[0].dataIndex;
								const item = buckets[index];
								const roi =
									item.expense > 0 ? ((item.profit / item.expense) * 100).toFixed(1) : "0.0";
								return [
									"",
									` 💰 Laba Bersih: ${formatRp(item.profit)} (${item.profit >= 0 ? "+" : ""}${roi}%)`,
								];
							},
						},
					},
				},
				scales: {
					x: {
						grid: {
							display: false,
						},
						ticks: {
							font: { size: 11, weight: "bold" },
							color: "#64748b",
						},
					},
					y: {
						beginAtZero: true,
						grid: {
							color: "rgba(226, 232, 240, 0.8)",
						},
						ticks: {
							font: { size: 10 },
							color: "#94a3b8",
							callback: (value) => formatCompactRp(Number(value)),
						},
					},
				},
			},
		});

		return () => {
			if (chartInstanceRef.current) {
				chartInstanceRef.current.destroy();
				chartInstanceRef.current = null;
			}
		};
	}, [buckets]);

	if (buckets.length === 0) {
		return (
			<div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm mb-5 text-center">
				<div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
					<IconTrendingUp className="w-5 h-5 text-slate-400" />
				</div>
				<h4 className="text-sm font-semibold text-slate-800">
					Grafik Pengeluaran & Pemasukan Belum Tersedia
				</h4>
				<p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
					Belum ada data unit mobil terjual dengan tanggal transaksi untuk menampilkan grafik
					komparasi arus kas.
				</p>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm mb-5">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
				{/* Title and Icon */}
				<div>
					<div className="flex items-center gap-2">
						<div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
							<IconTrendingUp className="w-4 h-4" />
						</div>
						<h3 className="text-sm font-bold text-slate-900 tracking-tight">
							Pengeluaran & Pemasukan
						</h3>
					</div>
					<p className="text-xs text-slate-500 mt-0.5 ml-9">
						Perbandingan arus kas omzet masuk vs modal keluar
					</p>
				</div>

				{/* Legend & Summary Badges */}
				<div className="flex flex-wrap items-center gap-3">
					{/* Mode Badge (Mingguan / Bulanan) */}
					<span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/80 select-none">
						{granularityMode === "weekly" ? "Mingguan" : "Bulanan"}
					</span>

					{/* Legend Indicator */}
					<div className="flex items-center gap-3 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 text-[11px]">
						<div className="flex items-center gap-1.5">
							<span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
							<span className="font-medium text-slate-700">Pemasukan</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
							<span className="font-medium text-slate-700">Pengeluaran</span>
						</div>
					</div>

					{/* Total Net Profit Pill */}
					<div
						className={`border px-2.5 py-1 rounded-lg text-xs font-semibold font-mono ${
							totalWindowProfit >= 0
								? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
								: "bg-rose-50 text-rose-700 border-rose-200/80"
						}`}
					>
						Laba: {totalWindowProfit >= 0 ? "+" : ""}
						{formatCompactRp(totalWindowProfit)}
					</div>
				</div>
			</div>

			{/* Chart Canvas */}
			<div className="relative h-64 sm:h-72 w-full">
				<canvas ref={canvasRef} />
			</div>
		</div>
	);
}
