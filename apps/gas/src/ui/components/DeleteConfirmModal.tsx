import { useState } from "preact/hooks";
import { formatRp, TransactionItem } from "../../shared/schema";

interface DeleteConfirmModalProps {
	item: TransactionItem | null;
	onClose: () => void;
	onConfirm: (item: TransactionItem) => Promise<void>;
}

export function DeleteConfirmModal({
	item,
	onClose,
	onConfirm,
}: DeleteConfirmModalProps) {
	if (!item) return null;

	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

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
		<div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
				<div className="p-6 text-center space-y-4">
					<div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
						<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
					</div>

					<div>
						<h3 className="text-base font-bold text-slate-900">
							Hapus Transaksi #{item.no}?
						</h3>
						<p className="text-xs text-slate-500 mt-1">
							Baris transaksi ini akan dihapus secara permanen dari spreadsheet "TRANSAKSI".
						</p>
					</div>

					<div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-left text-xs space-y-1">
						<div className="font-semibold text-slate-800">{item.carDescription}</div>
						<div className="text-slate-500">
							Plat: <span className="font-mono font-bold text-slate-700">{item.plateNumber}</span>
						</div>
						<div className="text-slate-500">
							Pembeli: <span className="text-slate-700 font-medium">{item.buyerName}</span>
						</div>
						<div className="text-slate-500">
							Harga Jual: <span className="text-slate-900 font-semibold">{formatRp(item.sellingPrice)}</span>
						</div>
					</div>

					{error && (
						<div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
							{error}
						</div>
					)}

					<div className="flex items-center justify-end gap-2.5 pt-2">
						<button
							onClick={onClose}
							disabled={isDeleting}
							type="button"
							className="flex-1 px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
						>
							Batal
						</button>
						<button
							onClick={handleConfirm}
							disabled={isDeleting}
							type="button"
							className="flex-1 px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
						>
							{isDeleting && (
								<div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							)}
							<span>Hapus</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
