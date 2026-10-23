import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import IconCar from "~icons/lucide/car";
import IconCheck from "~icons/lucide/check";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconWrench from "~icons/lucide/wrench";
import IconX from "~icons/lucide/x";
import { InventoryConsumeInput, InventoryItem } from "../../../shared/schema";

export interface CarSuggestionItem {
	plateNumber: string;
	carDescription: string;
}

interface InventoryConsumeModalProps {
	item: InventoryItem;
	availableCars: CarSuggestionItem[];
	onClose: () => void;
	onSubmit: (payload: InventoryConsumeInput) => Promise<void>;
}

export function InventoryConsumeModal({
	item,
	availableCars,
	onClose,
	onSubmit,
}: InventoryConsumeModalProps) {
	const [qty, setQty] = useState(1);
	const [alokasi, setAlokasi] = useState("");
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close on Escape
	useEffect(() => {
		const onEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onEsc);
		return () => window.removeEventListener("keydown", onEsc);
	}, [onClose]);

	// Close dropdown on outside click
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setIsDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Filter available cars based on input
	const filteredCars = useMemo(() => {
		const q = alokasi.trim().toLowerCase();
		if (!q) return availableCars.slice(0, 15);
		return availableCars
			.filter(
				(c) =>
					c.plateNumber.toLowerCase().includes(q) || c.carDescription.toLowerCase().includes(q),
			)
			.slice(0, 15);
	}, [availableCars, alokasi]);

	// Prevent modal submit on Enter unless on button
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			const target = e.target as HTMLElement;
			if (target.tagName === "BUTTON") return;
			e.preventDefault();
		}
	};

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		setError(null);

		if (qty <= 0) {
			setError("Jumlah barang yang dipakai minimal 1 unit.");
			return;
		}

		if (qty > item.tersedia) {
			setError(
				`Jumlah yang dipakai (${qty}) melebihi stok yang tersedia saat ini (${item.tersedia} unit).`,
			);
			return;
		}

		const cleanAlokasi = alokasi.trim();
		if (!cleanAlokasi) {
			setError("Alokasi pemakaian barang wajib diisi.");
			return;
		}

		try {
			setIsSubmitting(true);
			await onSubmit({
				no: item.no,
				qty,
				carName: cleanAlokasi,
			});
			onClose();
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Gagal mencatat pemakaian barang.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
			<div
				className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md flex flex-col my-auto"
				onKeyDown={handleKeyDown}
			>
				{/* Modal Header */}
				<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
							<IconWrench className="w-4 h-4" />
						</div>
						<div>
							<h3 className="text-base font-bold text-slate-800">Pakai Barang Inventaris</h3>
							<p className="text-xs text-slate-400">
								Catat alokasi pemakaian part, bahan, atau operasional
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						disabled={isSubmitting}
						type="button"
						className="w-8 h-8 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
					>
						<IconX className="w-4 h-4" />
					</button>
				</div>

				{/* Modal Body */}
				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					{error && (
						<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
							<span className="font-bold">Error:</span>
							<span>{error}</span>
						</div>
					)}

					{/* Item Summary Box */}
					<div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
						<div>
							<div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
								Barang Terpilih
							</div>
							<div className="text-sm font-bold text-slate-800 mt-0.5">{item.namaBarang}</div>
						</div>
						<div className="text-right">
							<div className="text-[10px] text-slate-400">Stok Tersedia</div>
							<div
								className={`font-mono font-bold text-sm ${
									item.tersedia > 0 ? "text-emerald-600" : "text-rose-600"
								}`}
							>
								{item.tersedia} unit
							</div>
						</div>
					</div>

					{/* Quantity Input */}
					<div>
						<label className="block text-xs font-semibold text-slate-700 mb-1.5">
							Jumlah yang Dipakai <span className="text-rose-500">*</span>
						</label>
						<div className="flex items-center gap-3">
							<input
								type="number"
								min="1"
								max={Math.max(1, item.tersedia)}
								value={qty}
								onInput={(e) => {
									const v = parseInt((e.target as HTMLInputElement).value, 10);
									setQty(isNaN(v) ? 1 : v);
								}}
								required
								className="w-32 px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-slate-800 font-bold"
							/>
							<div className="text-xs text-slate-400">
								Sisa setelah dipakai:{" "}
								<strong className="text-slate-700 font-mono">
									{Math.max(0, item.tersedia - (qty || 0))} unit
								</strong>
							</div>
						</div>
					</div>

					{/* Alokasi Input with Dropdown Suggestions */}
					<div className="relative" ref={dropdownRef}>
						<label className="block text-xs font-semibold text-slate-700 mb-1.5">
							Alokasi <span className="text-rose-500">*</span>
						</label>
						<div className="relative">
							<input
								type="text"
								value={alokasi}
								onInput={(e) => {
									setAlokasi((e.target as HTMLInputElement).value);
									setIsDropdownOpen(true);
								}}
								onFocus={() => setIsDropdownOpen(true)}
								placeholder="Pilih unit mobil atau ketik alokasi bebas..."
								required
								className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
							/>
							<IconCar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
							<button
								type="button"
								onClick={() => setIsDropdownOpen(!isDropdownOpen)}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
							>
								<IconChevronDown
									className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
								/>
							</button>
						</div>

						{/* Dropdown suggestions with car plate badge */}
						{isDropdownOpen && filteredCars.length > 0 && (
							<div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
								<div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
									Saran Unit Mobil ({filteredCars.length})
								</div>
								{filteredCars.map((car) => {
									const isSelected =
										alokasi.trim().toLowerCase() === car.carDescription.trim().toLowerCase();

									return (
										<button
											key={car.plateNumber}
											type="button"
											onClick={() => {
												setAlokasi(car.carDescription);
												setIsDropdownOpen(false);
											}}
											className={`w-full px-3.5 py-2.5 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
												isSelected
													? "bg-emerald-50/80 text-emerald-900"
													: "hover:bg-slate-50 text-slate-700"
											}`}
										>
											<div className="flex items-center gap-2 min-w-0 pr-2">
												<span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
													{car.plateNumber}
												</span>
												<span className="truncate font-medium text-slate-800">
													{car.carDescription}
												</span>
											</div>
											{isSelected && (
												<IconCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
											)}
										</button>
									);
								})}
							</div>
						)}
						<p className="text-[10px] text-slate-400 mt-1">
							Dapat memilih unit mobil dari daftar atau mengetik alokasi lain (misal: Operasional,
							Detailing, dll).
						</p>
					</div>

					{/* Modal Footer */}
					<div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
						<button
							type="button"
							onClick={onClose}
							disabled={isSubmitting}
							className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
						>
							Batal
						</button>
						<button
							type="submit"
							disabled={isSubmitting || item.tersedia <= 0}
							className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
						>
							{isSubmitting ? (
								<>
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									<span>Menyimpan...</span>
								</>
							) : (
								<span>Konfirmasi Pemakaian</span>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
