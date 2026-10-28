import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import IconCar from "~icons/lucide/car";
import IconCheck from "~icons/lucide/check";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconLock from "~icons/lucide/lock";
import IconPlus from "~icons/lucide/plus";
import IconX from "~icons/lucide/x";
import {
	calculateTargetSellingPrice,
	DEFAULT_DOCUMENTS,
	DEFAULT_MAKES,
	formatRp,
	StockCarCreateInput,
	StockCarItem,
	StockCarUpdateInput,
} from "../../../shared/schema";

interface StockFormModalProps {
	mode: "create" | "edit";
	initialData?: StockCarItem | null;
	existingStocks: StockCarItem[];
	onClose: () => void;
	onSubmit: (payload: StockCarCreateInput | StockCarUpdateInput) => Promise<void>;
}

export function StockFormModal({
	mode,
	initialData,
	existingStocks,
	onClose,
	onSubmit,
}: StockFormModalProps) {
	const isEdit = mode === "edit";

	// Form states
	const [make, setMake] = useState(initialData?.make || "");
	const [carDescription, setCarDescription] = useState(initialData?.carDescription || "");
	const [plateNumber, setPlateNumber] = useState(initialData?.plateNumber || "");
	const [selectedDocs, setSelectedDocs] = useState<string[]>(() => {
		if (!initialData?.documents) return [];
		return initialData.documents
			.split(",")
			.map((d) => d.trim())
			.filter(Boolean);
	});
	const [customDocInput, setCustomDocInput] = useState("");
	const [isAddingCustomDoc, setIsAddingCustomDoc] = useState(false);
	const [capitalCost, setCapitalCost] = useState<number | "">(
		initialData?.capitalCost != null ? initialData.capitalCost : "",
	);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Make combobox state
	const [isMakeOpen, setIsMakeOpen] = useState(false);
	const makeRef = useRef<HTMLDivElement>(null);

	// Derive all available makes (presets + existing from sheet)
	const availableMakes = useMemo(() => {
		const set = new Set<string>(DEFAULT_MAKES);
		for (const s of existingStocks) {
			if (s.make) set.add(s.make.toUpperCase());
		}
		return Array.from(set).sort();
	}, [existingStocks]);

	const filteredMakes = useMemo(() => {
		const q = make.trim().toLowerCase();
		if (!q) return availableMakes;
		return availableMakes.filter((m) => m.toLowerCase().includes(q));
	}, [availableMakes, make]);

	// Derive all available document tags (presets + tags in existing stocks)
	const availableDocs = useMemo(() => {
		const set = new Set<string>(DEFAULT_DOCUMENTS);
		for (const s of existingStocks) {
			if (s.documents) {
				const tags = s.documents
					.split(",")
					.map((t) => t.trim())
					.filter(Boolean);
				for (const tag of tags) set.add(tag);
			}
		}
		// Also include whatever user currently selected
		for (const d of selectedDocs) set.add(d);
		return Array.from(set);
	}, [existingStocks, selectedDocs]);

	// Close make dropdown on outside click
	useEffect(() => {
		if (!isMakeOpen) return;
		const handleClick = (e: MouseEvent) => {
			if (makeRef.current && !makeRef.current.contains(e.target as Node)) {
				setIsMakeOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [isMakeOpen]);

	// Toggle a document tag
	const toggleDoc = (doc: string) => {
		if (selectedDocs.includes(doc)) {
			setSelectedDocs(selectedDocs.filter((d) => d !== doc));
		} else {
			setSelectedDocs([...selectedDocs, doc]);
		}
	};

	// Add custom document tag
	const handleAddCustomDoc = () => {
		const trimmed = customDocInput.trim();
		if (trimmed && !selectedDocs.includes(trimmed)) {
			setSelectedDocs([...selectedDocs, trimmed]);
			setCustomDocInput("");
			setIsAddingCustomDoc(false);
		}
	};

	const handleSubmit = async (e: Event) => {
		e.preventDefault();

		const cleanMake = make.trim().toUpperCase();
		if (!cleanMake) {
			setError("Merek mobil wajib diisi");
			return;
		}

		const cleanDesc = carDescription.trim();
		if (!cleanDesc) {
			setError("Deskripsi mobil wajib diisi");
			return;
		}

		const cleanPlate = plateNumber.trim().toUpperCase();
		if (!cleanPlate) {
			setError("Plat nomor wajib diisi");
			return;
		}

		const numCapital = typeof capitalCost === "number" ? capitalCost : 0;
		if (numCapital <= 0) {
			setError("Modal beli harus lebih dari 0");
			return;
		}

		const docsString = selectedDocs.join(",");

		setIsSubmitting(true);
		setError(null);

		try {
			if (isEdit && initialData) {
				await onSubmit({
					id: initialData.id,
					make: cleanMake,
					carDescription: cleanDesc,
					documents: docsString,
					status: initialData.status,
					sellingPrice: initialData.sellingPrice,
					capitalCost: numCapital,
					soldDate: initialData.soldDate,
				} as StockCarUpdateInput);
			} else {
				await onSubmit({
					make: cleanMake,
					carDescription: cleanDesc,
					plateNumber: cleanPlate,
					documents: docsString,
					status: "Ready",
					sellingPrice: 0,
					capitalCost: numCapital,
					soldDate: undefined,
				} as StockCarCreateInput);
			}
			onClose();
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Gagal menyimpan data stok mobil");
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				{/* Modal Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
							<IconCar className="w-4 h-4" />
						</div>
						<div>
							<h3 className="text-sm font-bold text-slate-900">
								{isEdit ? "Edit Data Unit Stok" : "Tambah Unit Stok Baru"}
							</h3>
							<p className="text-xs text-slate-500">
								{isEdit
									? `Perbarui informasi unit #${initialData?.no} (${initialData?.plateNumber})`
									: "Daftarkan unit kendaraan baru ke master database stok"}
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
					className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4"
				>
					{error && (
						<div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
							{error}
						</div>
					)}

					{/* Row 1: Merek & Plat Mobil */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{/* Merek (Combobox) */}
						<div ref={makeRef} className="relative">
							<label className="block text-xs font-semibold text-slate-700 mb-1">
								Merek Mobil <span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<input
									type="text"
									required
									placeholder="Pilih atau ketik merek..."
									value={make}
									onFocus={() => setIsMakeOpen(true)}
									onInput={(e) => {
										setMake((e.target as HTMLInputElement).value);
										if (!isMakeOpen) setIsMakeOpen(true);
									}}
									className="w-full px-3 py-2 pr-8 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
								/>
								<button
									type="button"
									onClick={() => setIsMakeOpen((prev) => !prev)}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
								>
									<IconChevronDown className="w-3.5 h-3.5" />
								</button>
							</div>

							{isMakeOpen && filteredMakes.length > 0 && (
								<div className="absolute z-40 left-0 right-0 mt-1 max-h-48 overflow-y-auto overscroll-contain bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-xs">
									<div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
										Saran Merek
									</div>
									{filteredMakes.map((m) => {
										const isSelected = make.trim().toUpperCase() === m;
										return (
											<button
												key={m}
												type="button"
												onClick={() => {
													setMake(m);
													setIsMakeOpen(false);
												}}
												className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
													isSelected ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700"
												}`}
											>
												<span>{m}</span>
												{isSelected && <IconCheck className="w-3.5 h-3.5 text-blue-600" />}
											</button>
										);
									})}
								</div>
							)}
						</div>

						{/* Plat Nomor */}
						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1">
								Plat Mobil / No Polisi <span className="text-red-500">*</span>
							</label>
							{isEdit ? (
								<div className="flex items-center justify-between px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-mono font-bold">
									<span>{plateNumber}</span>
									<span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-slate-400">
										<IconLock className="w-3 h-3" />
										<span>ID Tetap</span>
									</span>
								</div>
							) : (
								<input
									type="text"
									required
									placeholder="Contoh: B 1234 ABC"
									value={plateNumber}
									onInput={(e) => setPlateNumber((e.target as HTMLInputElement).value)}
									className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono uppercase"
								/>
							)}
						</div>
					</div>

					{/* Deskripsi Mobil */}
					<div>
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

					{/* Kelengkapan (Pill Checkboxes) */}
					<div>
						<div className="flex items-center justify-between mb-1.5">
							<label className="block text-xs font-semibold text-slate-700">
								Kelengkapan Dokumen & Berkas
							</label>
							<span className="text-[10px] text-slate-400">{selectedDocs.length} dipilih</span>
						</div>
						<div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
							{availableDocs.map((doc) => {
								const isSelected = selectedDocs.includes(doc);
								return (
									<button
										key={doc}
										type="button"
										onClick={() => toggleDoc(doc)}
										className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer select-none border ${
											isSelected
												? "bg-blue-600 text-white border-blue-600 shadow-2xs"
												: "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
										}`}
									>
										{isSelected && <IconCheck className="w-3 h-3" />}
										<span>{doc}</span>
									</button>
								);
							})}

							{/* Custom Doc Tag Input / Button */}
							{isAddingCustomDoc ? (
								<div className="inline-flex items-center gap-1">
									<input
										type="text"
										autoFocus
										placeholder="Nama dokumen..."
										value={customDocInput}
										onInput={(e) => setCustomDocInput((e.target as HTMLInputElement).value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddCustomDoc();
											} else if (e.key === "Escape") {
												setIsAddingCustomDoc(false);
											}
										}}
										className="px-2 py-0.5 text-xs border border-blue-500 rounded-lg bg-white w-28 focus:outline-hidden"
									/>
									<button
										type="button"
										onClick={handleAddCustomDoc}
										className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
										title="Tambahkan"
									>
										<IconCheck className="w-3.5 h-3.5" />
									</button>
									<button
										type="button"
										onClick={() => setIsAddingCustomDoc(false)}
										className="p-1 text-slate-400 hover:bg-slate-200 rounded cursor-pointer"
										title="Batal"
									>
										<IconX className="w-3.5 h-3.5" />
									</button>
								</div>
							) : (
								<button
									type="button"
									onClick={() => setIsAddingCustomDoc(true)}
									className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 bg-white border border-dashed border-slate-300 hover:border-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
								>
									<IconPlus className="w-3 h-3" />
									<span>Custom</span>
								</button>
							)}
						</div>
					</div>

					{/* Modal Beli */}
					<div>
						<label className="block text-xs font-semibold text-slate-700 mb-1">
							Modal Beli (Rp) <span className="text-red-500">*</span>
						</label>
						<input
							type="number"
							required
							min="0"
							placeholder="Contoh: 250000000"
							value={capitalCost}
							onInput={(e) => {
								const val = (e.target as HTMLInputElement).value;
								setCapitalCost(val === "" ? "" : Math.max(0, parseInt(val, 10) || 0));
							}}
							className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
						/>
						{typeof capitalCost === "number" && capitalCost > 0 && (
							<div className="flex flex-wrap items-center justify-between gap-1 text-[11px] mt-1.5 font-mono">
								<span className="text-slate-500 font-medium">Modal: {formatRp(capitalCost)}</span>
								<span
									className="text-blue-800 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/80"
									title="Rekomendasi harga jual minimum 112% dari total modal"
								>
									🎯 Target (112%):{" "}
									{formatRp(
										calculateTargetSellingPrice(capitalCost, initialData?.serviceExpense || 0),
									)}
								</span>
							</div>
						)}
					</div>

					{/* Read-Only Sales Context Card in Edit Mode */}
					{isEdit && initialData && (
						<div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-xs font-bold text-slate-700">Status Penjualan</span>
								<span
									className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
										initialData.status === "Ready"
											? "bg-emerald-50 text-emerald-700 border-emerald-200"
											: initialData.status === "Ter-DP"
												? "bg-amber-50 text-amber-700 border-amber-200"
												: "bg-slate-200 text-slate-700 border-slate-300"
									}`}
								>
									● {initialData.status}
								</span>
							</div>

							{initialData.status === "Ready" ? (
								<div className="space-y-1.5">
									<p className="text-[11px] text-slate-500 leading-relaxed">
										Unit berstatus <strong>Ready</strong> di showroom. Harga jual dan tanggal
										terjual akan terisi otomatis saat transaksi dicatat di tab{" "}
										<strong>Transaksi</strong>.
									</p>
									{initialData.capitalCost > 0 && (
										<div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 font-mono">
											<span className="text-slate-600">Target Jual (112%):</span>
											<span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80">
												{formatRp(
													calculateTargetSellingPrice(
														initialData.capitalCost,
														initialData.serviceExpense,
													),
												)}
											</span>
										</div>
									)}
								</div>
							) : (
								<div className="space-y-1.5 pt-1 text-xs">
									<div className="flex items-center justify-between text-slate-600">
										<span>Harga Jual Transaksi:</span>
										<span className="font-mono font-bold text-slate-800">
											{initialData.sellingPrice > 0 ? formatRp(initialData.sellingPrice) : "-"}
										</span>
									</div>
									{initialData.soldDate && (
										<div className="flex items-center justify-between text-slate-600">
											<span>Tanggal Terjual:</span>
											<span className="font-mono font-medium text-slate-800">
												{initialData.soldDate}
											</span>
										</div>
									)}
									<p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200/60">
										Data transaksi dikelola otomatis melalui tab Transaksi.
									</p>
								</div>
							)}
						</div>
					)}

					{/* Actions */}
					<div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
								<span>{isEdit ? "Simpan Perubahan" : "Tambah ke Stok"}</span>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
