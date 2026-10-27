import { useEffect, useState } from "preact/hooks";
import IconCar from "~icons/lucide/car";
import IconPackage from "~icons/lucide/package";
import IconX from "~icons/lucide/x";
import {
	formatRp,
	InventoryCreateInput,
	InventoryItem,
	InventoryUpdateInput,
	parseRp,
} from "../../../shared/schema";

interface InventoryFormModalProps {
	mode: "create" | "edit";
	initialData?: InventoryItem | null;
	onClose: () => void;
	onSubmit: (payload: InventoryCreateInput | InventoryUpdateInput) => Promise<void>;
}

export function InventoryFormModal({
	mode,
	initialData,
	onClose,
	onSubmit,
}: InventoryFormModalProps) {
	const isEdit = mode === "edit";

	// Form states
	const [namaBarang, setNamaBarang] = useState(initialData?.namaBarang || "");
	const [hargaStr, setHargaStr] = useState(initialData?.harga ? formatRp(initialData.harga) : "");
	const [stokAwal, setStokAwal] = useState<number | "">(
		initialData?.stokAwal != null ? initialData.stokAwal : 0,
	);
	const [terpakai, setTerpakai] = useState<number | "">(
		initialData?.terpakai != null ? initialData.terpakai : 0,
	);
	const [threshold, setThreshold] = useState<number | "">(
		initialData?.threshold != null ? initialData.threshold : 2,
	);

	// Parse target cars from comma-separated ditujukan string
	const targetCars = (initialData?.ditujukan || "")
		.split(",")
		.map((c) => c.trim())
		.filter(Boolean);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Prevent modal submit on Enter unless on button/textarea
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			const target = e.target as HTMLElement;
			if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON") {
				return;
			}
			e.preventDefault();
		}
	};

	// Close on Escape
	useEffect(() => {
		const onEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onEsc);
		return () => window.removeEventListener("keydown", onEsc);
	}, [onClose]);

	// Format currency input
	const handleHargaChange = (e: Event) => {
		const raw = (e.target as HTMLInputElement).value;
		const num = parseRp(raw);
		setHargaStr(num > 0 ? formatRp(num) : "");
	};

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		setError(null);

		const cleanNama = namaBarang.trim();
		if (!cleanNama) {
			setError("Nama barang wajib diisi.");
			return;
		}

		const numHarga = parseRp(hargaStr);
		const numStokAwal = typeof stokAwal === "number" ? stokAwal : 0;
		const numTerpakai = typeof terpakai === "number" ? terpakai : 0;
		const numThreshold = typeof threshold === "number" ? threshold : 2;

		if (numStokAwal < 0) {
			setError("Stok awal tidak boleh bernilai negatif.");
			return;
		}

		if (isEdit && numTerpakai < 0) {
			setError("Jumlah terpakai tidak boleh bernilai negatif.");
			return;
		}

		try {
			setIsSubmitting(true);
			if (isEdit && initialData) {
				const payload: InventoryUpdateInput = {
					no: initialData.no,
					namaBarang: cleanNama,
					harga: numHarga,
					stokAwal: numStokAwal,
					terpakai: numTerpakai,
					threshold: numThreshold,
					ditujukan: initialData.ditujukan || "",
				};
				await onSubmit(payload);
			} else {
				const payload: InventoryCreateInput = {
					namaBarang: cleanNama,
					harga: numHarga,
					stokAwal: numStokAwal,
					threshold: numThreshold,
					ditujukan: "",
				};
				await onSubmit(payload);
			}
			onClose();
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
			<div
				className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
				onKeyDown={handleKeyDown}
			>
				{/* Modal Header */}
				<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
							<IconPackage className="w-4 h-4" />
						</div>
						<div>
							<h3 className="text-base font-bold text-slate-800">
								{isEdit ? "Edit Barang Inventaris" : "Tambah Barang Baru"}
							</h3>
							<p className="text-xs text-slate-400">
								{isEdit
									? `Perbarui informasi barang No #${initialData?.no}`
									: "Catat spare part, bahan servis, atau perlengkapan showroom baru"}
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
				<form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
					{error && (
						<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
							<span className="font-bold">Error:</span>
							<span>{error}</span>
						</div>
					)}

					{/* 1. Nama Barang */}
					<div>
						<label className="block text-xs font-semibold text-slate-700 mb-1.5">
							Nama Barang <span className="text-rose-500">*</span>
						</label>
						<input
							type="text"
							value={namaBarang}
							onInput={(e) => setNamaBarang((e.target as HTMLInputElement).value)}
							placeholder="misal: OLI MESIN FASTRON ECO GREEN, MIKA CALYA, dll."
							required
							className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
						/>
					</div>

					{/* 2. Harga Satuan (Beli) */}
					<div>
						<label className="block text-xs font-semibold text-slate-700 mb-1.5">
							Harga Satuan (Beli)
							<span className="text-[11px] font-normal text-slate-400 ml-1.5">
								(Opsional jika belum ada harga)
							</span>
						</label>
						<input
							type="text"
							value={hargaStr}
							onInput={handleHargaChange}
							placeholder="Rp 0"
							className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-800"
						/>
					</div>

					{/* 3. Grid: Stok Awal, Terpakai (edit only), Alert Threshold */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1.5">Stok Awal</label>
							<input
								type="number"
								min="0"
								value={stokAwal}
								onInput={(e) => {
									const v = (e.target as HTMLInputElement).value;
									setStokAwal(v === "" ? "" : parseInt(v, 10));
								}}
								className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-800"
							/>
						</div>

						{isEdit && (
							<div>
								<label className="block text-xs font-semibold text-slate-700 mb-1.5">
									Terpakai
								</label>
								<input
									type="number"
									min="0"
									value={terpakai}
									onInput={(e) => {
										const v = (e.target as HTMLInputElement).value;
										setTerpakai(v === "" ? "" : parseInt(v, 10));
									}}
									className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-800"
								/>
							</div>
						)}

						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1.5">
								Batas Restock (Unit)
							</label>
							<input
								type="number"
								min="0"
								value={threshold}
								onInput={(e) => {
									const v = (e.target as HTMLInputElement).value;
									setThreshold(v === "" ? "" : parseInt(v, 10));
								}}
								className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-800"
							/>
							<p className="text-[10px] text-slate-400 mt-1">
								Alert "PERLU RESTOCK" akan muncul jika stok tersedia ≤ angka ini.
							</p>
						</div>
					</div>

					{/* 4. Ditujukan / Alokasi Mobil (Uneditable Car Pills) */}
					{isEdit && (
						<div>
							<div className="flex items-center justify-between mb-1.5">
								<label className="block text-xs font-semibold text-slate-700">
									Ditujukan / Alokasi Mobil
								</label>
								<span className="text-[11px] font-medium text-slate-400">
									{targetCars.length > 0 ? `${targetCars.length} unit mobil` : "Belum dialokasikan"}
								</span>
							</div>

							{targetCars.length > 0 ? (
								<div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-wrap gap-1.5 max-h-36 overflow-y-auto [scrollbar-width:thin]">
									{targetCars.map((car, idx) => (
										<span
											key={idx}
											className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs select-none"
										>
											<IconCar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
											<span>{car}</span>
										</span>
									))}
								</div>
							) : (
								<div className="px-3.5 py-3 bg-slate-50/80 border border-dashed border-slate-200 rounded-xl text-center">
									<p className="text-xs text-slate-400 italic">
										Belum ada mobil yang dialokasikan untuk barang ini.
									</p>
								</div>
							)}

							<p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
								Alokasi mobil tercatat otomatis secara terpusat saat item digunakan pada perbaikan
								unit kendaraan.
							</p>
						</div>
					)}

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
							disabled={isSubmitting}
							className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
						>
							{isSubmitting ? (
								<>
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									<span>Menyimpan...</span>
								</>
							) : (
								<span>{isEdit ? "Perbarui Barang" : "Simpan Barang"}</span>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
