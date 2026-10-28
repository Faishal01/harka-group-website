import { useState } from "preact/hooks";
import IconTrendingUp from "~icons/lucide/trending-up";
import { formatRp, parseDateUniversal, StockCarItem } from "../../../shared/schema";

export type ProfitSortColumn = "no" | "soldDate" | "car" | "price" | "profit";
export type SortDirection = "asc" | "desc";

interface ProfitBreakdownTableProps {
	stocks: StockCarItem[];
}

export function ProfitBreakdownTable({ stocks }: ProfitBreakdownTableProps) {
	const [sortBy, setSortBy] = useState<ProfitSortColumn>("soldDate");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

	const handleSort = (col: ProfitSortColumn) => {
		if (sortBy === col) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortBy(col);
			setSortDirection(col === "soldDate" || col === "profit" || col === "price" ? "desc" : "asc");
		}
	};

	const renderSortIcon = (col: ProfitSortColumn) => {
		if (sortBy !== col) {
			return <span className="text-slate-300 ml-1 inline-block select-none">↕</span>;
		}
		return (
			<span className="text-blue-600 font-bold ml-1 inline-block select-none">
				{sortDirection === "asc" ? "↑" : "↓"}
			</span>
		);
	};

	// Only include sold cars
	const soldCars = stocks.filter((s) => s.status === "Sold");

	// Compute values and sort
	const sortedCars = [...soldCars].sort((a, b) => {
		const dir = sortDirection === "asc" ? 1 : -1;

		if (sortBy === "no") {
			return (a.no - b.no) * dir;
		}

		if (sortBy === "soldDate") {
			const parseD = (str?: string) => {
				const parsed = parseDateUniversal(str);
				if (!parsed) return 0;
				return parsed.year * 10000 + (parsed.month + 1) * 100 + parsed.day;
			};
			return (parseD(a.soldDate) - parseD(b.soldDate)) * dir;
		}

		if (sortBy === "car") {
			return (a.carDescription || "").localeCompare(b.carDescription || "", "id-ID") * dir;
		}

		if (sortBy === "price") {
			return (a.sellingPrice - b.sellingPrice) * dir;
		}

		if (sortBy === "profit") {
			const profitA = a.sellingPrice - (a.capitalCost + a.serviceExpense);
			const profitB = b.sellingPrice - (b.capitalCost + b.serviceExpense);
			return (profitA - profitB) * dir;
		}

		return 0;
	});

	// Totals calculation
	const totalRevenue = soldCars.reduce((sum, c) => sum + (c.sellingPrice || 0), 0);
	const totalCapital = soldCars.reduce((sum, c) => sum + (c.capitalCost || 0), 0);
	const totalService = soldCars.reduce((sum, c) => sum + (c.serviceExpense || 0), 0);
	const totalCost = totalCapital + totalService;
	const totalProfit = totalRevenue - totalCost;
	const totalRoi = totalCost > 0 ? ((totalProfit / totalCost) * 100).toFixed(1) : "0.0";

	if (soldCars.length === 0) {
		return (
			<div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-12 text-center mb-6">
				<div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
					<IconTrendingUp className="w-6 h-6 text-slate-400" />
				</div>
				<h4 className="text-sm font-semibold text-slate-800">
					Tidak ada data unit terjual di periode ini
				</h4>
				<p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
					Pilih rentang tanggal yang lebih luas atau klik "Semua" untuk melihat riwayat penjualan
					dan keuntungan.
				</p>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
			{/* Table Header Label */}
			<div className="py-3 px-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
				<div>
					<h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
						Rincian Laba Rugi per Unit Terjual
					</h3>
					<p className="text-[11px] text-slate-500 mt-0.5">
						Perhitungan riil keuntungan bersih setelah memperhitungkan modal beli dan biaya
						rekondisi
					</p>
				</div>
				<span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
					{soldCars.length} Unit
				</span>
			</div>

			<div className="overflow-x-auto max-h-125">
				<table className="w-full text-left border-collapse text-xs">
					<thead className="bg-slate-50/90 text-slate-600 font-semibold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 backdrop-blur-sm">
						<tr>
							{/* 1. No */}
							<th
								onClick={() => handleSort("no")}
								className="py-3 px-3 w-12 text-center cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								No {renderSortIcon("no")}
							</th>

							{/* 2. Tgl Terjual */}
							<th
								onClick={() => handleSort("soldDate")}
								className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								Tgl Terjual {renderSortIcon("soldDate")}
							</th>

							{/* 3. Deskripsi Mobil */}
							<th
								onClick={() => handleSort("car")}
								className="py-3 px-4 min-w-[180px] cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								Deskripsi Mobil {renderSortIcon("car")}
							</th>

							{/* 4. Plat Nomor */}
							<th className="py-3 px-3 text-center whitespace-nowrap">Plat Nomor</th>

							{/* 5. Harga Jual */}
							<th
								onClick={() => handleSort("price")}
								className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								Harga Jual {renderSortIcon("price")}
							</th>

							{/* 6. Modal Beli */}
							<th className="py-3 px-3 text-right whitespace-nowrap">Modal Beli</th>

							{/* 7. Pengeluaran Service */}
							<th className="py-3 px-3 text-right whitespace-nowrap">Biaya Service</th>

							{/* 8. Total Modal */}
							<th className="py-3 px-3 text-right whitespace-nowrap">Total Modal</th>

							{/* 9. Laba Bersih */}
							<th
								onClick={() => handleSort("profit")}
								className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								Laba Bersih {renderSortIcon("profit")}
							</th>

							{/* 10. Margin % */}
							<th className="py-3 px-3 text-center whitespace-nowrap">Margin ROI</th>
						</tr>
					</thead>

					<tbody className="divide-y divide-slate-100 text-slate-700">
						{sortedCars.map((car) => {
							const cost = (car.capitalCost || 0) + (car.serviceExpense || 0);
							const profit = (car.sellingPrice || 0) - cost;
							const isPositive = profit >= 0;
							const roi = cost > 0 ? ((profit / cost) * 100).toFixed(1) : "0.0";

							return (
								<tr key={car.id} className="hover:bg-slate-50/80 transition-colors group">
									{/* 1. No */}
									<td className="py-2.5 px-3 text-center font-semibold text-slate-800">
										#{car.no}
									</td>

									{/* 2. Tgl Terjual */}
									<td className="py-2.5 px-3 text-center text-slate-600 whitespace-nowrap">
										{car.soldDate || "-"}
									</td>

									{/* 3. Deskripsi Mobil */}
									<td className="py-2.5 px-4 font-semibold text-slate-900 leading-tight">
										{car.carDescription}
									</td>

									{/* 4. Plat Nomor */}
									<td className="py-2.5 px-3 text-center whitespace-nowrap">
										<span className="inline-block px-1.5 py-0.5 text-[11px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
											{car.plateNumber}
										</span>
									</td>

									{/* 5. Harga Jual */}
									<td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
										{formatRp(car.sellingPrice)}
									</td>

									{/* 6. Modal Beli */}
									<td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
										{formatRp(car.capitalCost)}
									</td>

									{/* 7. Pengeluaran Service */}
									<td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
										{car.serviceExpense > 0 ? (
											<span className="text-amber-700">{formatRp(car.serviceExpense)}</span>
										) : (
											<span className="text-slate-400">-</span>
										)}
									</td>

									{/* 8. Total Modal */}
									<td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
										{formatRp(cost)}
									</td>

									{/* 9. Laba Bersih */}
									<td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
										<span className={isPositive ? "text-emerald-600" : "text-rose-600"}>
											{isPositive ? "+" : ""}
											{formatRp(profit)}
										</span>
									</td>

									{/* 10. Margin % */}
									<td className="py-2.5 px-3 text-center whitespace-nowrap">
										<span
											className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
												isPositive
													? "bg-emerald-50 text-emerald-700 border border-emerald-200"
													: "bg-rose-50 text-rose-700 border border-rose-200"
											}`}
										>
											{isPositive ? "+" : ""}
											{roi}%
										</span>
									</td>
								</tr>
							);
						})}
					</tbody>

					{/* Live Totals Footer */}
					<tfoot className="bg-slate-50 border-t-2 border-slate-200 font-semibold text-slate-900">
						<tr>
							<td colSpan={4} className="py-3 px-4 text-left font-bold text-slate-800">
								TOTAL ({soldCars.length} UNIT TERJUAL)
							</td>
							<td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
								{formatRp(totalRevenue)}
							</td>
							<td className="py-3 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
								{formatRp(totalCapital)}
							</td>
							<td className="py-3 px-3 text-right font-mono text-amber-800 whitespace-nowrap">
								{formatRp(totalService)}
							</td>
							<td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
								{formatRp(totalCost)}
							</td>
							<td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
								<span className={totalProfit >= 0 ? "text-emerald-700" : "text-rose-700"}>
									{totalProfit >= 0 ? "+" : ""}
									{formatRp(totalProfit)}
								</span>
							</td>
							<td className="py-3 px-3 text-center whitespace-nowrap">
								<span
									className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
										totalProfit >= 0
											? "bg-emerald-100 text-emerald-800"
											: "bg-rose-100 text-rose-800"
									}`}
								>
									{totalProfit >= 0 ? "+" : ""}
									{totalRoi}%
								</span>
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>
	);
}
