import { formatRp, TransactionItem } from "../../shared/schema";
import { FilterState, SortColumn } from "../types";

interface TransactionTableProps {
	transactions: TransactionItem[];
	filters: FilterState;
	onSort: (col: SortColumn) => void;
	onEdit: (item: TransactionItem) => void;
	onDelete: (item: TransactionItem) => void;
	onQuickLunas: (item: TransactionItem) => void;
	isLoading: boolean;
}

export function TransactionTable({
	transactions,
	filters,
	onSort,
	onEdit,
	onDelete,
	onQuickLunas,
	isLoading,
}: TransactionTableProps) {
	const renderSortIcon = (col: SortColumn) => {
		if (filters.sortBy !== col) {
			return <span className="text-slate-300 ml-1 inline-block">↕</span>;
		}
		return (
			<span className="text-blue-600 ml-1 inline-block">
				{filters.sortDirection === "asc" ? "↑" : "↓"}
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

	if (transactions.length === 0) {
		return (
			<div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-12 text-center">
				<div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
					<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
				</div>
				<h4 className="text-sm font-semibold text-slate-800">Tidak ada transaksi ditemukan</h4>
				<p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
					Belum ada data transaksi atau tidak ada transaksi yang cocok dengan filter yang
					diterapkan.
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
							<th
								onClick={() => onSort("no")}
								className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								No {renderSortIcon("no")}
							</th>
							<th
								onClick={() => onSort("date")}
								className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								Tanggal {renderSortIcon("date")}
							</th>
							<th className="py-3 px-3 whitespace-nowrap">Mobil & Plat</th>
							<th className="py-3 px-3 whitespace-nowrap">Kategori</th>
							<th className="py-3 px-3 whitespace-nowrap">Pembeli & Kontak</th>
							<th
								onClick={() => onSort("price")}
								className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right whitespace-nowrap"
							>
								Harga Jual {renderSortIcon("price")}
							</th>
							<th className="py-3 px-3 text-right whitespace-nowrap">DP / Panjar</th>
							<th className="py-3 px-3 text-right whitespace-nowrap">Sisa</th>
							<th className="py-3 px-3 whitespace-nowrap">Sales</th>
							<th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
							<th className="py-3 px-3 text-center whitespace-nowrap">Aksi</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{transactions.map((item) => {
							const isLunas = item.status === "LUNAS";
							const sisa =
								item.remainingBalance != null
									? item.remainingBalance
									: isLunas
										? 0
										: item.sellingPrice - (item.downPayment ?? 0);

							return (
								<tr
									key={item.id || item.no}
									className="hover:bg-slate-50/80 transition-colors group"
								>
									{/* No */}
									<td className="py-2.5 px-3 font-semibold text-slate-800">#{item.no}</td>

									{/* Tanggal */}
									<td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
										{item.transactionDate}
									</td>

									{/* Mobil & Plat */}
									<td className="py-2.5 px-3">
										<div className="font-semibold text-slate-900 leading-tight">
											{item.carDescription}
										</div>
										<div className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
											{item.plateNumber}
										</div>
									</td>

									{/* Kategori */}
									<td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
										<span className="text-[11px] font-medium text-slate-700">{item.category}</span>
									</td>

									{/* Pembeli */}
									<td className="py-2.5 px-3">
										<div className="font-medium text-slate-900">{item.buyerName}</div>
										<div className="text-[11px] text-slate-500 font-mono">{item.phoneNumber}</div>
									</td>

									{/* Harga Jual */}
									<td className="py-2.5 px-3 text-right font-semibold text-slate-900 whitespace-nowrap">
										{formatRp(item.sellingPrice)}
									</td>

									{/* DP */}
									<td className="py-2.5 px-3 text-right text-slate-600 whitespace-nowrap">
										{item.downPayment ? formatRp(item.downPayment) : "-"}
									</td>

									{/* Sisa */}
									<td className="py-2.5 px-3 text-right whitespace-nowrap">
										<span
											className={`font-semibold ${sisa > 0 ? "text-amber-600" : "text-slate-400"}`}
										>
											{formatRp(sisa)}
										</span>
									</td>

									{/* Sales */}
									<td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
										{item.salesPerson}
									</td>

									{/* Status */}
									<td className="py-2.5 px-3 text-center whitespace-nowrap">
										<span
											className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
												isLunas
													? "bg-emerald-100 text-emerald-800 border border-emerald-200"
													: "bg-amber-100 text-amber-800 border border-amber-200"
											}`}
										>
											{item.status}
										</span>
									</td>

									{/* Aksi */}
									<td className="py-2.5 px-3 text-center whitespace-nowrap">
										<div className="flex items-center justify-center gap-1">
											{!isLunas && (
												<button
													onClick={() => onQuickLunas(item)}
													type="button"
													title="Tandai LUNAS"
													className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
												>
													<svg
														className="w-4 h-4"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M5 13l4 4L19 7"
														/>
													</svg>
												</button>
											)}
											<button
												onClick={() => onEdit(item)}
												type="button"
												title="Edit Transaksi"
												className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
											>
												<svg
													className="w-4 h-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
													/>
												</svg>
											</button>
											<button
												onClick={() => onDelete(item)}
												type="button"
												title="Hapus Transaksi"
												className="p-1 rounded text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
											>
												<svg
													className="w-4 h-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/>
												</svg>
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			<div className="py-2.5 px-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
				<span>Menampilkan {transactions.length} transaksi</span>
				<span className="text-[11px] text-slate-400">
					Data bersumber langsung dari sheet "TRANSAKSI"
				</span>
			</div>
		</div>
	);
}
