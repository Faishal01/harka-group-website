import { useState } from "preact/hooks";
import IconAlertTriangle from "~icons/lucide/alert-triangle";
import IconTrash2 from "~icons/lucide/trash-2";
import IconX from "~icons/lucide/x";
import { InventoryItem } from "../../../shared/schema";

interface DeleteInventoryConfirmModalProps {
	item: InventoryItem;
	onClose: () => void;
	onConfirm: (no: number) => Promise<void>;
}

export function DeleteInventoryConfirmModal({
	item,
	onClose,
	onConfirm,
}: DeleteInventoryConfirmModalProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleDelete = async () => {
		setIsDeleting(true);
		setError(null);
		try {
			await onConfirm(item.no);
			onClose();
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Gagal menghapus barang dari inventaris");
			setIsDeleting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
			<div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				{/* Modal Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-red-50/40">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
							<IconAlertTriangle className="w-5 h-5" />
						</div>
						<div>
							<h3 className="text-base font-bold text-slate-800">Hapus Barang Inventaris</h3>
							<p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
						</div>
					</div>
					<button
						onClick={onClose}
						disabled={isDeleting}
						type="button"
						className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
					>
						<IconX className="w-4 h-4" />
					</button>
				</div>

				{/* Modal Content */}
				<div className="p-6 space-y-4">
					{error && (
						<div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
							<span className="font-bold">Error:</span>
							<span>{error}</span>
						</div>
					)}

					<p className="text-sm text-slate-600">
						Apakah Anda yakin ingin menghapus barang inventaris berikut dari Google Sheet?
					</p>

					{/* Item Details Box */}
					<div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-1.5">
						<div className="flex items-center justify-between text-xs">
							<span className="text-slate-400">No:</span>
							<span className="font-mono font-semibold text-slate-700">#{item.no}</span>
						</div>
						<div className="flex items-center justify-between text-xs">
							<span className="text-slate-400">Nama Barang:</span>
							<span className="font-semibold text-slate-900 text-right">{item.namaBarang}</span>
						</div>
						<div className="flex items-center justify-between text-xs">
							<span className="text-slate-400">Sisa Stok:</span>
							<span className="font-mono font-semibold text-slate-700">
								{item.tersedia} unit (Awal: {item.stokAwal}, Terpakai: {item.terpakai})
							</span>
						</div>
						{item.ditujukan && (
							<div className="flex items-start justify-between text-xs pt-1 border-t border-slate-200/60">
								<span className="text-slate-400">Ditujukan:</span>
								<span className="text-slate-600 text-right max-w-[200px] truncate">
									{item.ditujukan}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Modal Actions */}
				<div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/60 border-t border-slate-100">
					<button
						type="button"
						onClick={onClose}
						disabled={isDeleting}
						className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
					>
						Batal
					</button>
					<button
						type="button"
						onClick={handleDelete}
						disabled={isDeleting}
						className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm shadow-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
					>
						{isDeleting ? (
							<>
								<div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								<span>Menghapus...</span>
							</>
						) : (
							<>
								<IconTrash2 className="w-4 h-4" />
								<span>Hapus Permanen</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
