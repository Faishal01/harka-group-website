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

interface MonthlyIncomeExpenseItem {
	key: string; // YYYY-MM
	label: string; // "Agu 26"
	fullLabel: string; // "Agustus 2026"
	revenue: number; // Pemasukan
	expense: number; // Pengeluaran (Modal + Service)
	profit: number; // Laba Bersih
	count: number;
}

interface IncomeExpenseChartProps {
	stocks: StockCarItem[];
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

export function IncomeExpenseChart({ stocks }: IncomeExpenseChartProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const chartInstanceRef = useRef<Chart | null>(null);

	// Aggregate monthly income vs expense for sold cars
	const monthlyData = useMemo(() => {
		const map = new Map<
			string,
			{ year: number; month: number; revenue: number; expense: number; count: number }
		>();

		const soldCars = stocks.filter((s) => s.status === "Sold" && s.soldDate);

		for (const car of soldCars) {
			const parsed = parseDateUniversal(car.soldDate);
			if (!parsed) continue;

			const monthIdx = parsed.month;
			const year = parsed.year;

			const key = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
			const existing = map.get(key) || {
				year,
				month: monthIdx,
				revenue: 0,
				expense: 0,
				count: 0,
			};

			const revenue = car.sellingPrice || 0;
			const expense = (car.capitalCost || 0) + (car.serviceExpense || 0);

			existing.revenue += revenue;
			existing.expense += expense;
			existing.count += 1;
			map.set(key, existing);
		}

		// Sort chronologically
		const sorted = Array.from(map.entries()).sort((a, b) => {
			const valA = a[1].year * 100 + a[1].month;
			const valB = b[1].year * 100 + b[1].month;
			return valA - valB;
		});

		// Take the latest 12 months
		const sliced = sorted.length > 12 ? sorted.slice(-12) : sorted;

		return sliced.map(([key, data]) => {
			const profit = data.revenue - data.expense;
			return {
				key,
				label: `${SHORT_MONTH_NAMES[data.month]} ${String(data.year).slice(-2)}`,
				fullLabel: `${FULL_MONTH_NAMES[data.month]} ${data.year}`,
				revenue: data.revenue,
				expense: data.expense,
				profit,
				count: data.count,
			} as MonthlyIncomeExpenseItem;
		});
	}, [stocks]);

	const totalWindowRevenue = useMemo(() => {
		return monthlyData.reduce((acc, d) => acc + d.revenue, 0);
	}, [monthlyData]);

	const totalWindowExpense = useMemo(() => {
		return monthlyData.reduce((acc, d) => acc + d.expense, 0);
	}, [monthlyData]);

	const totalWindowProfit = totalWindowRevenue - totalWindowExpense;

	useEffect(() => {
		if (!canvasRef.current || monthlyData.length === 0) return;

		// Cleanup existing chart
		if (chartInstanceRef.current) {
			chartInstanceRef.current.destroy();
			chartInstanceRef.current = null;
		}

		const ctx = canvasRef.current.getContext("2d");
		if (!ctx) return;

		const labels = monthlyData.map((d) => d.label);
		const revenueData = monthlyData.map((d) => d.revenue);
		const expenseData = monthlyData.map((d) => d.expense);

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
						display: false, // Custom header legend used
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
								return `${monthlyData[index].fullLabel} (${monthlyData[index].count} unit)`;
							},
							label: (context) => {
								const val = context.raw as number;
								return ` ${context.dataset.label}: ${formatRp(val)}`;
							},
							afterBody: (items) => {
								if (!items || items.length === 0) return [];
								const index = items[0].dataIndex;
								const item = monthlyData[index];
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
	}, [monthlyData]);

	if (monthlyData.length === 0) {
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
							Pengeluaran & Pemasukan Bulanan
						</h3>
					</div>
					<p className="text-xs text-slate-500 mt-0.5 ml-9">
						Perbandingan arus kas omzet masuk vs modal keluar per bulan
					</p>
				</div>

				{/* Legend & Summary Badges */}
				<div className="flex flex-wrap items-center gap-3">
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
					<div className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono">
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
