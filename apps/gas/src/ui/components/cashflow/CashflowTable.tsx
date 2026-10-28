import IconExternalLink from "~icons/lucide/external-link";
import IconFile from "~icons/lucide/file";
import IconFileText from "~icons/lucide/file-text";
import IconImage from "~icons/lucide/image";
import IconPencil from "~icons/lucide/pencil";
import IconReceipt from "~icons/lucide/receipt";
import IconTrash2 from "~icons/lucide/trash-2";
import { CashTransactionItem, formatRp } from "../../../shared/schema";

interface CashflowTableProps {
	items: CashTransactionItem[];
	onEdit: (item: CashTransactionItem) => void;
	onDelete: (item: CashTransactionItem) => void;
	isLoading: boolean;
}

export function CashflowTable({ items, onEdit, onDelete, isLoading }: CashflowTableProps) {
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
					<IconReceipt className="w-6 h-6 text-slate-400" />
				</div>
				<h4 className="text-sm font-semibold text-slate-800">Tidak ada transaksi kas</h4>
				<p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
					Belum ada catatan transaksi kas operasional atau tidak ada yang sesuai dengan filter.
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
							<th className="py-3 px-3 whitespace-nowrap">Baris</th>
							<th className="py-3 px-3 whitespace-nowrap">Tanggal</th>
							<th className="py-3 px-3 whitespace-nowrap">Keterangan</th>
							<th className="py-3 px-3 whitespace-nowrap">Kategori</th>
							<th className="py-3 px-3 text-right whitespace-nowrap">Uang Keluar</th>
							<th className="py-3 px-3 text-right whitespace-nowrap">Uang Masuk</th>
							<th className="py-3 px-3 text-right whitespace-nowrap">Sisa Saldo</th>
							<th className="py-3 px-3 whitespace-nowrap">Bukti / Lampiran</th>
							<th className="py-3 px-3 text-center whitespace-nowrap">Aksi</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100 text-slate-700">
						{items.map((item) => {
							const hasAttachment = Boolean(item.attachmentUrl);
							const attachmentType = item.attachmentType || "file";

							return (
								<tr key={item.rowIdx} className="hover:bg-slate-50/80 transition-colors group">
									{/* Baris */}
									<td className="py-2.5 px-3 font-semibold text-slate-400 whitespace-nowrap font-mono">
										#{item.rowIdx}
									</td>

									{/* Tanggal */}
									<td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{item.date}</td>

									{/* Keterangan */}
									<td className="py-2.5 px-3 font-semibold text-slate-900 leading-snug max-w-xs md:max-w-md">
										{item.description}
									</td>

									{/* Kategori */}
									<td className="py-2.5 px-3 whitespace-nowrap">
										<span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
											{item.category}
										</span>
									</td>

									{/* Uang Keluar */}
									<td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
										{item.cashOut > 0 ? (
											<span className="text-rose-600 font-semibold">{formatRp(item.cashOut)}</span>
										) : (
											<span className="text-slate-300">-</span>
										)}
									</td>

									{/* Uang Masuk */}
									<td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
										{item.cashIn > 0 ? (
											<span className="text-emerald-600 font-semibold">
												{formatRp(item.cashIn)}
											</span>
										) : (
											<span className="text-slate-300">-</span>
										)}
									</td>

									{/* Sisa Saldo */}
									<td className="py-2.5 px-3 text-right font-mono whitespace-nowrap font-bold text-slate-900">
										<span className={item.balance < 0 ? "text-rose-600" : "text-slate-900"}>
											{formatRp(item.balance)}
										</span>
									</td>

									{/* Bukti / Lampiran (Smart Chip representation) */}
									<td className="py-2.5 px-3 whitespace-nowrap">
										{hasAttachment ? (
											<a
												href={item.attachmentUrl}
												target="_blank"
												rel="noopener noreferrer"
												title={`Buka lampiran: ${item.notes || item.attachmentUrl}`}
												className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200/60 max-w-44 truncate"
											>
												{attachmentType === "pdf" ? (
													<IconFileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
												) : attachmentType === "image" ? (
													<IconImage className="w-3.5 h-3.5 text-purple-600 shrink-0" />
												) : (
													<IconFile className="w-3.5 h-3.5 text-blue-600 shrink-0" />
												)}
												<span className="truncate">{item.notes || "Lampiran Drive"}</span>
												<IconExternalLink className="w-3 h-3 text-blue-400 shrink-0 ml-0.5" />
											</a>
										) : item.notes ? (
											<span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200/60 max-w-40 truncate">
												{item.notes}
											</span>
										) : (
											<span className="text-slate-300">-</span>
										)}
									</td>

									{/* Aksi */}
									<td className="py-2.5 px-3 text-center whitespace-nowrap">
										<div className="flex items-center justify-center gap-1">
											<button
												onClick={() => onEdit(item)}
												type="button"
												title="Edit Transaksi Kas"
												className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
											>
												<IconPencil className="w-3.5 h-3.5" />
											</button>
											<button
												onClick={() => onDelete(item)}
												type="button"
												title="Hapus Transaksi Kas"
												className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
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
