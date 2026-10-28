import { useMemo, useState } from "preact/hooks";
import IconAlertTriangle from "~icons/lucide/alert-triangle";
import IconTrash2 from "~icons/lucide/trash-2";
import IconX from "~icons/lucide/x";
import { StockCarItem, TransactionItem, VehicleExpenditureItem } from "../../../shared/schema";

interface DeleteStockConfirmModalProps {
	car: StockCarItem;
	transactions: TransactionItem[];
	expenditures: VehicleExpenditureItem[];
	onClose: () => void;
	onConfirm: (plateHash: string) => Promise<void>;
}

export function DeleteStockConfirmModal({
	car,
	transactions,
	expenditures,
	onClose,
	onConfirm,
}: DeleteStockConfirmModalProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Check if this car is referenced in TRANSAKSI or PENGELUARAN PER UNIT
	const blockingReason = useMemo(() => {
		const hasTrx = transactions.some(
			(t) => (t.id || t.plateNumber) === car.id || t.plateNumber === car.plateNumber,
		);
		if (hasTrx) {
			return "Mobil ini masih tercatat di sheet TRANSAKSI. Hapus transaksi terkait terlebih dahulu sebelum menghapus unit dari stok.";
		}

		const hasExp = expenditures.some((e) => e.id === car.id || e.plateNumber === car.plateNumber);
		if (hasExp) {
			return "Mobil ini masih memiliki catatan rincian di PENGELUARAN PER UNIT. Hapus pengeluaran unit terlebih dahulu sebelum menghapus dari stok.";
		}

		return null;
	}, [car, transactions, expenditures]);

	const handleDelete = async () => {
		if (blockingReason) return;
		setIsDeleting(true);
		setError(null);
		try {
			await onConfirm(car.id);
			onClose();
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Gagal menghapus unit dari stok");
			setIsDeleting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				{/* Modal Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-red-50/40">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
							<IconTrash2 className="w-4 h-4" />
						</div>
						<div>
							<h3 className="text-sm font-bold text-slate-900">Hapus Unit Stok Mobil</h3>
							<p className="text-xs text-slate-500 font-mono">{car.plateNumber}</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
					>
						<IconX className="w-5 h-5" />
					</button>
				</div>

				<div className="p-6 space-y-4">
					{error && (
						<div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
							{error}
						</div>
					)}

					{blockingReason ? (
						<div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
							<IconAlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
							<div>
								<h4 className="text-xs font-bold text-amber-900">Penghapusan Diblokir</h4>
								<p className="text-xs text-amber-700 mt-1 leading-relaxed">{blockingReason}</p>
							</div>
						</div>
					) : (
						<div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
							<p className="text-xs text-slate-600 leading-relaxed">
								Apakah Anda yakin ingin menghapus unit{" "}
								<strong className="text-slate-900">
									{car.carDescription} ({car.plateNumber})
								</strong>{" "}
								dari database stok mobil?
							</p>
							<p className="text-[11px] text-slate-400 mt-2">
								Tindakan ini akan menghapus baris unit di Google Sheets secara permanen.
							</p>
						</div>
					)}

					<div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
						<button
							type="button"
							onClick={onClose}
							disabled={isDeleting}
							className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
						>
							Batal
						</button>
						<button
							type="button"
							onClick={handleDelete}
							disabled={isDeleting || Boolean(blockingReason)}
							className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
						>
							{isDeleting ? (
								<>
									<span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									<span>Menghapus...</span>
								</>
							) : (
								<span>Ya, Hapus Unit</span>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
