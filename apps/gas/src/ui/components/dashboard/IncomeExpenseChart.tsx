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
	label: string; // "Okt 26"
	fullLabel: string; // "Oktober 2026"
	prevFullLabel: string; // "Oktober 2025"
	startIso: string;
	endIso: string;
	prevStartIso: string;
	prevEndIso: string;
	// Current Year Period
	revenue: number; // Pemasukan (Omzet)
	expense: number; // Pengeluaran (Modal + Service)
	profit: number; // Laba Bersih
	count: number;
	// Prior Year Period (YoY Shadow)
	prevRevenue: number;
	prevExpense: number;
	prevProfit: number;
	prevCount: number;
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
		// "Semua": Scope to available data this year only (starting from earliest month with sales this year)
		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth();

		const thisYearDates = soldCars
			.map((c) => parseDateUniversal(c.soldDate))
			.filter((p): p is NonNullable<typeof p> => p !== null && p.year === currentYear);

		if (thisYearDates.length === 0) {
			startY = currentYear;
			startM = currentMonth;
			endY = currentYear;
			endM = currentMonth;
		} else {
			const sorted = thisYearDates.sort((a, b) => a.month - b.month);
			startY = currentYear;
			startM = sorted[0].month;
			endY = currentYear;
			endM = Math.max(sorted[sorted.length - 1].month, currentMonth);
		}
	}

	let currY = startY;
	let currM = startM;

	while (currY < endY || (currY === endY && currM <= endM)) {
		const key = `${currY}-${String(currM + 1).padStart(2, "0")}`;
		const lastDay = new Date(currY, currM + 1, 0).getDate();
		const startIsoStr = `${currY}-${String(currM + 1).padStart(2, "0")}-01`;
		const endIsoStr = `${currY}-${String(currM + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

		const prevY = currY - 1;
		const prevLastDay = new Date(prevY, currM + 1, 0).getDate();
		const prevStartIsoStr = `${prevY}-${String(currM + 1).padStart(2, "0")}-01`;
		const prevEndIsoStr = `${prevY}-${String(currM + 1).padStart(2, "0")}-${String(prevLastDay).padStart(2, "0")}`;

		buckets.push({
			key,
			label: `${SHORT_MONTH_NAMES[currM]} ${String(currY).slice(-2)}`,
			fullLabel: `${FULL_MONTH_NAMES[currM]} ${currY}`,
			prevFullLabel: `${FULL_MONTH_NAMES[currM]} ${prevY}`,
			startIso: startIsoStr,
			endIso: endIsoStr,
			prevStartIso: prevStartIsoStr,
			prevEndIso: prevEndIsoStr,
			revenue: 0,
			expense: 0,
			profit: 0,
			count: 0,
			prevRevenue: 0,
			prevExpense: 0,
			prevProfit: 0,
			prevCount: 0,
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

	// Monthly buckets with prior year (YoY) metrics
	const buckets = useMemo(() => {
		const soldCars = stocks.filter((s) => s.status === "Sold" && s.soldDate);

		const generatedBuckets: IncomeExpenseBucket[] = generateMonthlyBuckets(
			startDate,
			endDate,
			soldCars,
		);

		// Pre-parse all sold cars for fast aggregation
		const parsedSoldCars = soldCars
			.map((car) => {
				const parsed = parseDateUniversal(car.soldDate);
				if (!parsed) return null;
				const revenue = car.sellingPrice || 0;
				const expense = (car.capitalCost || 0) + (car.serviceExpense || 0);
				return { iso: parsed.iso, revenue, expense };
			})
			.filter((c): c is NonNullable<typeof c> => c !== null);

		// Aggregate car data into matching buckets (Current year & Prior year)
		for (const bucket of generatedBuckets) {
			for (const car of parsedSoldCars) {
				// Current year matching
				if (car.iso >= bucket.startIso && car.iso <= bucket.endIso) {
					// Respect user sub-month boundary if custom date range was supplied
					if ((!startDate || car.iso >= startDate) && (!endDate || car.iso <= endDate)) {
						bucket.revenue += car.revenue;
						bucket.expense += car.expense;
						bucket.count += 1;
					}
				}

				// Prior year (YoY) matching
				if (car.iso >= bucket.prevStartIso && car.iso <= bucket.prevEndIso) {
					bucket.prevRevenue += car.revenue;
					bucket.prevExpense += car.expense;
					bucket.prevCount += 1;
				}
			}

			bucket.profit = bucket.revenue - bucket.expense;
			bucket.prevProfit = bucket.prevRevenue - bucket.prevExpense;
		}

		return generatedBuckets;
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

		chartInstanceRef.current = new Chart(ctx, {
			type: "bar",
			data: {
				labels,
				datasets: [
					// 1. Pemasukan (Tahun Lalu - Background Pillar)
					{
						label: "Pemasukan (Tahun Lalu)",
						data: buckets.map((d) => d.prevRevenue),
						stack: "income",
						backgroundColor: "rgba(16, 185, 129, 0.25)",
						borderColor: "rgba(16, 185, 129, 0.80)",
						borderWidth: 1.5,
						borderRadius: 6,
						hoverBackgroundColor: "rgba(16, 185, 129, 0.38)",
						categoryPercentage: 0.84,
						barPercentage: 0.96,
						maxBarThickness: 130,
					},
					// 2. Pemasukan (Tahun Ini - Foreground Inner Bar)
					{
						label: "Pemasukan (Tahun Ini)",
						data: buckets.map((d) => d.revenue),
						stack: "income",
						backgroundColor: "rgba(16, 185, 129, 0.9)",
						borderColor: "#10b981",
						borderWidth: 1.5,
						borderRadius: 4,
						hoverBackgroundColor: "#059669",
						categoryPercentage: 0.84,
						barPercentage: 0.6,
						maxBarThickness: 82,
					},
					// 3. Pengeluaran (Tahun Lalu - Background Pillar)
					{
						label: "Pengeluaran (Tahun Lalu)",
						data: buckets.map((d) => d.prevExpense),
						stack: "expense",
						backgroundColor: "rgba(245, 158, 11, 0.25)",
						borderColor: "rgba(245, 158, 11, 0.80)",
						borderWidth: 1.5,
						borderRadius: 6,
						hoverBackgroundColor: "rgba(245, 158, 11, 0.38)",
						categoryPercentage: 0.84,
						barPercentage: 0.96,
						maxBarThickness: 130,
					},
					// 4. Pengeluaran (Tahun Ini - Foreground Inner Bar)
					{
						label: "Pengeluaran (Tahun Ini)",
						data: buckets.map((d) => d.expense),
						stack: "expense",
						backgroundColor: "rgba(245, 158, 11, 0.9)",
						borderColor: "#f59e0b",
						borderWidth: 1.5,
						borderRadius: 4,
						hoverBackgroundColor: "#d97706",
						categoryPercentage: 0.84,
						barPercentage: 0.6,
						maxBarThickness: 82,
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
						displayColors: false,
						callbacks: {
							title: (items) => {
								if (!items || items.length === 0) return "";
								const index = items[0].dataIndex;
								const b = buckets[index];
								return `${b.fullLabel}  vs  ${b.prevFullLabel}`;
							},
							label: () => "",
							afterBody: (items) => {
								if (!items || items.length === 0) return [];
								const index = items[0].dataIndex;
								const b = buckets[index];

								const calcGrowth = (curr: number, prev: number) => {
									if (prev === 0) {
										return curr > 0 ? "N/A (Baru)" : "0.0%";
									}
									const diff = ((curr - prev) / Math.abs(prev)) * 100;
									return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
								};

								const revGrowth = calcGrowth(b.revenue, b.prevRevenue);
								const expGrowth = calcGrowth(b.expense, b.prevExpense);
								const profitGrowth = calcGrowth(b.profit, b.prevProfit);

								const roiCurr = b.expense > 0 ? ((b.profit / b.expense) * 100).toFixed(1) : "0.0";
								const roiPrev =
									b.prevExpense > 0 ? ((b.prevProfit / b.prevExpense) * 100).toFixed(1) : "0.0";

								return [
									`🟢 PEMASUKAN:`,
									`  • Tahun Ini: ${formatRp(b.revenue)} (${b.count} unit)`,
									`  • Tahun Lalu: ${formatRp(b.prevRevenue)} (${b.prevCount} unit)`,
									`  • YoY Growth: ${revGrowth}`,
									``,
									`🟠 PENGELUARAN:`,
									`  • Tahun Ini: ${formatRp(b.expense)}`,
									`  • Tahun Lalu: ${formatRp(b.prevExpense)}`,
									`  • YoY Growth: ${expGrowth}`,
									``,
									`💰 LABA BERSIH:`,
									`  • Tahun Ini: ${formatRp(b.profit)} (ROI: ${roiCurr}%)`,
									`  • Tahun Lalu: ${formatRp(b.prevProfit)} (ROI: ${roiPrev}%)`,
									`  • YoY Growth: ${profitGrowth}`,
								];
							},
						},
					},
				},
				scales: {
					x: {
						stacked: true,
						grid: {
							display: false,
						},
						ticks: {
							font: { size: 11, weight: "bold" },
							color: "#64748b",
						},
					},
					y: {
						stacked: false,
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
						Perbandingan arus kas omzet masuk vs modal keluar (dengan komparasi tahun lalu)
					</p>
				</div>

				{/* Legend & Summary Badges */}
				<div className="flex flex-wrap items-center gap-2.5">
					{/* YoY Badge */}
					<span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80 select-none">
						Komparasi YoY
					</span>

					{/* Bullet Overlay Legend Indicator */}
					<div className="flex flex-wrap items-center gap-3 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 text-[11px]">
						<div className="flex items-center gap-1.5">
							{/* Nested bullet overlay swatch */}
							<div
								className="relative w-4 h-3.5 flex items-center justify-center shrink-0"
								title="Solid: Tahun Ini, Background Siluet: Tahun Lalu"
							>
								<span className="absolute inset-0 rounded-xs bg-emerald-500/25 border border-emerald-500/80" />
								<span className="relative w-2 h-full rounded-xs bg-emerald-500" />
							</div>
							<span className="font-medium text-slate-700">Pemasukan</span>
							<span className="text-[10px] text-slate-400 font-normal">(vs Thn Lalu)</span>
						</div>
						<div className="flex items-center gap-1.5 border-l border-slate-200 pl-2.5">
							{/* Nested bullet overlay swatch */}
							<div
								className="relative w-4 h-3.5 flex items-center justify-center shrink-0"
								title="Solid: Tahun Ini, Background Siluet: Tahun Lalu"
							>
								<span className="absolute inset-0 rounded-xs bg-amber-500/25 border border-amber-500/80" />
								<span className="relative w-2 h-full rounded-xs bg-amber-500" />
							</div>
							<span className="font-medium text-slate-700">Pengeluaran</span>
							<span className="text-[10px] text-slate-400 font-normal">(vs Thn Lalu)</span>
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
