import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import IconCar from "~icons/lucide/car";
import IconCheck from "~icons/lucide/check";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconPlus from "~icons/lucide/plus";
import IconTrash2 from "~icons/lucide/trash-2";
import IconX from "~icons/lucide/x";
import {
	formatRp,
	hashPlate,
	normalizePlate,
	StockCarItem,
	TransactionItem,
	VehicleExpenditureCreateInput,
	VehicleExpenditureItem,
} from "../../../shared/schema";
import { RepairCombobox } from "./RepairCombobox";

interface ExpenditureCreateModalProps {
	existingExpenditures: VehicleExpenditureItem[];
	transactionCars: TransactionItem[];
	stockCars?: StockCarItem[];
	existingRepairDescriptions?: string[];
	onClose: () => void;
	onSubmit: (payload: VehicleExpenditureCreateInput) => Promise<void>;
}

interface RepairLineDraft {
	description: string;
	cost: number | "";
}

export function ExpenditureCreateModal({
	existingExpenditures,
	transactionCars,
	stockCars = [],
	existingRepairDescriptions,
	onClose,
	onSubmit,
}: ExpenditureCreateModalProps) {
	const [carQuery, setCarQuery] = useState("");
	const [carDescription, setCarDescription] = useState("");
	const [plateNumber, setPlateNumber] = useState("");
	const [repairs, setRepairs] = useState<RepairLineDraft[]>([{ description: "", cost: "" }]);
	const [isCarDropdownOpen, setIsCarDropdownOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const dropdownRef = useRef<HTMLDivElement>(null);

	// Deduplicated list of available cars: prioritized from STOK MOBIL, fallback to TRANSAKSI
	const uniqueCars = useMemo(() => {
		const map = new Map<string, { carDescription: string; plateNumber: string }>();

		if (stockCars && stockCars.length > 0) {
			for (const s of stockCars) {
				const cleanPlate = normalizePlate(s.plateNumber);
				if (cleanPlate && !map.has(cleanPlate)) {
					map.set(cleanPlate, {
						carDescription: s.carDescription || "",
						plateNumber: cleanPlate,
					});
				}
			}
		}

		if (map.size === 0 && transactionCars) {
			for (const t of transactionCars) {
				const cleanPlate = normalizePlate(t.plateNumber);
				if (cleanPlate && !map.has(cleanPlate)) {
					map.set(cleanPlate, {
						carDescription: t.carDescription || "",
						plateNumber: cleanPlate,
					});
				}
			}
		}

		return Array.from(map.values());
	}, [stockCars, transactionCars]);

	// Filtered cars based on search input
	const filteredCars = useMemo(() => {
		const q = carQuery.trim().toLowerCase();
		if (!q) return uniqueCars;
		return uniqueCars.filter(
			(c) => c.plateNumber.toLowerCase().includes(q) || c.carDescription.toLowerCase().includes(q),
		);
	}, [uniqueCars, carQuery]);

	// Repair description suggestions from entire expenditure dataset
	const repairOptions = useMemo(() => {
		if (existingRepairDescriptions && existingRepairDescriptions.length > 0) {
			return existingRepairDescriptions;
		}
		const set = new Set<string>();
		for (const v of existingExpenditures) {
			for (const r of v.repairs) {
				const desc = r.description.trim();
				if (desc) set.add(desc);
			}
		}
		return Array.from(set).sort((a, b) => a.localeCompare(b, "id", { sensitivity: "base" }));
	}, [existingRepairDescriptions, existingExpenditures]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setIsCarDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Add new repair line
	const handleAddRepairLine = () => {
		setRepairs([...repairs, { description: "", cost: "" }]);
	};

	// Remove repair line
	const handleRemoveRepairLine = (index: number) => {
		if (repairs.length <= 1) return;
		setRepairs(repairs.filter((_, i) => i !== index));
	};

	// Update repair line field
	const handleUpdateRepairLine = (
		index: number,
		field: "description" | "cost",
		value: string | number | "",
	) => {
		const updated = [...repairs];
		if (field === "description") {
			updated[index].description = String(value);
		} else {
			updated[index].cost = value === "" ? "" : Math.max(0, parseInt(String(value), 10) || 0);
		}
		setRepairs(updated);
	};

	// Calculate total cost
	const totalCost = useMemo(() => {
		return repairs.reduce((acc, r) => acc + (typeof r.cost === "number" ? r.cost : 0), 0);
	}, [repairs]);

	const handleSelectCar = (car: { carDescription: string; plateNumber: string }) => {
		setCarDescription(car.carDescription);
		setPlateNumber(car.plateNumber);
		setCarQuery(`${car.plateNumber} - ${car.carDescription}`);
		setIsCarDropdownOpen(false);
	};

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		setError(null);

		const cleanPlate = plateNumber.trim().toUpperCase();
		const cleanCar = carDescription.trim();

		if (!cleanPlate) {
			setError("Plat nomor kendaraan wajib diisi");
			return;
		}
		if (!cleanCar) {
			setError("Deskripsi mobil wajib diisi");
			return;
		}

		// Check duplicate in expenditure
		const targetHash = hashPlate(cleanPlate);
		if (existingExpenditures.some((v) => v.id === targetHash)) {
			setError(`Kendaraan dengan plat "${cleanPlate}" sudah ada di data Pengeluaran Unit.`);
			return;
		}

		// Validate repair items
		const validRepairs = repairs
			.map((r) => ({
				description: r.description.trim(),
				cost: typeof r.cost === "number" ? r.cost : 0,
			}))
			.filter((r) => r.description !== "" && r.cost > 0);

		if (validRepairs.length === 0) {
			setError("Minimal harus ada 1 item perbaikan dengan deskripsi dan biaya valid (> 0)");
			return;
		}

		setIsSubmitting(true);
		try {
			await onSubmit({
				carDescription: cleanCar,
				plateNumber: cleanPlate,
				repairs: validRepairs,
			});
			onClose();
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Gagal menambahkan unit pengeluaran");
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overscroll-contain">
			<div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				{/* Modal Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
							<IconCar className="w-4 h-4" />
						</div>
						<div>
							<h3 className="text-sm font-bold text-slate-900">Catat Pengeluaran Unit Baru</h3>
							<p className="text-xs text-slate-500">
								Tambahkan kendaraan dan rincian biaya rekondisi/perbaikan
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
					className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-5"
				>
					{error && (
						<div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
							{error}
						</div>
					)}

					{/* Hybrid Car Picker Section */}
					<div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
								Data Kendaraan
							</span>
							<span className="text-[10px] text-slate-500">
								Pilih dari Transaksi atau ketik manual
							</span>
						</div>

						{/* Quick Combobox from Transaksi */}
						<div className="relative" ref={dropdownRef}>
							<label className="block text-xs font-semibold text-slate-600 mb-1">
								Cari dari Transaksi (Opsional)
							</label>
							<div className="relative">
								<input
									type="text"
									placeholder="Ketik plat atau nama mobil di Transaksi..."
									value={carQuery}
									onFocus={() => setIsCarDropdownOpen(true)}
									onInput={(e) => {
										setCarQuery((e.target as HTMLInputElement).value);
										setIsCarDropdownOpen(true);
									}}
									className="w-full px-3 py-2 pr-8 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
								/>
								<button
									type="button"
									onClick={() => setIsCarDropdownOpen((prev) => !prev)}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
								>
									<IconChevronDown className="w-4 h-4" />
								</button>
							</div>

							{isCarDropdownOpen && filteredCars.length > 0 && (
								<div className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto overscroll-contain bg-white rounded-lg shadow-lg border border-slate-200 py-1 text-xs">
									{filteredCars.map((c) => {
										const isSelected = plateNumber === c.plateNumber;
										return (
											<button
												key={c.plateNumber}
												type="button"
												onClick={() => handleSelectCar(c)}
												className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-blue-50/80 transition-colors cursor-pointer ${
													isSelected ? "bg-blue-50 font-semibold text-blue-900" : "text-slate-700"
												}`}
											>
												<div>
													<span className="font-mono font-bold text-slate-900">
														{c.plateNumber}
													</span>
													<span className="text-slate-500 ml-2">{c.carDescription}</span>
												</div>
												{isSelected && <IconCheck className="w-3.5 h-3.5 text-blue-600" />}
											</button>
										);
									})}
								</div>
							)}
						</div>

						{/* Explicit Inputs */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
							<div className="sm:col-span-1">
								<label className="block text-xs font-semibold text-slate-700 mb-1">
									Plat Nomor <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									required
									placeholder="Contoh: B 1234 CD"
									value={plateNumber}
									onInput={(e) => setPlateNumber((e.target as HTMLInputElement).value)}
									className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono uppercase"
								/>
							</div>

							<div className="sm:col-span-2">
								<label className="block text-xs font-semibold text-slate-700 mb-1">
									Deskripsi Mobil <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									required
									placeholder="Contoh: Toyota Innova Reborn 2.4 G AT 2020 Hitam"
									value={carDescription}
									onInput={(e) => setCarDescription((e.target as HTMLInputElement).value)}
									className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
								/>
							</div>
						</div>
					</div>

					{/* Repair Tasks Section */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
								Rincian Item Perbaikan
							</span>
							<button
								type="button"
								onClick={handleAddRepairLine}
								className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
							>
								<IconPlus className="w-3.5 h-3.5" />
								<span>Tambah Baris</span>
							</button>
						</div>

						<div className="space-y-2">
							{repairs.map((repair, idx) => (
								<div key={idx} className="flex items-center gap-2">
									<span className="text-xs font-mono font-semibold text-slate-400 w-5 text-center">
										{idx + 1}.
									</span>
									<RepairCombobox
										className="flex-1"
										required
										placeholder="Pilih dari daftar atau ketik perbaikan baru..."
										value={repair.description}
										options={repairOptions}
										onChange={(val) => handleUpdateRepairLine(idx, "description", val)}
									/>
									<input
										type="number"
										required
										min="0"
										placeholder="Biaya (Rp)"
										value={repair.cost}
										onInput={(e) =>
											handleUpdateRepairLine(idx, "cost", (e.target as HTMLInputElement).value)
										}
										className="w-36 px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
									/>
									<button
										type="button"
										onClick={() => handleRemoveRepairLine(idx)}
										disabled={repairs.length <= 1}
										className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
									>
										<IconTrash2 className="w-4 h-4" />
									</button>
								</div>
							))}
						</div>

						{/* Total Summary Row */}
						<div className="flex items-center justify-between p-3 bg-blue-50/60 rounded-xl border border-blue-100 mt-2">
							<span className="text-xs font-bold text-slate-700">Total Biaya Perbaikan</span>
							<span className="text-sm font-bold text-blue-700 font-mono">
								{formatRp(totalCost)}
							</span>
						</div>
					</div>

					<div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
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
							{isSubmitting ? "Menyimpan ke Sheets..." : "Simpan Pengeluaran"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
