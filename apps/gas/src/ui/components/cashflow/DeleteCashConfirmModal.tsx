import { useState } from "preact/hooks";
import IconAlertTriangle from "~icons/lucide/alert-triangle";
import { CashTransactionItem, formatRp } from "../../../shared/schema";

interface DeleteCashConfirmModalProps {
	item: CashTransactionItem | null;
	onClose: () => void;
	onConfirm: (item: CashTransactionItem) => Promise<void>;
}

export function DeleteCashConfirmModal({ item, onClose, onConfirm }: DeleteCashConfirmModalProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!item) return null;

	const handleConfirm = async () => {
		try {
			setIsDeleting(true);
			setError(null);
			await onConfirm(item);
			onClose();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			setError(msg);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
				<div className="p-6 text-center space-y-4">
					<div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
						<IconAlertTriangle className="w-6 h-6" />
					</div>

					<div>
						<h3 className="text-base font-bold text-slate-900">
							Hapus Transaksi Kas Baris #{item.rowIdx}?
						</h3>
						<p className="text-xs text-slate-500 mt-1">
							Baris transaksi ini akan dihapus secara permanen dari spreadsheet "PENGELUARAN KAS".
						</p>
					</div>

					<div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-left text-xs space-y-1.5">
						<div className="font-semibold text-slate-900 text-sm">{item.description}</div>
						<div className="flex items-center justify-between text-slate-500">
							<span>Tanggal:</span>
							<span className="font-medium text-slate-800">{item.date}</span>
						</div>
						<div className="flex items-center justify-between text-slate-500">
							<span>Kategori:</span>
							<span className="font-medium text-slate-800">{item.category}</span>
						</div>
						<div className="flex items-center justify-between text-slate-500">
							<span>Jenis Transaksi:</span>
							<span
								className={`font-bold ${item.type === "IN" ? "text-emerald-600" : "text-rose-600"}`}
							>
								{item.type === "IN" ? "Pemasukan (Kas Masuk)" : "Pengeluaran (Kas Keluar)"}
							</span>
						</div>
						<div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
							<span>Nominal:</span>
							<span
								className={`font-mono font-bold text-sm ${
									item.type === "IN" ? "text-emerald-600" : "text-rose-600"
								}`}
							>
								{formatRp(item.amount)}
							</span>
						</div>
					</div>

					<div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-left text-[11px] text-amber-800 leading-relaxed">
						Tindakan ini permanen. Saldo kas akan otomatis disesuaikan.
					</div>

					{error && (
						<div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
							{error}
						</div>
					)}

					<div className="flex gap-2.5 pt-2">
						<button
							onClick={onClose}
							type="button"
							disabled={isDeleting}
							className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
						>
							Batal
						</button>
						<button
							onClick={handleConfirm}
							type="button"
							disabled={isDeleting}
							className="flex-1 py-2 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
						>
							{isDeleting ? (
								<>
									<div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									<span>Menghapus...</span>
								</>
							) : (
								<span>Ya, Hapus</span>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
