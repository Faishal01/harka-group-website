import { useEffect, useMemo, useState } from "preact/hooks";
import IconArrowDownLeft from "~icons/lucide/arrow-down-left";
import IconArrowUpRight from "~icons/lucide/arrow-up-right";
import IconCheck from "~icons/lucide/check";
import IconExternalLink from "~icons/lucide/external-link";
import IconFileText from "~icons/lucide/file-text";
import IconPaperclip from "~icons/lucide/paperclip";
import IconTrash2 from "~icons/lucide/trash-2";
import IconX from "~icons/lucide/x";
import {
	CashTransactionCreateInput,
	CashTransactionItem,
	CashTransactionUpdateInput,
	formatDateToDDMMYY,
	formatRp,
	parseRp,
	PickerConfig,
} from "../../../shared/schema";
import { DatePicker } from "../DatePicker";
import { CategoryCombobox } from "./CategoryCombobox";

interface CashflowFormModalProps {
	mode: "add" | "edit";
	initialData?: CashTransactionItem | null;
	existingItems?: CashTransactionItem[];
	pickerConfig?: PickerConfig;
	onClose: () => void;
	onSubmit: (payload: CashTransactionCreateInput | CashTransactionUpdateInput) => Promise<void>;
}

function toTitleCase(str: string): string {
	if (!str) return "";
	if (/[a-z]/.test(str) && /[A-Z]/.test(str) && !/^[A-Z\s\W]+$/.test(str)) {
		return str;
	}
	return str
		.toLowerCase()
		.split(/\s+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function loadPickerApi(): Promise<void> {
	return new Promise((resolve, reject) => {
		if (typeof window === "undefined") return reject(new Error("No window"));
		if ((window as any).google?.picker) {
			return resolve();
		}
		const checkGapi = () => {
			const gapi = (window as any).gapi;
			if (gapi) {
				gapi.load("picker", { callback: () => resolve() });
			} else {
				let script = document.getElementById("google-api-script") as HTMLScriptElement;
				if (!script) {
					script = document.createElement("script");
					script.id = "google-api-script";
					script.src = "https://apis.google.com/js/api.js";
					script.onload = () => {
						(window as any).gapi?.load("picker", { callback: () => resolve() });
					};
					script.onerror = () => reject(new Error("Gagal memuat Google Picker API"));
					document.head.appendChild(script);
				} else {
					setTimeout(checkGapi, 100);
				}
			}
		};
		checkGapi();
	});
}

export function CashflowFormModal({
	mode,
	initialData,
	existingItems = [],
	pickerConfig,
	onClose,
	onSubmit,
}: CashflowFormModalProps) {
	const isEdit = mode === "edit";

	// Form states
	const [type, setType] = useState<"OUT" | "IN" | null>(initialData ? initialData.type : null);
	const [date, setDate] = useState<string>(initialData?.date || formatDateToDDMMYY(new Date()));
	const [category, setCategory] = useState<string>(initialData?.category || "");
	const [amount, setAmount] = useState<number | "">(initialData ? initialData.amount : "");
	const [description, setDescription] = useState<string>(initialData?.description || "");
	const [notes, setNotes] = useState<string>(initialData?.notes || "");

	// Attachment states
	const [preserveAttachment, setPreserveAttachment] = useState<boolean>(
		Boolean(initialData?.attachmentUrl || initialData?.notes),
	);
	const [pickedFile, setPickedFile] = useState<{
		id?: string;
		name: string;
		url: string;
	} | null>(
		initialData?.attachmentUrl
			? {
					name: initialData.notes || "Lampiran Terpasang",
					url: initialData.attachmentUrl,
				}
			: null,
	);

	// UI feedback states
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isOpeningPicker, setIsOpeningPicker] = useState(false);

	// Keyboard shortcuts (Escape closes modal)
	useEffect(() => {
		const onEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onEsc);
		return () => window.removeEventListener("keydown", onEsc);
	}, [onClose]);

	// Dynamically harvest categories from existing transactions, normalized to Title Case & sorted A-Z
	const categoryOptions = useMemo<string[]>(() => {
		const catsSet = new Map<string, string>();

		// Standard defaults in Title Case
		const baseList =
			type === "IN"
				? ["Pemasukan Kas"]
				: ["Operasional Kantor", "Pelunasan Driver", "Pengeluaran Service"];
		for (const b of baseList) {
			catsSet.set(b.toLowerCase(), b);
		}

		// Harvest unique categories from existing cash transactions
		if (existingItems && existingItems.length > 0) {
			for (const item of existingItems) {
				const raw = item.category?.trim();
				if (!raw) continue;

				// Filter by matching transaction type
				const isMatchingType = type === "IN" ? item.cashIn > 0 : item.cashOut > 0;
				if (isMatchingType || (!item.cashIn && !item.cashOut)) {
					const lower = raw.toLowerCase();
					if (!catsSet.has(lower)) {
						catsSet.set(lower, toTitleCase(raw));
					}
				}
			}
		}

		// Sort Alphabetically A-Z
		return Array.from(catsSet.values()).sort((a, b) =>
			a.localeCompare(b, "id", { sensitivity: "base" }),
		);
	}, [existingItems, type]);

	// Google Drive Picker launcher
	const handleOpenPicker = async () => {
		setError(null);

		// Google Picker strictly requires a Developer Key from GCP.
		if (!pickerConfig?.developerKey) {
			setError("Google Cloud API Key ('DEVELOPER_KEY') belum terbaca di Script Properties.");
			return;
		}

		if (!pickerConfig.oauthToken) {
			setError("Sesi Google Apps Script tidak aktif. Silakan muat ulang halaman.");
			return;
		}

		try {
			setIsOpeningPicker(true);
			await loadPickerApi();
			const google = (window as any).google;
			if (!google?.picker) {
				throw new Error("Pustaka Google Picker tidak dapat dimuat.");
			}

			// Clean origin to satisfy Google Picker iframe security
			const hostOrigin =
				typeof google.script?.host?.origin === "string" && google.script.host.origin
					? google.script.host.origin
					: window.location.origin;
			const cleanOrigin = hostOrigin.endsWith("/") ? hostOrigin.slice(0, -1) : hostOrigin;

			// 1. View for browsing Drive (including Shared Drives)
			const docsView = new google.picker.DocsView(google.picker.ViewId.DOCS);
			docsView.setIncludeFolders(true);
			docsView.setSelectFolderEnabled(false);
			if (pickerConfig.folderId) {
				docsView.setParent(pickerConfig.folderId);
			}

			// 2. View for uploading local files directly to the showroom receipts folder
			const uploadView = new google.picker.DocsUploadView();
			if (pickerConfig.folderId) {
				uploadView.setParent(pickerConfig.folderId);
			}

			const pickerBuilder = new google.picker.PickerBuilder()
				.setDeveloperKey(pickerConfig.developerKey)
				.setOAuthToken(pickerConfig.oauthToken)
				.setLocale("id")
				.enableFeature(google.picker.Feature.SUPPORT_DRIVES)
				.addView(docsView)
				.addView(uploadView)
				.setCallback((data: any) => {
					if (data.action === google.picker.Action.PICKED) {
						const doc = data.docs?.[0];
						if (doc) {
							const fileUrl = doc.url || `https://drive.google.com/open?id=${doc.id}`;
							setPickedFile({
								id: doc.id,
								name: doc.name,
								url: fileUrl,
							});
							setPreserveAttachment(false);
							if (!notes) {
								setNotes(doc.name);
							}
						}
					}
				});

			if (cleanOrigin && cleanOrigin.startsWith("http")) {
				pickerBuilder.setOrigin(cleanOrigin);
			}

			if (pickerConfig.appId) {
				pickerBuilder.setAppId(pickerConfig.appId);
			}

			const picker = pickerBuilder.build();
			picker.setVisible(true);
		} catch (err: unknown) {
			console.error("Gagal membuka Google Drive Picker:", err);
			const msg = err instanceof Error ? err.message : "Gagal membuka Drive Picker.";
			setError(msg);
		} finally {
			setIsOpeningPicker(false);
		}
	};

	const handleRemoveAttachment = () => {
		setPickedFile(null);
		setPreserveAttachment(false);
	};

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		setError(null);

		if (!type) {
			setError("Silakan pilih jenis transaksi terlebih dahulu (Pengeluaran atau Pemasukan).");
			return;
		}

		const cleanDate = date.trim();
		if (!cleanDate) {
			setError("Tanggal transaksi wajib diisi.");
			return;
		}

		const finalCategory = category.trim();
		if (!finalCategory) {
			setError("Kategori transaksi wajib dipilih atau diketik.");
			return;
		}

		const numAmount = typeof amount === "number" ? amount : parseRp(amount);
		if (numAmount <= 0) {
			setError("Nominal transaksi harus lebih dari Rp 0.");
			return;
		}

		const cleanDesc = description.trim();
		if (!cleanDesc) {
			setError("Keterangan transaksi wajib diisi.");
			return;
		}

		try {
			setIsSubmitting(true);
			if (isEdit && initialData) {
				const updatePayload: CashTransactionUpdateInput = {
					rowIdx: initialData.rowIdx,
					type,
					date: cleanDate,
					description: cleanDesc,
					category: finalCategory,
					amount: numAmount,
					notes: notes.trim(),
					fileId: pickedFile?.id,
					fileName: pickedFile?.name,
					fileUrl: pickedFile?.url,
					preserveAttachment: preserveAttachment && !pickedFile?.url,
				};
				await onSubmit(updatePayload);
			} else {
				const createPayload: CashTransactionCreateInput = {
					type,
					date: cleanDate,
					description: cleanDesc,
					category: finalCategory,
					amount: numAmount,
					notes: notes.trim(),
					fileId: pickedFile?.id,
					fileName: pickedFile?.name,
					fileUrl: pickedFile?.url,
				};
				await onSubmit(createPayload);
			}
			onClose();
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan transaksi.";
			setError(msg);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
			{/* NOTICE: NO overflow-hidden on container card so suggestion dropdown is never clipped */}
			<div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-xl my-8 relative animate-in fade-in zoom-in-95 duration-150">
				{/* Modal Header */}
				<div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white rounded-t-2xl">
					<div className="flex items-center gap-2.5">
						<div
							className={`w-9 h-9 rounded-xl flex items-center justify-center ${
								type === "IN"
									? "bg-emerald-100 text-emerald-700"
									: type === "OUT"
										? "bg-rose-100 text-rose-700"
										: "bg-blue-100 text-blue-700"
							}`}
						>
							{type === "IN" ? (
								<IconArrowDownLeft className="w-5 h-5" />
							) : type === "OUT" ? (
								<IconArrowUpRight className="w-5 h-5" />
							) : (
								<IconPaperclip className="w-5 h-5" />
							)}
						</div>
						<div>
							<h3 className="text-base font-bold text-slate-800">
								{isEdit ? "Edit Transaksi Kas" : "Tambah Transaksi Kas Operasional"}
							</h3>
							<p className="text-xs text-slate-400">
								{isEdit
									? `Perbarui baris #${initialData?.rowIdx} di PENGELUARAN KAS`
									: "Catat pengeluaran atau pemasukan kas operasional showroom"}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						type="button"
						className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
					>
						<IconX className="w-5 h-5" />
					</button>
				</div>

				{/* Modal Form */}
				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					{error && (
						<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
							<span className="font-bold">Error:</span>
							<span>{error}</span>
						</div>
					)}

					{/* 1. Segmented Toggle: Pengeluaran vs Pemasukan */}
					<div>
						<label className="block text-xs font-semibold text-slate-700 mb-1.5">
							Jenis Transaksi <span className="text-rose-500">*</span>
						</label>
						<div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
							<button
								type="button"
								onClick={() => {
									setType("OUT");
									if (type !== "OUT") setCategory("");
								}}
								className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
									type === "OUT"
										? "bg-rose-600 text-white shadow-sm"
										: "text-slate-600 hover:text-slate-900 hover:bg-white/60"
								}`}
							>
								<IconArrowUpRight className="w-4 h-4" />
								<span>Pengeluaran (Kas Keluar)</span>
							</button>

							<button
								type="button"
								onClick={() => {
									setType("IN");
									if (type !== "IN") setCategory("");
								}}
								className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
									type === "IN"
										? "bg-emerald-600 text-white shadow-sm"
										: "text-slate-600 hover:text-slate-900 hover:bg-white/60"
								}`}
							>
								<IconArrowDownLeft className="w-4 h-4" />
								<span>Pemasukan (Kas Masuk)</span>
							</button>
						</div>
						{!type && (
							<p className="text-[11px] text-amber-600 font-medium mt-1">
								* Wajib memilih salah satu sebelum menyimpan.
							</p>
						)}
					</div>

					{/* 2. Date and Category */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1.5">
								Tanggal <span className="text-rose-500">*</span>
							</label>
							<DatePicker value={date} onChange={setDate} />
						</div>

						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1.5">
								Kategori <span className="text-rose-500">*</span>
							</label>
							<CategoryCombobox
								value={category}
								onChange={setCategory}
								options={categoryOptions}
								placeholder={
									type === "IN"
										? "Pilih atau ketik kategori masuk..."
										: "Pilih atau ketik kategori keluar..."
								}
							/>
						</div>
					</div>

					{/* 3. Nominal (Amount) */}
					<div>
						<label className="block text-xs font-semibold text-slate-700 mb-1.5">
							Nominal (Rp) <span className="text-rose-500">*</span>
						</label>
						<div className="relative">
							<span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
								Rp
							</span>
							<input
								type="text"
								value={
									typeof amount === "number"
										? new Intl.NumberFormat("id-ID").format(amount)
										: amount
								}
								onInput={(e) => {
									const raw = (e.target as HTMLInputElement).value;
									const parsed = parseRp(raw);
									setAmount(parsed === 0 && raw === "" ? "" : parsed);
								}}
								placeholder="0"
								required
								className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono font-bold text-slate-800"
							/>
						</div>
						{typeof amount === "number" && amount > 0 && (
							<div className="text-[11px] text-slate-400 mt-1">
								Terbaca: <strong className="text-slate-700 font-mono">{formatRp(amount)}</strong>
							</div>
						)}
					</div>

					{/* 4. Keterangan (Free text, required) */}
					<div>
						<label className="block text-xs font-semibold text-slate-700 mb-1.5">
							Keterangan <span className="text-rose-500">*</span>
						</label>
						<input
							type="text"
							value={description}
							onInput={(e) => setDescription((e.target as HTMLInputElement).value)}
							placeholder="Contoh: Pulsa kantor, Ganti oli, Service rem, dsb..."
							required
							className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
						/>
					</div>

					{/* 5. Attachment & Notes (Google Drive Smart Chip support) */}
					<div className="pt-2 border-t border-slate-100 space-y-2.5">
						<div className="flex items-center justify-between">
							<label className="block text-xs font-semibold text-slate-700">
								Lampiran / Bukti Nota (Google Drive)
							</label>
							<span className="text-[10px] text-slate-400">Opsional</span>
						</div>

						{/* Existing attachment / Picked file display */}
						{pickedFile ? (
							<div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
								<div className="flex items-center gap-2.5 min-w-0">
									<div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
										<IconFileText className="w-4 h-4" />
									</div>
									<div className="min-w-0">
										<div className="text-xs font-bold text-slate-800 truncate">
											{pickedFile.name}
										</div>
										<a
											href={pickedFile.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
										>
											<span>Buka Link Drive</span>
											<IconExternalLink className="w-3 h-3" />
										</a>
									</div>
								</div>
								<div className="flex items-center gap-1 shrink-0">
									<button
										type="button"
										onClick={handleOpenPicker}
										disabled={isOpeningPicker}
										title="Ganti Lampiran Drive"
										className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
									>
										<IconPaperclip className="w-4 h-4" />
									</button>
									<button
										type="button"
										onClick={handleRemoveAttachment}
										title="Hapus Lampiran"
										className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
									>
										<IconTrash2 className="w-4 h-4" />
									</button>
								</div>
							</div>
						) : (
							<div>
								<button
									type="button"
									onClick={handleOpenPicker}
									disabled={isOpeningPicker}
									className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm hover:shadow"
								>
									{isOpeningPicker ? (
										<>
											<div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
											<span>Membuka Google Drive...</span>
										</>
									) : (
										<>
											<IconPaperclip className="w-4 h-4" />
											<span>Pilih atau Upload Bukti dari Google Drive</span>
										</>
									)}
								</button>
							</div>
						)}

						{/* Catatan / Keterangan Lampiran Tambahan */}
						<div>
							<label className="block text-[11px] font-semibold text-slate-500 mb-1">
								Catatan / Judul Lampiran
							</label>
							<input
								type="text"
								value={notes}
								onInput={(e) => setNotes((e.target as HTMLInputElement).value)}
								placeholder="Contoh: Nota Service AC Toko Jaya"
								className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
							/>
						</div>
					</div>

					{/* Modal Footer Actions */}
					<div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
						<button
							type="button"
							onClick={onClose}
							disabled={isSubmitting}
							className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
						>
							Batal
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
								type === "IN"
									? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
									: type === "OUT"
										? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
										: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
							}`}
						>
							{isSubmitting ? (
								<>
									<div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									<span>Menyimpan...</span>
								</>
							) : (
								<>
									<IconCheck className="w-4 h-4" />
									<span>{isEdit ? "Perbarui Transaksi" : "Simpan Transaksi"}</span>
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
