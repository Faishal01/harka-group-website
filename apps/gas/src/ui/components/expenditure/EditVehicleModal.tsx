import { useState } from "preact/hooks";
import IconLock from "~icons/lucide/lock";
import IconPencil from "~icons/lucide/pencil";
import IconX from "~icons/lucide/x";
import { UpdateVehicleDescriptionInput, VehicleExpenditureItem } from "../../../shared/schema";

interface EditVehicleModalProps {
	vehicle: VehicleExpenditureItem;
	onClose: () => void;
	onSubmit: (payload: UpdateVehicleDescriptionInput) => Promise<void>;
}

export function EditVehicleModal({ vehicle, onClose, onSubmit }: EditVehicleModalProps) {
	const [carDescription, setCarDescription] = useState(vehicle.carDescription);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		const trimmed = carDescription.trim();
		if (!trimmed) {
			setError("Deskripsi mobil wajib diisi");
			return;
		}

		setIsSubmitting(true);
		setError(null);
		try {
			await onSubmit({
				vehiclePlateHash: vehicle.id,
				carDescription: trimmed,
			});
			onClose();
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Gagal memperbarui deskripsi mobil");
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
			<div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				{/* Modal Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
							<IconPencil className="w-4 h-4" />
						</div>
						<div>
							<h3 className="text-sm font-bold text-slate-900">Edit Deskripsi Mobil</h3>
							<p className="text-xs text-slate-500">Perbarui identitas unit kendaraan</p>
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

				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					{error && (
						<div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
							{error}
						</div>
					)}

					{/* Plat Nomor (Read-only Identifier) */}
					<div>
						<label className="block text-xs font-semibold text-slate-700 mb-1">
							Plat Nomor Kendaraan
						</label>
						<div className="flex items-center justify-between px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-mono font-bold">
							<span>{vehicle.plateNumber}</span>
							<span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-slate-400">
								<IconLock className="w-3 h-3" />
								<span>ID Tetap</span>
							</span>
						</div>
						<p className="text-[10px] text-slate-400 mt-1">
							Plat nomor berfungsi sebagai pengenal unik kendaraan dan tidak dapat diubah.
						</p>
					</div>

					{/* Deskripsi Mobil (Editable) */}
					<div>
						<label className="block text-xs font-semibold text-slate-700 mb-1">
							Deskripsi Mobil <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							required
							autoFocus
							placeholder="Contoh: Toyota Innova Zenix 2.0 V CVT"
							value={carDescription}
							onInput={(e) => setCarDescription((e.target as HTMLInputElement).value)}
							className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
						/>
					</div>

					{/* Actions */}
					<div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
						<button
							type="button"
							onClick={onClose}
							disabled={isSubmitting}
							className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
						>
							Batal
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
						>
							{isSubmitting ? (
								<>
									<span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									<span>Menyimpan...</span>
								</>
							) : (
								<span>Simpan Perubahan</span>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
