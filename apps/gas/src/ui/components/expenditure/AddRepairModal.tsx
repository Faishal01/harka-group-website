import { useState } from "preact/hooks";
import IconWrench from "~icons/lucide/wrench";
import IconX from "~icons/lucide/x";
import { AddRepairInput, formatRp, VehicleExpenditureItem } from "../../../shared/schema";
import { RepairCombobox } from "./RepairCombobox";

interface AddRepairModalProps {
	vehicle: VehicleExpenditureItem;
	existingRepairDescriptions?: string[];
	onClose: () => void;
	onSubmit: (payload: AddRepairInput) => Promise<void>;
}

export function AddRepairModal({
	vehicle,
	existingRepairDescriptions = [],
	onClose,
	onSubmit,
}: AddRepairModalProps) {
	const [description, setDescription] = useState("");
	const [cost, setCost] = useState<number | "">("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		if (!description.trim()) {
			setError("Deskripsi perbaikan wajib diisi");
			return;
		}
		const numericCost = typeof cost === "number" ? cost : 0;
		if (numericCost <= 0) {
			setError("Biaya perbaikan harus lebih dari 0");
			return;
		}

		setIsSubmitting(true);
		setError(null);
		try {
			await onSubmit({
				vehiclePlateHash: vehicle.id,
				description: description.trim(),
				cost: numericCost,
			});
			onClose();
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Gagal menambahkan perbaikan");
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
			<div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				{/* Modal Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
							<IconWrench className="w-4 h-4" />
						</div>
						<div>
							<h3 className="text-sm font-bold text-slate-900">Tambah Perbaikan Unit</h3>
							<p className="text-xs text-slate-500 font-mono">
								{vehicle.plateNumber} • {vehicle.carDescription}
							</p>
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

				<form
					onSubmit={handleSubmit}
					onKeyDown={(e) => {
						const target = e.target as HTMLElement;
						if (e.key === "Enter" && target.tagName !== "TEXTAREA" && target.tagName !== "BUTTON") {
							e.preventDefault();
						}
					}}
					className="p-6 space-y-4"
				>
					{error && (
						<div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
							{error}
						</div>
					)}

					<div>
						<label className="block text-xs font-semibold text-slate-700 mb-1">
							Deskripsi Perbaikan <span className="text-red-500">*</span>
						</label>
						<RepairCombobox
							required
							autoFocus
							value={description}
							onChange={setDescription}
							options={existingRepairDescriptions}
							placeholder="Pilih dari daftar atau ketik perbaikan baru..."
						/>
					</div>

					<div>
						<label className="block text-xs font-semibold text-slate-700 mb-1">
							Biaya (Rp) <span className="text-red-500">*</span>
						</label>
						<input
							type="number"
							required
							min="0"
							placeholder="0"
							value={cost}
							onInput={(e) => {
								const val = (e.target as HTMLInputElement).value;
								setCost(val === "" ? "" : Math.max(0, parseInt(val, 10) || 0));
							}}
							className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
						/>
						{typeof cost === "number" && cost > 0 && (
							<p className="text-[11px] text-blue-600 font-medium mt-1 font-mono">
								Preview: {formatRp(cost)}
							</p>
						)}
					</div>

					<div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
						<button
							type="button"
							onClick={onClose}
							disabled={isSubmitting}
							className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
						>
							Batal
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
						>
							{isSubmitting ? "Menyimpan..." : "Tambah Perbaikan"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
