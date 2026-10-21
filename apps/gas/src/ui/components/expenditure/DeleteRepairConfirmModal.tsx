import { useState } from "preact/hooks";
import IconAlertTriangle from "~icons/lucide/alert-triangle";
import IconTrash2 from "~icons/lucide/trash-2";
import IconX from "~icons/lucide/x";
import { formatRp, RepairItem, VehicleExpenditureItem } from "../../../shared/schema";

interface DeleteRepairConfirmModalProps {
	vehicle: VehicleExpenditureItem;
	repair: RepairItem;
	repairIndex: number;
	onClose: () => void;
	onConfirm: () => Promise<void>;
}

export function DeleteRepairConfirmModal({
	vehicle,
	repair,
	onClose,
	onConfirm,
}: DeleteRepairConfirmModalProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const isLastRepair = vehicle.repairs.length <= 1;

	const handleConfirm = async () => {
		setIsDeleting(true);
		try {
			await onConfirm();
			onClose();
		} catch {
			setIsDeleting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
			<div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				{/* Modal Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-red-50/40">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
							<IconTrash2 className="w-4 h-4" />
						</div>
						<div>
							<h3 className="text-sm font-bold text-slate-900">Hapus Perbaikan</h3>
							<p className="text-xs text-slate-500 font-mono">{vehicle.plateNumber}</p>
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
					<p className="text-xs text-slate-600 leading-relaxed">
						Apakah Anda yakin ingin menghapus item perbaikan:
					</p>

					<div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
						<p className="font-semibold text-slate-800">{repair.description}</p>
						<p className="font-mono text-slate-600 mt-0.5">{formatRp(repair.cost)}</p>
					</div>

					{isLastRepair && (
						<div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2.5">
							<IconAlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
							<p className="text-[11px] text-amber-800 leading-snug">
								<strong>Perhatian:</strong> Ini adalah satu-satunya item perbaikan untuk kendaraan{" "}
								<strong>{vehicle.plateNumber}</strong>. Menghapus item ini juga akan{" "}
								<strong>menghapus baris kendaraan</strong> dari spreadsheet pengeluaran unit.
							</p>
						</div>
					)}

					<div className="flex items-center justify-end gap-2 pt-2">
						<button
							type="button"
							onClick={onClose}
							disabled={isDeleting}
							className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
						>
							Batal
						</button>
						<button
							type="button"
							onClick={handleConfirm}
							disabled={isDeleting}
							className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
						>
							{isDeleting ? "Menghapus..." : isLastRepair ? "Hapus Item & Unit" : "Hapus Perbaikan"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
