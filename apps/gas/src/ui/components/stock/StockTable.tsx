import IconCar from "~icons/lucide/car";
import IconPencil from "~icons/lucide/pencil";
import IconTrash2 from "~icons/lucide/trash-2";
import { calculateTargetSellingPrice, formatRp, StockCarItem } from "../../../shared/schema";
import { SortDirection, StockSortColumn } from "../../types";

interface StockTableProps {
	stocks: StockCarItem[];
	sortBy: StockSortColumn;
	sortDirection: SortDirection;
	onSort: (column: StockSortColumn) => void;
	isLoading: boolean;
	onEdit: (car: StockCarItem) => void;
	onDelete: (car: StockCarItem) => void;
}

export function StockTable({
	stocks,
	sortBy,
	sortDirection,
	onSort,
	isLoading,
	onEdit,
	onDelete,
}: StockTableProps) {
	const renderSortIcon = (column: StockSortColumn) => {
		if (sortBy !== column) {
			return <span className="text-slate-300 ml-1 inline-block select-none">↕</span>;
		}
		return (
			<span className="text-blue-600 font-bold ml-1 inline-block select-none">
				{sortDirection === "asc" ? "↑" : "↓"}
			</span>
		);
	};

	if (isLoading) {
		return (
			<div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-12 text-center">
				<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
				<p className="text-sm text-slate-500 font-medium">Memuat data dari Google Sheets...</p>
			</div>
		);
	}

	if (stocks.length === 0) {
		return (
			<div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-12 text-center">
				<div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
					<IconCar className="w-6 h-6 text-slate-400" />
				</div>
				<h4 className="text-sm font-semibold text-slate-800">Tidak ada stok mobil ditemukan</h4>
				<p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
					Belum ada data stok mobil atau tidak ada unit yang cocok dengan filter yang diterapkan.
				</p>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
			<div className="overflow-x-auto max-h-125">
				<table className="w-full text-left border-collapse text-xs">
					<thead className="bg-slate-50/90 text-slate-600 font-semibold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 backdrop-blur-sm">
						<tr>
							{/* 1. No */}
							<th
								onClick={() => onSort("no")}
								className="py-3 px-3 w-12 text-center cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								No {renderSortIcon("no")}
							</th>

							{/* 2. Merek */}
							<th
								onClick={() => onSort("make")}
								className="py-3 px-3 w-28 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								Merek {renderSortIcon("make")}
							</th>

							{/* 3. Deskripsi Mobil */}
							<th
								onClick={() => onSort("car")}
								className="py-3 px-4 min-w-[200px] cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								Deskripsi Mobil {renderSortIcon("car")}
							</th>

							{/* 4. Plat Mobil */}
							<th className="py-3 px-3 text-center whitespace-nowrap">Plat Nomor</th>

							{/* 5. Kelengkapan */}
							<th className="py-3 px-3 min-w-[220px]">Kelengkapan</th>

							{/* 6. Kategori Transaksi (Status) */}
							<th className="py-3 px-3 text-center whitespace-nowrap">Status</th>

							{/* 7. Harga Jual */}
							<th
								onClick={() => onSort("sellingPrice")}
								className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								Harga Jual {renderSortIcon("sellingPrice")}
							</th>

							{/* 8. Modal */}
							<th
								onClick={() => onSort("capitalCost")}
								className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								Modal {renderSortIcon("capitalCost")}
							</th>

							{/* 9. Pengeluaran Service */}
							<th
								onClick={() => onSort("serviceExpense")}
								className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								Pengeluaran Service {renderSortIcon("serviceExpense")}
							</th>

							{/* 10. Tanggal Terjual */}
							<th
								onClick={() => onSort("soldDate")}
								className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								Tgl Terjual {renderSortIcon("soldDate")}
							</th>

							{/* 11. Aksi */}
							<th className="py-3 px-3 text-right whitespace-nowrap">Aksi</th>
						</tr>
					</thead>

					<tbody className="divide-y divide-slate-100">
						{stocks.map((car) => {
							const docList = car.documents
								? car.documents
										.split(",")
										.map((d) => d.trim())
										.filter(Boolean)
								: [];

							return (
								<tr key={car.id} className="hover:bg-slate-50/80 transition-colors group">
									{/* 1. No */}
									<td className="py-2.5 px-3 text-center font-semibold text-slate-800">
										#{car.no}
									</td>

									{/* 2. Merek */}
									<td className="py-2.5 px-3 whitespace-nowrap">
										<span className="font-semibold text-slate-900">{car.make}</span>
									</td>

									{/* 3. Deskripsi Mobil */}
									<td className="py-2.5 px-4 font-semibold text-slate-900 leading-tight">
										{car.carDescription}
									</td>

									{/* 4. Plat Mobil */}
									<td className="py-2.5 px-3 text-center whitespace-nowrap">
										<span className="inline-block px-1.5 py-0.5 text-[11px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
											{car.plateNumber}
										</span>
									</td>

									{/* 5. Kelengkapan */}
									<td className="py-2.5 px-3 min-w-[220px]">
										{docList.length > 0 ? (
											<div className="flex flex-wrap gap-1 max-w-sm">
												{docList.map((doc) => (
													<span
														key={doc}
														className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600 border border-slate-200/80"
													>
														{doc}
													</span>
												))}
											</div>
										) : (
											<span className="text-slate-400 text-[11px]">-</span>
										)}
									</td>

									{/* 6. Kategori Transaksi (Status) */}
									<td className="py-2.5 px-3 text-center whitespace-nowrap">
										<span
											className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${
												car.status === "Ready"
													? "bg-emerald-50 text-emerald-700 border-emerald-200"
													: car.status === "Ter-DP"
														? "bg-amber-50 text-amber-800 border-amber-300"
														: "bg-slate-100 text-slate-700 border-slate-200"
											}`}
										>
											<span
												className={`w-1.5 h-1.5 rounded-full ${
													car.status === "Ready"
														? "bg-emerald-500"
														: car.status === "Ter-DP"
															? "bg-amber-500"
															: "bg-slate-400"
												}`}
											/>
											<span>{car.status}</span>
										</span>
									</td>

									{/* 7. Harga Jual */}
									<td className="py-2.5 px-3 text-right whitespace-nowrap">
										{car.status === "Ready" ? (
											(() => {
												const targetPrice = calculateTargetSellingPrice(
													car.capitalCost,
													car.serviceExpense,
												);
												const totalCost = (car.capitalCost || 0) + (car.serviceExpense || 0);
												if (targetPrice > 0) {
													const rawTarget = totalCost * 1.12;
													return (
														<span
															className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200/90 shadow-2xs select-none"
															title={`Rekomendasi 112% Total Modal (${formatRp(totalCost)}): ${formatRp(rawTarget)}`}
														>
															<span className="text-[9px] font-sans font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-1 py-0.2 rounded">
																Target
															</span>
															<span>{formatRp(targetPrice)}</span>
														</span>
													);
												}
												return <span className="text-slate-400 font-mono text-[11px]">-</span>;
											})()
										) : car.sellingPrice > 0 ? (
											<span className="font-mono font-semibold text-slate-900">
												{formatRp(car.sellingPrice)}
											</span>
										) : (
											<span className="text-slate-400 font-mono text-[11px]">-</span>
										)}
									</td>

									{/* 8. Modal */}
									<td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
										{formatRp(car.capitalCost)}
									</td>

									{/* 9. Pengeluaran Service */}
									<td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
										{car.serviceExpense > 0 ? (
											<span className="text-amber-700">{formatRp(car.serviceExpense)}</span>
										) : (
											<span className="text-slate-400">-</span>
										)}
									</td>

									{/* 10. Tanggal Terjual */}
									<td className="py-2.5 px-3 text-center text-slate-600 whitespace-nowrap">
										{car.soldDate || "-"}
									</td>

									{/* 11. Aksi */}
									<td className="py-2.5 px-3 text-right whitespace-nowrap">
										<div className="flex items-center justify-end gap-1">
											{/* Edit */}
											<button
												type="button"
												onClick={() => onEdit(car)}
												title="Edit data stok mobil"
												className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
											>
												<IconPencil className="w-3.5 h-3.5" />
											</button>

											{/* Delete */}
											<button
												type="button"
												onClick={() => onDelete(car)}
												title="Hapus unit stok"
												className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
											>
												<IconTrash2 className="w-3.5 h-3.5" />
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
