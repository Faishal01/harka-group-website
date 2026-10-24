import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import IconArrowDownLeft from "~icons/lucide/arrow-down-left";
import IconArrowUpRight from "~icons/lucide/arrow-up-right";
import IconCar from "~icons/lucide/car";
import IconCheck from "~icons/lucide/check";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconExternalLink from "~icons/lucide/external-link";
import IconFileText from "~icons/lucide/file-text";
import IconPaperclip from "~icons/lucide/paperclip";
import IconTrash2 from "~icons/lucide/trash-2";
import IconUpload from "~icons/lucide/upload";
import IconX from "~icons/lucide/x";
import {
	CASH_EXPENSE_CATEGORIES,
	CASH_INCOME_CATEGORIES,
	CashTransactionCreateInput,
	CashTransactionItem,
	CashTransactionUpdateInput,
	formatDateToDDMMYY,
	formatRp,
	parseRp,
	PickerConfig,
} from "../../../shared/schema";
import { CustomSelect, CustomSelectOption } from "../CustomSelect";
import { DatePicker } from "../DatePicker";

export interface CarSuggestionItem {
	plateNumber: string;
	carDescription: string;
}

interface CashflowFormModalProps {
	mode: "add" | "edit";
	initialData?: CashTransactionItem | null;
	availableCars?: CarSuggestionItem[];
	pickerConfig?: PickerConfig;
	onClose: () => void;
	onSubmit: (payload: CashTransactionCreateInput | CashTransactionUpdateInput) => Promise<void>;
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
	availableCars = [],
	pickerConfig,
	onClose,
	onSubmit,
}: CashflowFormModalProps) {
	const isEdit = mode === "edit";

	// Form states
	const [type, setType] = useState<"OUT" | "IN" | null>(initialData ? initialData.type : null);
	const [date, setDate] = useState<string>(initialData?.date || formatDateToDDMMYY(new Date()));
	const [category, setCategory] = useState<string>(initialData?.category || "");
	const [customCategory, setCustomCategory] = useState<string>("");
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
	const [manualUrl, setManualUrl] = useState<string>("");
	const [showManualUrl, setShowManualUrl] = useState<boolean>(false);

	// Suggestion popover state
	const [isCarDropdownOpen, setIsCarDropdownOpen] = useState(false);
	const carDropdownRef = useRef<HTMLDivElement>(null);

	// UI feedback states
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isOpeningPicker, setIsOpeningPicker] = useState(false);
	const [isUploadingFile, setIsUploadingFile] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Keyboard shortcuts (Escape closes modal)
	useEffect(() => {
		const onEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onEsc);
		return () => window.removeEventListener("keydown", onEsc);
	}, [onClose]);

	// Close car suggestion dropdown on click outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (carDropdownRef.current && !carDropdownRef.current.contains(e.target as Node)) {
				setIsCarDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Filter available cars based on description query
	const filteredCars = useMemo(() => {
		const q = description.trim().toLowerCase();
		if (!q) return availableCars.slice(0, 15);
		return availableCars
			.filter(
				(c) =>
					c.plateNumber.toLowerCase().includes(q) || c.carDescription.toLowerCase().includes(q),
			)
			.slice(0, 15);
	}, [availableCars, description]);

	// Category options depending on type
	const standardCategories = useMemo(() => {
		if (type === "IN") return CASH_INCOME_CATEGORIES;
		return CASH_EXPENSE_CATEGORIES;
	}, [type]);

	const categoryOptions = useMemo<CustomSelectOption[]>(() => {
		const list: CustomSelectOption[] = standardCategories.map((cat) => ({
			label: cat,
			value: cat,
		}));
		list.push({
			label: "+ Kategori Kustom...",
			value: "CUSTOM",
		});
		return list;
	}, [standardCategories]);

	// Direct File Upload handler (uploads to Google Drive via Apps Script)
	const handleFileSelect = async (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		setError(null);
		setIsUploadingFile(true);

		try {
			// Convert selected file to base64
			const reader = new FileReader();
			const base64Promise = new Promise<string>((resolve, reject) => {
				reader.onload = () => {
					const result = String(reader.result || "");
					const commaIdx = result.indexOf(",");
					resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
				};
				reader.onerror = () => reject(new Error("Gagal membaca file dari perangkat lokal."));
			});
			reader.readAsDataURL(file);

			const base64Data = await base64Promise;

			// If running in GAS environment, call backend Drive upload
			const googleScript = (window as any).google?.script;
			if (typeof googleScript?.run?.uploadReceiptToDrive === "function") {
				const uploadResult = await new Promise<{
					fileId: string;
					fileName: string;
					fileUrl: string;
				}>((resolve, reject) => {
					googleScript.run
						.withSuccessHandler((res: { fileId: string; fileName: string; fileUrl: string }) => {
							resolve(res);
						})
						.withFailureHandler((err: Error) => {
							reject(err);
						})
						.uploadReceiptToDrive({
							fileName: file.name,
							mimeType: file.type || "application/octet-stream",
							base64Data,
						});
				});

				setPickedFile({
					id: uploadResult.fileId,
					name: uploadResult.fileName,
					url: uploadResult.fileUrl,
				});
				setPreserveAttachment(false);
				if (!notes) {
					setNotes(uploadResult.fileName);
				}
			} else {
				// Mock in dev
				await new Promise((r) => setTimeout(r, 600));
				const mockId = `mock-${Date.now()}`;
				setPickedFile({
					id: mockId,
					name: file.name,
					url: `https://drive.google.com/file/d/${mockId}/view`,
				});
				setPreserveAttachment(false);
				if (!notes) {
					setNotes(file.name);
				}
			}
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : "Gagal mengunggah file bukti nota ke Google Drive.";
			setError(msg);
		} finally {
			setIsUploadingFile(false);
			if (target) target.value = "";
		}
	};

	// Google Drive Picker launcher
	const handleOpenPicker = async () => {
		setError(null);

		// Google Picker strictly requires a Developer Key from GCP.
		// If none configured, guide user to direct file upload or manual link input.
		if (!pickerConfig?.developerKey) {
			setShowManualUrl(true);
			setError(
				"Google Drive Picker memerlukan 'DEVELOPER_KEY' (Google Cloud API Key). Untuk mengunggah bukti nota tanpa API Key, silakan gunakan tombol 'Upload File / Foto' atau tempel link Drive di bawah.",
			);
			return;
		}

		if (!pickerConfig.oauthToken) {
			setShowManualUrl(true);
			setError(
				"Sesi Google Apps Script tidak aktif. Silakan gunakan tombol 'Upload File / Foto' atau tempel link Drive di bawah.",
			);
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
				typeof google.script?.host?.origin === "string"
					? google.script.host.origin
					: window.location.origin;
			const cleanOrigin = hostOrigin.endsWith("/") ? hostOrigin.slice(0, -1) : hostOrigin;

			const view = new google.picker.DocsView(google.picker.ViewId.DOCS);
			view.setIncludeFolders(true);
			if (pickerConfig.folderId) {
				view.setParent(pickerConfig.folderId);
			}

			const uploadView = new google.picker.DocsUploadView();
			if (pickerConfig.folderId) {
				uploadView.setParent(pickerConfig.folderId);
			}

			const pickerBuilder = new google.picker.PickerBuilder()
				.enableFeature(google.picker.Feature.NAV_HIDDEN)
				.setDeveloperKey(pickerConfig.developerKey)
				.setOAuthToken(pickerConfig.oauthToken)
				.setOrigin(cleanOrigin)
				.addView(view)
				.addView(uploadView)
				.setCallback((data: any) => {
					if (data.action === google.picker.Action.PICKED) {
						const doc = data.docs[0];
						const fileUrl = doc.url || `https://drive.google.com/file/d/${doc.id}/view`;
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
				});

			if (pickerConfig.appId) {
				pickerBuilder.setAppId(pickerConfig.appId);
			}

			const picker = pickerBuilder.build();
			picker.setVisible(true);
		} catch (err: unknown) {
			console.error("Gagal membuka Google Drive Picker:", err);
			setShowManualUrl(true);
			const msg =
				err instanceof Error
					? err.message
					: "Gagal membuka Drive Picker. Silakan gunakan upload file.";
			setError(msg);
		} finally {
			setIsOpeningPicker(false);
		}
	};

	const handleAddManualUrl = () => {
		const trimmed = manualUrl.trim();
		if (!trimmed) return;
		if (!/^https?:\/\//i.test(trimmed)) {
			setError("Link file harus diawali dengan http:// atau https://");
			return;
		}

		// Extract a clean file name guess or fallback
		let guessedName = "Lampiran Drive";
		try {
			const u = new URL(trimmed);
			const pathParts = u.pathname.split("/").filter(Boolean);
			if (pathParts.length > 0) {
				const last = pathParts[pathParts.length - 1];
				if (last && last !== "view" && last !== "edit") guessedName = last;
			}
		} catch {
			// ignore
		}

		setPickedFile({
			name: notes.trim() || guessedName,
			url: trimmed,
		});
		setPreserveAttachment(false);
		setManualUrl("");
		setError(null);
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

		const finalCategory = category === "CUSTOM" ? customCategory.trim() : category.trim();
		if (!finalCategory) {
			setError("Kategori transaksi wajib dipilih.");
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
							<CustomSelect
								value={category}
								onChange={(val) => setCategory(val)}
								options={categoryOptions}
								placeholder="-- Pilih Kategori --"
								headerTitle="Pilih Kategori Transaksi"
								size="md"
								menuWidth="w-full"
								className="w-full"
							/>
							{category === "CUSTOM" && (
								<input
									type="text"
									value={customCategory}
									onInput={(e) => setCustomCategory((e.target as HTMLInputElement).value)}
									placeholder="Ketik kategori kustom..."
									required
									className="mt-2 w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
								/>
							)}
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

					{/* 4. Keterangan with Car Plate Suggestion Popover */}
					<div className="relative" ref={carDropdownRef}>
						<div className="flex items-center justify-between mb-1.5">
							<label className="block text-xs font-semibold text-slate-700">
								Keterangan <span className="text-rose-500">*</span>
							</label>
							<span className="text-[10px] text-slate-400">
								Bisa pilih unit mobil atau ketik bebas
							</span>
						</div>
						<div className="relative">
							<input
								type="text"
								value={description}
								onInput={(e) => {
									setDescription((e.target as HTMLInputElement).value);
									setIsCarDropdownOpen(true);
								}}
								onFocus={() => setIsCarDropdownOpen(true)}
								placeholder="Contoh: B 1152 SSF Service ac, atau Beli bensin operasional..."
								required
								className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
							/>
							<IconCar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
							<button
								type="button"
								onClick={() => setIsCarDropdownOpen(!isCarDropdownOpen)}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
							>
								<IconChevronDown
									className={`w-3.5 h-3.5 transition-transform ${isCarDropdownOpen ? "rotate-180" : ""}`}
								/>
							</button>
						</div>

						{/* Car suggestion dropdown popover */}
						{isCarDropdownOpen && filteredCars.length > 0 && (
							<div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
								<div className="p-2 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
									<span>Pilih Unit Mobil (Opsional)</span>
									<span>{filteredCars.length} unit</span>
								</div>
								{filteredCars.map((car) => (
									<button
										key={car.plateNumber}
										type="button"
										onClick={() => {
											const chosenDesc = car.plateNumber
												? `${car.plateNumber} ${car.carDescription}`
												: car.carDescription;
											setDescription(chosenDesc);
											if (type === "OUT" && !category) {
												setCategory("PENGELUARAN SERVICE");
											}
											setIsCarDropdownOpen(false);
										}}
										className="w-full text-left p-2.5 hover:bg-blue-50/60 transition-colors flex items-center justify-between gap-2 group cursor-pointer"
									>
										<div className="min-w-0 flex-1">
											<div className="font-semibold text-slate-800 text-xs truncate group-hover:text-blue-600">
												{car.carDescription}
											</div>
										</div>
										<span className="shrink-0 font-mono font-bold text-[10px] bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-700 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 group-hover:border-blue-200">
											{car.plateNumber}
										</span>
									</button>
								))}
							</div>
						)}
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
								<button
									type="button"
									onClick={handleRemoveAttachment}
									title="Hapus Lampiran"
									className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
								>
									<IconTrash2 className="w-4 h-4" />
								</button>
							</div>
						) : (
							<div className="space-y-2">
								{/* Hidden native file input for direct upload */}
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileSelect}
									accept="image/*,application/pdf"
									className="hidden"
								/>

								<div className="flex flex-col sm:flex-row gap-2">
									<button
										type="button"
										onClick={() => fileInputRef.current?.click()}
										disabled={isUploadingFile}
										className="flex-1 py-2 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
									>
										{isUploadingFile ? (
											<>
												<div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
												<span>Mengunggah ke Drive...</span>
											</>
										) : (
											<>
												<IconUpload className="w-4 h-4" />
												<span>Upload File / Foto Bukti</span>
											</>
										)}
									</button>

									<button
										type="button"
										onClick={() => setShowManualUrl(!showManualUrl)}
										className="py-2 px-3 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
									>
										{showManualUrl ? "Tutup Link URL" : "Tempel Link Drive"}
									</button>

									{pickerConfig?.developerKey && (
										<button
											type="button"
											onClick={handleOpenPicker}
											disabled={isOpeningPicker}
											title="Buka Google Drive Picker"
											className="py-2 px-3 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
										>
											<IconPaperclip className="w-3.5 h-3.5 text-slate-500" />
											<span>{isOpeningPicker ? "Membuka..." : "Drive Picker"}</span>
										</button>
									)}
								</div>

								{showManualUrl && (
									<div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
										<label className="block text-[11px] font-semibold text-slate-600">
											Tempel Link File Google Drive:
										</label>
										<div className="flex gap-2">
											<input
												type="url"
												value={manualUrl}
												onInput={(e) => setManualUrl((e.target as HTMLInputElement).value)}
												placeholder="https://drive.google.com/file/d/.../view"
												className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
											/>
											<button
												type="button"
												onClick={handleAddManualUrl}
												className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
											>
												Pasang
											</button>
										</div>
									</div>
								)}
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
