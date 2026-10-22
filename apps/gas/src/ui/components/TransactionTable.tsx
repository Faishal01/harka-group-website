import IconCheck from "~icons/lucide/check";
import IconClipboardList from "~icons/lucide/clipboard-list";
import IconPencil from "~icons/lucide/pencil";
import IconTrash2 from "~icons/lucide/trash-2";
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
					<IconClipboardList className="w-6 h-6 text-slate-400" />
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
							<th
								onClick={() => onSort("car")}
								className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								Deskripsi Mobil {renderSortIcon("car")}
							</th>
							<th className="py-3 px-3 whitespace-nowrap">Plat Nomor</th>
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
					<tbody className="divide-y divide-slate-100 text-slate-700">
						{transactions.map((item) => {
							const isLunas = item.status === "LUNAS";
							const remaining =
								item.remainingBalance != null
									? item.remainingBalance
									: item.sellingPrice - (item.downPayment ?? 0);

							return (
								<tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
									{/* No */}
									<td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
										#{item.no}
									</td>

									{/* Tanggal */}
									<td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
										{item.transactionDate}
									</td>

									{/* Deskripsi Mobil */}
									<td className="py-2.5 px-3 font-semibold text-slate-900 leading-tight">
										{item.carDescription}
									</td>

									{/* Plat Nomor */}
									<td className="py-2.5 px-3 whitespace-nowrap">
										<span className="inline-block px-1.5 py-0.5 text-[11px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
											{item.plateNumber}
										</span>
									</td>

									{/* Kategori */}
									<td className="py-2.5 px-3 whitespace-nowrap">
										<span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
											{item.category}
										</span>
									</td>

									{/* Pembeli & Kontak */}
									<td className="py-2.5 px-3">
										<div className="font-semibold text-slate-900">{item.buyerName}</div>
										<div className="text-[11px] text-slate-400 font-mono mt-0.5">
											{item.phoneNumber}
										</div>
									</td>

									{/* Harga Jual */}
									<td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
										{formatRp(item.sellingPrice)}
									</td>

									{/* DP */}
									<td className="py-2.5 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
										{item.downPayment ? formatRp(item.downPayment) : "-"}
									</td>

									{/* Sisa */}
									<td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
										{remaining > 0 ? (
											<span className="text-amber-600 font-semibold">{formatRp(remaining)}</span>
										) : (
											<span className="text-slate-400">-</span>
										)}
									</td>

									{/* Sales */}
									<td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
										{item.salesPerson}
									</td>

									{/* Status Badge */}
									<td className="py-2.5 px-3 text-center whitespace-nowrap">
										<span
											className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${
												isLunas
													? "bg-emerald-50 text-emerald-700 border-emerald-200"
													: "bg-amber-50 text-amber-800 border-amber-300"
											}`}
										>
											<span
												className={`w-1.5 h-1.5 rounded-full ${
													isLunas ? "bg-emerald-500" : "bg-amber-500"
												}`}
											/>
											<span>{item.status}</span>
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
													className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
												>
													<IconCheck className="w-3.5 h-3.5" />
												</button>
											)}
											<button
												onClick={() => onEdit(item)}
												type="button"
												title="Edit Transaksi"
												className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
											>
												<IconPencil className="w-3.5 h-3.5" />
											</button>
											<button
												onClick={() => onDelete(item)}
												type="button"
												title="Hapus Transaksi"
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
