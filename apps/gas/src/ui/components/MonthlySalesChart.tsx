import {
	BarController,
	BarElement,
	CategoryScale,
	Chart,
	Filler,
	Legend,
	LinearScale,
	LineController,
	LineElement,
	PointElement,
	Tooltip,
} from "chart.js";
import { useEffect, useMemo, useRef } from "preact/hooks";
import IconTrendingUp from "~icons/lucide/trending-up";
import {
	aggregateMonthlySales,
	formatCompactRp,
	formatRp,
	TransactionItem,
} from "../../shared/schema";

// Register Chart.js components once
Chart.register(
	CategoryScale,
	LinearScale,
	BarElement,
	LineElement,
	PointElement,
	BarController,
	LineController,
	Tooltip,
	Legend,
	Filler,
);

interface MonthlySalesChartProps {
	transactions: TransactionItem[];
	filterLabel?: string | null;
}

export function MonthlySalesChart({ transactions, filterLabel }: MonthlySalesChartProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const chartInstanceRef = useRef<Chart | null>(null);

	const monthlyData = useMemo(() => {
		return aggregateMonthlySales(transactions, 12);
	}, [transactions]);

	const totalWindowSales = useMemo(() => {
		return monthlyData.reduce((acc, d) => acc + d.sales, 0);
	}, [monthlyData]);

	const totalWindowCount = useMemo(() => {
		return monthlyData.reduce((acc, d) => acc + d.count, 0);
	}, [monthlyData]);

	useEffect(() => {
		if (!canvasRef.current || monthlyData.length === 0) return;

		// Destroy previous instance if exists
		if (chartInstanceRef.current) {
			chartInstanceRef.current.destroy();
			chartInstanceRef.current = null;
		}

		const ctx = canvasRef.current.getContext("2d");
		if (!ctx) return;

		const labels = monthlyData.map((d) => d.label);
		const salesData = monthlyData.map((d) => d.sales);
		const countData = monthlyData.map((d) => d.count);

		chartInstanceRef.current = new Chart(ctx, {
			type: "bar",
			data: {
				labels,
				datasets: [
					{
						type: "bar",
						label: "Penjualan (Rp)",
						data: salesData,
						backgroundColor: "rgba(59, 130, 246, 0.75)",
						hoverBackgroundColor: "rgba(37, 99, 235, 0.95)",
						borderRadius: 6,
						borderSkipped: false,
						yAxisID: "y",
						order: 2,
					},
					{
						type: "line",
						label: "Volume (Unit)",
						data: countData,
						borderColor: "#f59e0b",
						backgroundColor: "rgba(245, 158, 11, 0.15)",
						borderWidth: 2.5,
						pointBackgroundColor: "#f59e0b",
						pointBorderColor: "#ffffff",
						pointBorderWidth: 2,
						pointRadius: 4.5,
						pointHoverRadius: 6.5,
						tension: 0.35,
						yAxisID: "y1",
						order: 1,
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
						display: false, // We use custom styled HTML legend
					},
					tooltip: {
						backgroundColor: "#0f172a",
						titleColor: "#ffffff",
						titleFont: { size: 12, weight: "bold" },
						bodyColor: "#cbd5e1",
						bodyFont: { size: 11 },
						padding: 10,
						cornerRadius: 8,
						boxPadding: 4,
						callbacks: {
							title: (items) => {
								if (!items.length) return "";
								const idx = items[0].dataIndex;
								return monthlyData[idx]?.fullLabel || items[0].label;
							},
							label: (item) => {
								if (item.datasetIndex === 0) {
									return ` Penjualan: ${formatRp(Number(item.raw))}`;
								}
								return ` Volume: ${item.raw} unit mobil`;
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
							font: { size: 10, weight: "bold" },
							color: "#64748b",
						},
					},
					y: {
						type: "linear",
						display: true,
						position: "left",
						beginAtZero: true,
						grid: {
							color: "#f1f5f9",
						},
						ticks: {
							font: { size: 10 },
							color: "#64748b",
							callback: (val) => formatCompactRp(Number(val)),
						},
					},
					y1: {
						type: "linear",
						display: true,
						position: "right",
						beginAtZero: true,
						grid: {
							drawOnChartArea: false, // Prevent overlapping horizontal grid lines
						},
						ticks: {
							precision: 0,
							font: { size: 10 },
							color: "#d97706",
							callback: (val) => `${val} unit`,
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
			<div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm mb-5 text-center">
				<p className="text-xs text-slate-400">
					Belum ada data bulanan untuk ditampilkan pada grafik tren.
				</p>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm mb-5">
			{/* Header & Legends */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-3">
				<div>
					<div className="flex items-center gap-2">
						<div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
							<IconTrendingUp className="w-4 h-4" />
						</div>
						<h3 className="text-sm font-bold text-slate-900 leading-tight">
							Tren Penjualan & Volume Bulanan
						</h3>
						{filterLabel && (
							<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
								Filter: {filterLabel}
							</span>
						)}
					</div>
					<p className="text-xs text-slate-500 mt-1">
						Performa omzet penjualan (Rp) dan jumlah unit mobil terjual per bulan (1 tahun terakhir)
					</p>
				</div>

				{/* Custom HTML Legend & Quick Window Totals */}
				<div className="flex items-center gap-4 text-xs shrink-0 flex-wrap">
					<div className="flex items-center gap-1.5">
						<span className="w-3 h-3 rounded-xs bg-blue-500 inline-block" />
						<span className="text-slate-600 font-medium">Penjualan:</span>
						<strong className="text-slate-900 font-bold">
							{formatCompactRp(totalWindowSales)}
						</strong>
					</div>
					<div className="flex items-center gap-1.5">
						<span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
						<span className="text-slate-600 font-medium">Volume:</span>
						<strong className="text-slate-900 font-bold">{totalWindowCount} Unit</strong>
					</div>
				</div>
			</div>

			{/* Canvas Container */}
			<div className="relative w-full h-64 sm:h-72">
				<canvas ref={canvasRef} />
			</div>
		</div>
	);
}
