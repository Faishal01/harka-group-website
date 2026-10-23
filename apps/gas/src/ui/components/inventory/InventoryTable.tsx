import IconPackage from "~icons/lucide/package";
import IconPencil from "~icons/lucide/pencil";
import IconTrash2 from "~icons/lucide/trash-2";
import IconWrench from "~icons/lucide/wrench";
import {
	formatRp,
	InventoryFilterState,
	InventoryItem,
	InventorySortColumn,
} from "../../../shared/schema";

interface InventoryTableProps {
	items: InventoryItem[];
	filters: InventoryFilterState;
	onSort: (column: InventorySortColumn) => void;
	isLoading: boolean;
	onEdit: (item: InventoryItem) => void;
	onConsume: (item: InventoryItem) => void;
	onDelete: (item: InventoryItem) => void;
}

export function InventoryTable({
	items,
	filters,
	onSort,
	isLoading,
	onEdit,
	onConsume,
	onDelete,
}: InventoryTableProps) {
	const renderSortIcon = (col: InventorySortColumn) => {
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

	if (items.length === 0) {
		return (
			<div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-12 text-center">
				<div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
					<IconPackage className="w-6 h-6 text-slate-400" />
				</div>
				<h4 className="text-sm font-semibold text-slate-800">
					Tidak ada barang inventaris ditemukan
				</h4>
				<p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
					Belum ada data barang atau tidak ada barang yang cocok dengan filter yang diterapkan.
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
								className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								No {renderSortIcon("no")}
							</th>

							{/* 2. Nama Barang */}
							<th
								onClick={() => onSort("namaBarang")}
								className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
							>
								Nama Barang {renderSortIcon("namaBarang")}
							</th>

							{/* 3. Harga */}
							<th className="py-3 px-3 text-right whitespace-nowrap">Harga</th>

							{/* 4. Stok Awal */}
							<th className="py-3 px-3 text-center whitespace-nowrap">Stok Awal</th>

							{/* 5. Terpakai */}
							<th className="py-3 px-3 text-center whitespace-nowrap">Terpakai</th>

							{/* 6. Tersedia */}
							<th className="py-3 px-3 text-center whitespace-nowrap">Tersedia</th>

							{/* 7. Status */}
							<th className="py-3 px-3 text-center whitespace-nowrap">Status</th>

							{/* 8. Ditujukan */}
							<th className="py-3 px-3 whitespace-nowrap">Ditujukan</th>

							{/* 9. Aksi */}
							<th className="py-3 px-3 text-center whitespace-nowrap">Aksi</th>
						</tr>
					</thead>

					<tbody className="divide-y divide-slate-100 text-slate-700">
						{items.map((item) => {
							const isOutOfStock = item.tersedia <= 0;
							const isRestock = item.status === "PERLU RESTOCK";

							return (
								<tr key={item.no} className="hover:bg-slate-50/80 transition-colors group">
									{/* 1. No */}
									<td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
										#{item.no}
									</td>

									{/* 2. Nama Barang */}
									<td className="py-2.5 px-3 font-semibold text-slate-900 leading-tight">
										<div>{item.namaBarang}</div>
										<div className="text-[11px] text-slate-400 font-normal mt-0.5">
											Batas restock: ≤ {item.threshold} unit
										</div>
									</td>

									{/* 3. Harga */}
									<td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
										{item.harga > 0 ? (
											formatRp(item.harga)
										) : (
											<span className="text-slate-400 font-normal">-</span>
										)}
									</td>

									{/* 4. Stok Awal */}
									<td className="py-2.5 px-3 text-center font-mono text-slate-600 whitespace-nowrap">
										{item.stokAwal}
									</td>

									{/* 5. Terpakai */}
									<td className="py-2.5 px-3 text-center font-mono text-slate-600 whitespace-nowrap">
										{item.terpakai}
									</td>

									{/* 6. Tersedia */}
									<td className="py-2.5 px-3 text-center font-mono font-semibold whitespace-nowrap">
										<span
											className={
												isOutOfStock
													? "text-rose-600"
													: isRestock
														? "text-amber-600"
														: "text-slate-900"
											}
										>
											{item.tersedia}
										</span>
									</td>

									{/* 7. Status */}
									<td className="py-2.5 px-3 text-center whitespace-nowrap">
										<span
											className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${
												isOutOfStock
													? "bg-rose-50 text-rose-800 border-rose-300"
													: isRestock
														? "bg-amber-50 text-amber-800 border-amber-300"
														: "bg-emerald-50 text-emerald-700 border-emerald-200"
											}`}
										>
											<span
												className={`w-1.5 h-1.5 rounded-full ${
													isOutOfStock
														? "bg-rose-500"
														: isRestock
															? "bg-amber-500"
															: "bg-emerald-500"
												}`}
											/>
											<span>{isOutOfStock ? "HABIS" : item.status}</span>
										</span>
									</td>

									{/* 8. Ditujukan (Mobil) */}
									<td className="py-2.5 px-3 text-slate-600 text-xs">
										{item.ditujukan ? (
											<div className="line-clamp-2 max-w-xs" title={item.ditujukan}>
												{item.ditujukan}
											</div>
										) : (
											<span className="text-slate-400 font-mono">-</span>
										)}
									</td>

									{/* 9. Aksi */}
									<td className="py-2.5 px-3 text-center whitespace-nowrap">
										<div className="flex items-center justify-center gap-1">
											<button
												onClick={() => onConsume(item)}
												type="button"
												title="Pakai Barang"
												className="p-1 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
											>
												<IconWrench className="w-3.5 h-3.5" />
											</button>
											<button
												onClick={() => onEdit(item)}
												type="button"
												title="Edit Barang"
												className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
											>
												<IconPencil className="w-3.5 h-3.5" />
											</button>
											<button
												onClick={() => onDelete(item)}
												type="button"
												title="Hapus Barang"
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
