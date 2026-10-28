import { useMemo, useState } from "preact/hooks";
import IconAlertTriangle from "~icons/lucide/alert-triangle";
import IconPackage from "~icons/lucide/package";
import IconWrench from "~icons/lucide/wrench";
import IconX from "~icons/lucide/x";
import {
	AddRepairInput,
	formatRp,
	InventoryItem,
	VehicleExpenditureItem,
} from "../../../shared/schema";
import { RepairCombobox } from "./RepairCombobox";

interface AddRepairModalProps {
	vehicle: VehicleExpenditureItem;
	existingRepairDescriptions?: string[];
	inventoryItems?: InventoryItem[];
	onClose: () => void;
	onSubmit: (payload: AddRepairInput) => Promise<void>;
}

export function AddRepairModal({
	vehicle,
	existingRepairDescriptions = [],
	inventoryItems = [],
	onClose,
	onSubmit,
}: AddRepairModalProps) {
	const [description, setDescription] = useState("");
	const [quantity, setQuantity] = useState<number | "">(1);
	const [manualCost, setManualCost] = useState<number | "">("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Match description against Inventory Showroom items (case-insensitive)
	const matchedInventory = useMemo(() => {
		const target = description.trim().toLowerCase();
		if (!target) return null;
		return inventoryItems.find((item) => item.namaBarang.trim().toLowerCase() === target) || null;
	}, [description, inventoryItems]);

	const isInventoryItem = matchedInventory !== null;
	const hasLockedUnitPrice = isInventoryItem && matchedInventory.harga > 0;
	const numericQty = typeof quantity === "number" && quantity > 0 ? quantity : 1;

	const effectiveCost = useMemo(() => {
		if (hasLockedUnitPrice && matchedInventory) {
			return numericQty * matchedInventory.harga;
		}
		return typeof manualCost === "number" ? manualCost : 0;
	}, [hasLockedUnitPrice, matchedInventory, numericQty, manualCost]);

	const isOutOfStock = isInventoryItem && matchedInventory.tersedia <= 0;
	const isExceedingStock =
		isInventoryItem &&
		!isOutOfStock &&
		(typeof quantity !== "number" || quantity <= 0 || quantity > matchedInventory.tersedia);

	const isSubmitDisabled =
		isSubmitting || isOutOfStock || isExceedingStock || !description.trim() || effectiveCost <= 0;

	const handleDescriptionChange = (val: string, inv?: InventoryItem | null) => {
		setDescription(val);
		if (inv) {
			if (quantity === "" || (typeof quantity === "number" && quantity <= 0)) {
				setQuantity(1);
			}
		}
	};

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		if (!description.trim()) {
			setError("Deskripsi perbaikan wajib diisi");
			return;
		}
		if (isInventoryItem) {
			if (isOutOfStock) {
				setError(`Stok "${matchedInventory.namaBarang}" sedang habis (Tersedia: 0).`);
				return;
			}
			if (typeof quantity !== "number" || quantity <= 0) {
				setError("Kuantitas barang inventaris minimal 1 unit.");
				return;
			}
			if (quantity > matchedInventory.tersedia) {
				setError(
					`Kuantitas (${quantity}) melebihi stok yang tersedia (${matchedInventory.tersedia} unit).`,
				);
				return;
			}
		}
		if (effectiveCost <= 0) {
			setError("Biaya perbaikan harus lebih dari 0");
			return;
		}

		setIsSubmitting(true);
		setError(null);
		try {
			await onSubmit({
				vehiclePlateHash: vehicle.id,
				description: description.trim(),
				quantity: isInventoryItem ? numericQty : null,
				cost: effectiveCost,
			});
			onClose();
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Gagal menambahkan perbaikan");
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
			<div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md my-auto animate-in fade-in zoom-in-95 duration-150">
				{/* Modal Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
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
							onChange={handleDescriptionChange}
							options={existingRepairDescriptions}
							inventoryItems={inventoryItems}
							placeholder="Pilih dari Inventory Showroom atau ketik perbaikan..."
						/>
						{matchedInventory && (
							<div
								className={`mt-2 px-3 py-2 rounded-lg border text-xs flex items-center justify-between ${
									isOutOfStock
										? "bg-rose-50 border-rose-200 text-rose-800"
										: "bg-indigo-50/70 border-indigo-200 text-indigo-900"
								}`}
							>
								<div className="flex items-center gap-1.5 font-medium">
									<IconPackage className="w-3.5 h-3.5 shrink-0" />
									<span>Barang Inventory Showroom</span>
								</div>
								<div className="font-mono text-[11px] font-bold">
									{matchedInventory.harga > 0
										? `${formatRp(matchedInventory.harga)} / unit`
										: "Harga manual"}{" "}
									• Stok: {matchedInventory.tersedia}
								</div>
							</div>
						)}
					</div>

					{/* Stock Out / Exceeded Warning */}
					{isInventoryItem && (isOutOfStock || isExceedingStock) && (
						<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
							<IconAlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
							<div>
								{isOutOfStock ? (
									<span>
										Stok <strong>{matchedInventory.namaBarang}</strong> di Inventory Showroom sedang{" "}
										<strong>HABIS (0)</strong>. Tidak dapat menambahkan item ini.
									</span>
								) : (
									<span>
										Kuantitas melebihi stok yang tersedia di Inventory Showroom (Maksimal:{" "}
										<strong>{matchedInventory.tersedia} unit</strong>).
									</span>
								)}
							</div>
						</div>
					)}

					{/* Kuantitas & Biaya Grid */}
					<div className="grid grid-cols-3 gap-3">
						{/* Kuantitas (Enabled only for Inventory Showroom items) */}
						<div className="col-span-1">
							<label className="block text-xs font-semibold text-slate-700 mb-1">
								Kuantitas {isInventoryItem && <span className="text-red-500">*</span>}
							</label>
							{isInventoryItem ? (
								<input
									type="number"
									required
									min="1"
									max={matchedInventory.tersedia > 0 ? matchedInventory.tersedia : undefined}
									disabled={isOutOfStock}
									value={quantity}
									onInput={(e) => {
										const val = (e.target as HTMLInputElement).value;
										setQuantity(val === "" ? "" : Math.max(0, parseInt(val, 10) || 0));
									}}
									className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-hidden focus:ring-2 font-mono text-center font-semibold ${
										isOutOfStock || isExceedingStock
											? "border-rose-300 bg-rose-50/40 text-rose-800 focus:ring-rose-500/20"
											: "border-slate-200 text-slate-900 focus:ring-blue-500/20 focus:border-blue-500"
									}`}
								/>
							) : (
								<input
									type="text"
									disabled
									value="—"
									title="Kuantitas hanya aktif untuk barang dari Inventory Showroom"
									className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 text-slate-400 rounded-lg font-mono text-center cursor-not-allowed select-none"
								/>
							)}
						</div>

						{/* Biaya (Locked to Qty * Harga for Inventory items with price > 0) */}
						<div className="col-span-2">
							<label className="block text-xs font-semibold text-slate-700 mb-1">
								Biaya (Rp) <span className="text-red-500">*</span>
							</label>
							{hasLockedUnitPrice ? (
								<input
									type="text"
									readOnly
									disabled
									value={formatRp(effectiveCost)}
									title="Biaya dihitung otomatis dari Kuantitas × Harga Satuan Inventory"
									className="w-full px-3 py-2 text-xs border border-indigo-200 bg-indigo-50/50 text-indigo-900 font-bold rounded-lg font-mono cursor-not-allowed"
								/>
							) : (
								<input
									type="number"
									required
									min="0"
									placeholder="0"
									value={manualCost}
									onInput={(e) => {
										const val = (e.target as HTMLInputElement).value;
										setManualCost(val === "" ? "" : Math.max(0, parseInt(val, 10) || 0));
									}}
									className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
								/>
							)}
							{!hasLockedUnitPrice && effectiveCost > 0 && (
								<p className="text-[11px] text-blue-600 font-medium mt-1 font-mono">
									Preview: {formatRp(effectiveCost)}
								</p>
							)}
							{hasLockedUnitPrice && (
								<p className="text-[10px] text-indigo-600 font-medium mt-1 font-mono">
									Otomatis: {numericQty} × {formatRp(matchedInventory.harga)}
								</p>
							)}
						</div>
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
							disabled={isSubmitDisabled}
							className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
						>
							{isSubmitting ? "Menyimpan..." : "Tambah Perbaikan"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
