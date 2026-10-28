import { useEffect, useState } from "preact/hooks";
import IconX from "~icons/lucide/x";
import {
	formatDateToDDMMYY,
	formatPlateNumber,
	formatRp,
	StockCarItem,
	TRANSACTION_CATEGORIES,
	TRANSACTION_STATUSES,
	TransactionCategory,
	TransactionCreateSchema,
	TransactionItem,
	TransactionStatus,
} from "../../shared/schema";
import { ModalMode } from "../types";
import { DatePicker } from "./DatePicker";
import { SalesCombobox } from "./SalesCombobox";
import { Select } from "./Select";
import { StockUnitCombobox } from "./StockUnitCombobox";

interface TransactionFormModalProps {
	mode: ModalMode;
	initialData?: TransactionItem | null;
	existingSales?: string[];
	availableStocks?: StockCarItem[];
	onClose: () => void;
	onSubmit: (payload: any) => Promise<void>;
}

export function TransactionFormModal({
	mode,
	initialData,
	existingSales = [],
	availableStocks = [],
	onClose,
	onSubmit,
}: TransactionFormModalProps) {
	const isEditing = mode === "edit";

	// Form states
	const [tanggal, setTanggal] = useState(
		initialData?.transactionDate || formatDateToDDMMYY(new Date()),
	);
	const [kategori, setKategori] = useState<TransactionCategory | "">(initialData?.category || "");
	const [deskripsi, setDeskripsi] = useState(initialData?.carDescription || "");
	const [plat, setPlat] = useState(initialData?.plateNumber || "");
	const [pembeli, setPembeli] = useState(initialData?.buyerName || "");
	const [telpon, setTelpon] = useState(initialData?.phoneNumber || "");
	const [hargaJual, setHargaJual] = useState<number | "">(initialData?.sellingPrice ?? "");
	const [dp, setDp] = useState<number | "">(initialData?.downPayment ?? "");
	const [sales, setSales] = useState(initialData?.salesPerson || "");
	const [status, setStatus] = useState<TransactionStatus | "">(initialData?.status || "");
	const [catatan, setCatatan] = useState(initialData?.notes || "");

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const resetForm = () => {
		setTanggal(formatDateToDDMMYY(new Date()));
		setKategori("");
		setDeskripsi("");
		setPlat("");
		setPembeli("");
		setTelpon("");
		setHargaJual("");
		setDp("");
		setSales("");
		setStatus("");
		setCatatan("");
		setErrors({});
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	// Reset / sync form fields whenever modal mode or initialData changes
	useEffect(() => {
		if (mode === "edit" && initialData) {
			setTanggal(initialData.transactionDate || formatDateToDDMMYY(new Date()));
			setKategori(initialData.category || "");
			setDeskripsi(initialData.carDescription || "");
			setPlat(initialData.plateNumber || "");
			setPembeli(initialData.buyerName || "");
			setTelpon(initialData.phoneNumber || "");
			setHargaJual(initialData.sellingPrice ?? "");
			setDp(initialData.downPayment ?? "");
			setSales(initialData.salesPerson || "");
			setStatus(initialData.status || "");
			setCatatan(initialData.notes || "");
		} else {
			// Fresh defaults for "create" mode
			resetForm();
		}
		setErrors({});
	}, [mode, initialData]);

	const handleSelectStockCar = (car: StockCarItem) => {
		setDeskripsi(car.carDescription);
		setPlat(car.plateNumber);
		setErrors((prev) => {
			const next = { ...prev };
			delete next.carDescription;
			delete next.plateNumber;
			delete next.stockUnit;
			return next;
		});
	};

	const handleClearStockCar = () => {
		setDeskripsi("");
		setPlat("");
	};

	// Calculated remaining balance
	const numHarga = typeof hargaJual === "number" ? hargaJual : 0;
	const numDp = typeof dp === "number" ? dp : 0;
	const hasDp = typeof dp === "number" && dp > 0;
	const sisa = hasDp ? Math.max(0, numHarga - numDp) : status === "LUNAS" ? 0 : numHarga;

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		setErrors({});

		if (!isEditing && !plat.trim()) {
			setErrors({
				stockUnit: "Wajib memilih unit kendaraan dari Stok Mobil",
			});
			return;
		}

		const rawPayload = {
			transactionDate: tanggal.trim(),
			category: kategori,
			carDescription: deskripsi.trim(),
			plateNumber: formatPlateNumber(plat),
			buyerName: pembeli.trim(),
			phoneNumber: telpon.trim(),
			sellingPrice: typeof hargaJual === "number" ? hargaJual : 0,
			downPayment: typeof dp === "number" ? dp : null,
			remainingBalance: sisa,
			salesPerson: sales.trim(),
			status,
			notes: catatan.trim() || null,
		};

		// Validate with Zod
		const result = TransactionCreateSchema.safeParse(rawPayload);
		if (!result.success) {
			const fieldErrors: Record<string, string> = {};
			for (const issue of result.error.issues) {
				const field = issue.path[0];
				if (field && typeof field === "string") {
					fieldErrors[field] = issue.message;
				}
			}
			setErrors(fieldErrors);
			return;
		}

		try {
			setIsSubmitting(true);
			if (isEditing && initialData) {
				await onSubmit({
					...rawPayload,
					id: initialData.id,
					no: initialData.no,
				});
			} else {
				await onSubmit(rawPayload);
			}
			resetForm();
			onClose();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			setErrors({ submit: msg });
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!mode) return null;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
				{/* Modal Header */}
				<div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
					<div>
						<h3 className="text-base font-bold text-slate-900">
							{isEditing ? `Edit Transaksi #${initialData?.no}` : "Tambah Transaksi Baru"}
						</h3>
						<p className="text-xs text-slate-500 mt-0.5">
							{isEditing
								? "Perbarui detail transaksi mobil di spreadsheet"
								: "Masukkan detail penjualan mobil baru ke sheet TRANSAKSI"}
						</p>
					</div>
					<button
						onClick={handleClose}
						disabled={isSubmitting}
						type="button"
						className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
					>
						<IconX className="w-4 h-4" />
					</button>
				</div>

				{/* Modal Form */}
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
					{errors.submit && (
						<div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
							{errors.submit}
						</div>
					)}

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{/* Tanggal Transaksi */}
						<div>
							<div className="flex items-center justify-between mb-1">
								<label className="block text-xs font-semibold text-slate-700">
									Tanggal Transaksi <span className="text-rose-500">*</span>
								</label>
								<button
									type="button"
									onClick={() => setTanggal(formatDateToDDMMYY(new Date()))}
									className="text-[10px] text-blue-600 hover:underline cursor-pointer"
								>
									Hari Ini
								</button>
							</div>
							<DatePicker value={tanggal} onChange={setTanggal} error={errors.transactionDate} />
							{errors.transactionDate && (
								<p className="text-[11px] text-rose-600 mt-1">{errors.transactionDate}</p>
							)}
						</div>

						{/* Kategori Transaksi */}
						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1">
								Kategori Transaksi <span className="text-rose-500">*</span>
							</label>
							<Select
								value={kategori}
								onChange={(e) =>
									setKategori((e.target as HTMLSelectElement).value as TransactionCategory)
								}
								error={Boolean(errors.category)}
								className="px-3 py-2"
							>
								<option value="" disabled>
									-- Pilih Kategori Transaksi --
								</option>
								{TRANSACTION_CATEGORIES.map((c) => (
									<option key={c} value={c}>
										{c}
									</option>
								))}
							</Select>
							{errors.category && (
								<p className="text-[11px] text-rose-600 mt-1">{errors.category}</p>
							)}
						</div>

						{/* Unit Selection from STOK MOBIL */}
						{!isEditing && (
							<div className="sm:col-span-2">
								<label className="block text-xs font-semibold text-slate-700 mb-1">
									Pilih Unit dari Stok Mobil <span className="text-rose-500">*</span>
								</label>
								<StockUnitCombobox
									availableStocks={availableStocks}
									selectedPlate={plat}
									onSelect={handleSelectStockCar}
									onClear={handleClearStockCar}
									error={errors.stockUnit}
								/>
							</div>
						)}

						{/* Deskripsi Mobil (Otomatis terisi dari Stok Mobil) */}
						<div className="sm:col-span-2">
							<label className="block text-xs font-semibold text-slate-700 mb-1">
								Deskripsi Mobil
							</label>
							<input
								type="text"
								value={deskripsi}
								readOnly
								placeholder="Otomatis terisi dari pilihan Unit Stok Mobil di atas"
								className="w-full px-3 py-2 text-xs bg-slate-100/80 border border-slate-200 rounded-lg text-slate-700 cursor-not-allowed select-none font-medium placeholder-slate-400"
							/>
							{errors.carDescription && (
								<p className="text-[11px] text-rose-600 mt-1">{errors.carDescription}</p>
							)}
						</div>

						{/* Plat Mobil (Otomatis terisi dari Stok Mobil) */}
						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1">Plat Nomor</label>
							<input
								type="text"
								value={plat}
								readOnly
								placeholder="Otomatis terisi"
								className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-100/80 border border-slate-200 rounded-lg text-slate-700 cursor-not-allowed uppercase select-none placeholder-slate-400"
							/>
							{errors.plateNumber && (
								<p className="text-[11px] text-rose-600 mt-1">{errors.plateNumber}</p>
							)}
							{isEditing && (
								<p className="text-[10px] text-slate-400 mt-1">
									Nomor plat tidak dapat diubah setelah transaksi disimpan.
								</p>
							)}
						</div>

						{/* Status Transaksi */}
						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1">
								Status Transaksi <span className="text-rose-500">*</span>
							</label>
							<Select
								value={status}
								onChange={(e) => {
									const newStatus = (e.target as HTMLSelectElement).value as TransactionStatus;
									setStatus(newStatus);
									if (newStatus === "LUNAS") {
										setDp("");
									}
								}}
								error={Boolean(errors.status)}
								className="px-3 py-2"
							>
								<option value="" disabled>
									-- Pilih Status Transaksi --
								</option>
								{TRANSACTION_STATUSES.map((s) => (
									<option key={s} value={s}>
										{s}
									</option>
								))}
							</Select>
							{errors.status && <p className="text-[11px] text-rose-600 mt-1">{errors.status}</p>}
						</div>

						{/* Nama Pembeli */}
						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1">
								Nama Pembeli <span className="text-rose-500">*</span>
							</label>
							<input
								type="text"
								value={pembeli}
								onInput={(e) => setPembeli((e.target as HTMLInputElement).value)}
								placeholder="Nama lengkap pembeli"
								className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 ${
									errors.buyerName ? "border-rose-400" : "border-slate-200"
								}`}
							/>
							{errors.buyerName && (
								<p className="text-[11px] text-rose-600 mt-1">{errors.buyerName}</p>
							)}
						</div>

						{/* Nomor Telpon */}
						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1">
								Nomor Telepon <span className="text-rose-500">*</span>
							</label>
							<input
								type="text"
								value={telpon}
								onInput={(e) => setTelpon((e.target as HTMLInputElement).value)}
								placeholder="Contoh: 08123456789"
								className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 ${
									errors.phoneNumber ? "border-rose-400" : "border-slate-200"
								}`}
							/>
							{errors.phoneNumber && (
								<p className="text-[11px] text-rose-600 mt-1">{errors.phoneNumber}</p>
							)}
						</div>

						{/* Harga Jual */}
						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1">
								Harga Jual (Rp) <span className="text-rose-500">*</span>
							</label>
							<input
								type="number"
								value={hargaJual}
								onInput={(e) => {
									const val = (e.target as HTMLInputElement).value;
									setHargaJual(val === "" ? "" : Number(val));
								}}
								placeholder="Contoh: 285000000"
								className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 ${
									errors.sellingPrice ? "border-rose-400" : "border-slate-200"
								}`}
							/>
							<p className="text-[11px] text-slate-500 mt-1 font-semibold">
								Preview: {formatRp(numHarga)}
							</p>
							{errors.sellingPrice && (
								<p className="text-[11px] text-rose-600 mt-0.5">{errors.sellingPrice}</p>
							)}
						</div>

						{/* DP / Panjar */}
						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1">
								DP / Panjar (Rp)
							</label>
							<input
								type="number"
								value={dp}
								disabled={status === "LUNAS"}
								onInput={(e) => {
									const val = (e.target as HTMLInputElement).value;
									setDp(val === "" ? "" : Number(val));
								}}
								placeholder={
									status === "LUNAS" ? "Tidak berlaku (Lunas)" : "Kosongkan jika belum ada DP"
								}
								className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 ${
									status === "LUNAS"
										? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
										: "bg-slate-50 border-slate-200"
								}`}
							/>
							{status === "LUNAS" ? (
								<p className="text-[10px] text-slate-400 mt-1 italic">
									DP dinonaktifkan karena status transaksi LUNAS
								</p>
							) : (
								<p className="text-[11px] text-slate-500 mt-1 font-semibold">
									Preview: {formatRp(numDp)}
								</p>
							)}
						</div>

						{/* Sisa (Auto-calculated) */}
						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1">
								Sisa Pembayaran (Otomatis)
							</label>
							<div className="w-full px-3 py-2 text-xs font-semibold bg-slate-100 border border-slate-200 rounded-lg text-slate-700">
								{formatRp(sisa)}
							</div>
						</div>

						{/* Sales / Marketing */}
						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1">
								Sales / Marketing <span className="text-rose-500">*</span>
							</label>
							<SalesCombobox
								value={sales}
								onChange={setSales}
								options={existingSales}
								error={errors.salesPerson}
							/>
							{errors.salesPerson && (
								<p className="text-[11px] text-rose-600 mt-1">{errors.salesPerson}</p>
							)}
						</div>

						{/* Catatan */}
						<div className="sm:col-span-2">
							<label className="block text-xs font-semibold text-slate-700 mb-1">
								Catatan Tambahan
							</label>
							<textarea
								value={catatan}
								onInput={(e) => setCatatan((e.target as HTMLTextAreaElement).value)}
								rows={2}
								placeholder="Catatan kondisi mobil, syarat serah terima, kelengkapan surat..."
								className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 resize-none"
							/>
						</div>
					</div>

					{/* Modal Footer */}
					<div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
						<button
							onClick={handleClose}
							disabled={isSubmitting}
							type="button"
							className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
						>
							Batal
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
						>
							{isSubmitting && (
								<div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							)}
							<span>{isEditing ? "Simpan Perubahan" : "Simpan Transaksi"}</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
