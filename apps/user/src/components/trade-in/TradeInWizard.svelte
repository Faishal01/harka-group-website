<script lang="ts">
	import { onMount } from "svelte";
	import { tradeInCaptions } from "~/data/captions";
	import { compressImagesBatch, type ImageSlotItem } from "~/utils/imageCompression";
	import {
		validatePlateNumber,
		formatPlateNumber,
		ownershipStatuses,
		ownershipStatusMap,
		type OwnershipStatus,
	} from "@harka/db";

	// Current wizard step (1 to 4)
	let currentStep = $state(1);

	const stepItems = [
		{ num: 1, shortLabel: "Spesifikasi", label: "Spesifikasi" },
		{ num: 2, shortLabel: "Dokumen", label: "Dokumen & Kondisi" },
		{ num: 3, shortLabel: "Foto", label: "Foto (10+)" },
		{ num: 4, shortLabel: "Kontak", label: "Kontak & Kirim" },
	];

	// Form State: Step 1 (Vehicle Specs & Price)
	let make = $state("");
	let model = $state("");
	let year = $state<number | "">("");
	let mileage = $state<number | "">("");
	let transmission = $state("Automatic");
	let fuelType = $state("Petrol");
	let sellingPrice = $state<number | "">("");

	// Form State: Step 2 (Documents & Condition)
	let plateNumber = $state("");
	let plateError = $state("");

	function handlePlateBlur() {
		const trimmed = plateNumber.trim();
		if (!trimmed) {
			plateError = "Nomor Polisi / Plat Nomor wajib diisi.";
			return;
		}
		if (validatePlateNumber(trimmed)) {
			plateError = "";
			plateNumber = formatPlateNumber(trimmed) || trimmed;
		} else {
			plateError = "Format plat nomor tidak valid (mis. B 1234 ABC)";
		}
	}

	function handlePlateInput() {
		if (plateError && validatePlateNumber(plateNumber.trim())) {
			plateError = "";
		}
	}

	let ownershipStatus = $state<OwnershipStatus>("first_hand");
	let sphFile = $state<File | null>(null);
	let sphError = $state<string>("");

	function handleSphSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		sphError = "";
		const ext = file.name.split(".").pop()?.toLowerCase();
		if (!ext || !["pdf", "doc", "docx"].includes(ext)) {
			sphError = "Format file tidak didukung. Harap unggah file .pdf, .doc, atau .docx.";
			target.value = "";
			return;
		}

		if (file.size > 4 * 1024 * 1024) {
			sphError = "Ukuran file terlalu besar. Maksimal ukuran file adalah 4 MB.";
			target.value = "";
			return;
		}

		sphFile = file;
		target.value = "";
	}

	function removeSphFile() {
		sphFile = null;
		sphError = "";
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024 * 1024) {
			return `${(bytes / 1024).toFixed(1)} KB`;
		}
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	}

	$effect(() => {
		if (ownershipStatus !== "company_car" && (sphFile || sphError)) {
			sphFile = null;
			sphError = "";
		}
	});

	let stnkStatus = $state<"active" | "expired">("active");
	let stnkTaxExpiry = $state("");
	let hasFaktur = $state(false);
	let hasServiceBook = $state(false);
	let hasSpareKey = $state(false);
	let adminNotes = $state("");
	let isFloodFree = $state(false);
	let isAccidentFree = $state(false);
	let conditionNotes = $state("");

	// Form State: Step 3 (10 Guided Photo Slots)
	const slots = tradeInCaptions.photoSlots;

	// Map of slotId -> { file: File, previewUrl: string }
	let photoMap = $state<Record<string, { file: File; previewUrl: string }>>({});

	// Extra optional photos
	let extraPhotos = $state<{ id: string; file: File; previewUrl: string }[]>([]);

	// Form State: Step 4 (Contact Details)
	let customerName = $state("");
	let customerPhone = $state("");
	let customerCity = $state("");
	let customerEmail = $state("");

	// Submission state
	let isSubmitting = $state(false);
	let submitProgressText = $state("");
	let submitProgressPercent = $state(0);
	let submitPhaseTitle = $state("");
	let submitError = $state("");
	let isSubmitted = $state(false);
	let submissionId = $state("");

	// Draft Persistence State
	const DRAFT_STORAGE_KEY = "harka_trade_in_draft_v1";

	interface StoredDraft {
		version: 1;
		savedAt: number;
		make: string;
		model: string;
		year: number | "";
		mileage: number | "";
		transmission: string;
		fuelType: string;
		sellingPrice: number | "";
		plateNumber: string;
		ownershipStatus: OwnershipStatus;
		stnkStatus: "active" | "expired";
		stnkTaxExpiry: string;
		hasFaktur: boolean;
		hasServiceBook: boolean;
		hasSpareKey: boolean;
		adminNotes: string;
		isFloodFree: boolean;
		isAccidentFree: boolean;
		conditionNotes: string;
		customerName: string;
		customerPhone: string;
		customerCity: string;
		customerEmail: string;
	}

	let hasDraft = $state(false);
	let draftData = $state<StoredDraft | null>(null);

	onMount(() => {
		try {
			const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as StoredDraft;
				if (
					parsed &&
					(Boolean(parsed.make) ||
						Boolean(parsed.model) ||
						Boolean(parsed.plateNumber) ||
						Boolean(parsed.customerName))
				) {
					hasDraft = true;
					draftData = parsed;
				}
			}
		} catch {
			// ignore localStorage failure
		}
	});

	function applyDraft() {
		if (!draftData) return;
		make = draftData.make ?? "";
		model = draftData.model ?? "";
		year = draftData.year ?? "";
		mileage = draftData.mileage ?? "";
		transmission = draftData.transmission ?? "Automatic";
		fuelType = draftData.fuelType ?? "Petrol";
		sellingPrice = draftData.sellingPrice ?? "";

		plateNumber = draftData.plateNumber ?? "";
		ownershipStatus = draftData.ownershipStatus ?? "first_hand";
		stnkStatus = draftData.stnkStatus ?? "active";
		stnkTaxExpiry = draftData.stnkTaxExpiry ?? "";
		hasFaktur = Boolean(draftData.hasFaktur);
		hasServiceBook = Boolean(draftData.hasServiceBook);
		hasSpareKey = Boolean(draftData.hasSpareKey);
		adminNotes = draftData.adminNotes ?? "";

		isFloodFree = Boolean(draftData.isFloodFree);
		isAccidentFree = Boolean(draftData.isAccidentFree);
		conditionNotes = draftData.conditionNotes ?? "";

		customerName = draftData.customerName ?? "";
		customerPhone = draftData.customerPhone ?? "";
		customerCity = draftData.customerCity ?? "";
		customerEmail = draftData.customerEmail ?? "";

		hasDraft = false;
	}

	function discardDraft() {
		try {
			localStorage.removeItem(DRAFT_STORAGE_KEY);
		} catch {
			// ignore
		}
		hasDraft = false;
		draftData = null;
	}

	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	function triggerAutoSave() {
		if (typeof window === "undefined" || isSubmitted) return;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			try {
				const draft: StoredDraft = {
					version: 1,
					savedAt: Date.now(),
					make,
					model,
					year,
					mileage,
					transmission,
					fuelType,
					sellingPrice,
					plateNumber,
					ownershipStatus,
					stnkStatus,
					stnkTaxExpiry,
					hasFaktur,
					hasServiceBook,
					hasSpareKey,
					adminNotes,
					isFloodFree,
					isAccidentFree,
					conditionNotes,
					customerName,
					customerPhone,
					customerCity,
					customerEmail,
				};
				if (make || model || plateNumber || customerName) {
					localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
				}
			} catch {
				// ignore quota errors
			}
		}, 400);
	}

	$effect(() => {
		// Reactive dependency tracking for draft auto-save
		void [
			make,
			model,
			year,
			mileage,
			transmission,
			fuelType,
			sellingPrice,
			plateNumber,
			ownershipStatus,
			stnkStatus,
			stnkTaxExpiry,
			hasFaktur,
			hasServiceBook,
			hasSpareKey,
			adminNotes,
			isFloodFree,
			isAccidentFree,
			conditionNotes,
			customerName,
			customerPhone,
			customerCity,
			customerEmail,
		];
		triggerAutoSave();
	});

	// Helper for IDR formatting
	function formatRupiah(val: number | ""): string {
		if (typeof val !== "number" || isNaN(val) || val <= 0) return "";
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);
	}

	// Slot file selection handler
	function handleSlotFileSelect(slotId: string, event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			const file = files[0];
			if (photoMap[slotId]?.previewUrl) {
				URL.revokeObjectURL(photoMap[slotId].previewUrl);
			}
			photoMap = {
				...photoMap,
				[slotId]: {
					file,
					previewUrl: URL.createObjectURL(file),
				},
			};
		}
	}

	function removeSlotFile(slotId: string) {
		if (photoMap[slotId]?.previewUrl) {
			URL.revokeObjectURL(photoMap[slotId].previewUrl);
		}
		const updated = { ...photoMap };
		delete updated[slotId];
		photoMap = updated;
	}

	// Extra photos handler
	function handleExtraFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			const newExtras = Array.from(files).map((file, idx) => ({
				id: `extra_${Date.now()}_${idx}`,
				file,
				previewUrl: URL.createObjectURL(file),
			}));
			extraPhotos = [...extraPhotos, ...newExtras];
		}
	}

	function removeExtraPhoto(id: string) {
		const item = extraPhotos.find((p) => p.id === id);
		if (item?.previewUrl) {
			URL.revokeObjectURL(item.previewUrl);
		}
		extraPhotos = extraPhotos.filter((p) => p.id !== id);
	}

	const completedSlotsCount = $derived(slots.filter((s) => Boolean(photoMap[s.id])).length);
	const isStep3Valid = $derived(completedSlotsCount >= slots.length);

	// Step validation
	const isStep1Valid = $derived(
		make.trim().length > 0 &&
			model.trim().length > 0 &&
			typeof year === "number" &&
			year >= 1950 &&
			year <= new Date().getFullYear() + 1 &&
			typeof mileage === "number" &&
			mileage >= 0 &&
			typeof sellingPrice === "number" &&
			sellingPrice > 0,
	);

	const isSphValid = $derived(ownershipStatus !== "company_car" || (Boolean(sphFile) && !sphError));

	const isStep2Valid = $derived(validatePlateNumber(plateNumber.trim()) && isSphValid);

	const isStep4Valid = $derived(
		customerName.trim().length > 0 &&
			customerPhone.trim().length >= 8 &&
			customerCity.trim().length > 0,
	);

	function goToStep(step: number) {
		if (step > currentStep) {
			if (currentStep === 1 && !isStep1Valid) return;
			if (currentStep === 2) {
				handlePlateBlur();
				if (ownershipStatus === "company_car" && !sphFile) {
					sphError =
						"Surat Pelepasan Hak (SPH) wajib diunggah (format PDF, DOC, atau DOCX, maks 4 MB).";
					return;
				}
				if (!isStep2Valid) return;
			}
			if (currentStep === 3 && !isStep3Valid) return;
		}
		if (step > 1 && hasDraft) {
			hasDraft = false;
		}
		currentStep = step;
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	// Final Submit
	async function handleSubmit() {
		if (!isStep1Valid || !isStep2Valid || !isStep3Valid || !isStep4Valid) {
			submitError = "Harap periksa kembali semua data yang diperlukan.";
			return;
		}

		isSubmitting = true;
		submitError = "";
		submitProgressPercent = 5;
		submitPhaseTitle = tradeInCaptions.form.progressStagePreparing;
		submitProgressText = "Menyiapkan berkas foto kendaraan...";

		try {
			// 1. Gather all photos
			const photoItems: ImageSlotItem[] = [];
			for (const slot of slots) {
				const item = photoMap[slot.id];
				if (item) {
					photoItems.push({
						slot: slot.id,
						label: slot.label,
						file: item.file,
					});
				}
			}
			for (let i = 0; i < extraPhotos.length; i++) {
				const extra = extraPhotos[i];
				photoItems.push({
					slot: `extra_${i + 1}`,
					label: `Foto Tambahan ${i + 1}`,
					file: extra.file,
				});
			}

			// 2. Compress photos adaptively to guarantee < 5 MB total payload
			const { compressed, totalBytes } = await compressImagesBatch(photoItems, (prog) => {
				submitProgressPercent = prog.percent;
				if (prog.phase === "loading") {
					submitPhaseTitle = tradeInCaptions.form.progressStageLoading;
				} else if (prog.phase === "compressing") {
					submitPhaseTitle = tradeInCaptions.form.progressStageCompressing;
				}
				submitProgressText = prog.message;
			});

			submitProgressPercent = 88;
			submitPhaseTitle = tradeInCaptions.form.progressStageUploading;
			submitProgressText = `Mengunggah data & ${(totalBytes / 1024 / 1024).toFixed(2)} MB foto ke server...`;

			// 3. Build Multipart FormData
			const formData = new FormData();
			formData.append("make", make.trim());
			formData.append("model", model.trim());
			formData.append("year", String(year));
			formData.append("mileage", String(mileage));
			formData.append("transmission", transmission);
			formData.append("fuelType", fuelType);
			formData.append("sellingPrice", String(sellingPrice));

			formData.append("plateNumber", formatPlateNumber(plateNumber.trim()) || plateNumber.trim());
			formData.append("ownershipStatus", ownershipStatus);
			if (ownershipStatus === "company_car" && sphFile) {
				formData.append("sphDocument", sphFile, sphFile.name);
			}
			formData.append("stnkStatus", stnkStatus);
			formData.append("stnkTaxExpiry", stnkTaxExpiry.trim());
			formData.append("hasFaktur", String(hasFaktur));
			formData.append("hasServiceBook", String(hasServiceBook));
			formData.append("hasSpareKey", String(hasSpareKey));
			formData.append("adminNotes", adminNotes.trim());

			formData.append("isFloodFree", String(isFloodFree));
			formData.append("isAccidentFree", String(isAccidentFree));
			formData.append("hasFloodDamage", String(!isFloodFree));
			formData.append("hasAccidentDamage", String(!isAccidentFree));
			formData.append("conditionNotes", conditionNotes.trim());

			formData.append("customerName", customerName.trim());
			formData.append("customerPhone", customerPhone.trim());
			formData.append("customerCity", customerCity.trim());
			formData.append("customerEmail", customerEmail.trim());

			// Photo metadata
			const photoMeta = compressed.map((item, idx) => ({
				slot: item.slot,
				label: item.label,
				fieldName: `photo_${idx}`,
			}));
			formData.append("photoMeta", JSON.stringify(photoMeta));

			// Append compressed photo files
			compressed.forEach((item, idx) => {
				formData.append(`photo_${idx}`, item.file, item.file.name);
			});

			// 4. Send POST request
			const response = await fetch("/api/trade-in/submit", {
				method: "POST",
				body: formData,
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				throw new Error(result.error || "Gagal mengirimkan pengajuan.");
			}

			submissionId = result.id;
			isSubmitted = true;
			submitProgressPercent = 100;

			// Clear draft upon successful submission
			try {
				localStorage.removeItem(DRAFT_STORAGE_KEY);
			} catch {
				// ignore
			}
			hasDraft = false;
			draftData = null;

			window.scrollTo({ top: 0, behavior: "smooth" });
		} catch (err: unknown) {
			console.error("Submission error:", err);
			submitError =
				err instanceof Error
					? err.message
					: "Terjadi kendala saat mengirimkan pengajuan. Silakan coba lagi.";
		} finally {
			isSubmitting = false;
		}
	}

	function resetForm() {
		// Clean up preview URLs
		Object.values(photoMap).forEach((p) => URL.revokeObjectURL(p.previewUrl));
		extraPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));

		photoMap = {};
		extraPhotos = [];
		make = "";
		model = "";
		year = "";
		mileage = "";
		sellingPrice = "";
		ownershipStatus = "first_hand";
		stnkStatus = "active";
		stnkTaxExpiry = "";
		hasFaktur = false;
		hasServiceBook = false;
		hasSpareKey = false;
		isFloodFree = false;
		isAccidentFree = false;
		adminNotes = "";
		conditionNotes = "";
		customerName = "";
		customerPhone = "";
		customerCity = "";
		customerEmail = "";
		currentStep = 1;
		isSubmitted = false;
		submissionId = "";
	}
</script>

<div class="max-w-4xl mx-auto">
	{#if isSubmitted}
		<!-- Success Confirmation Screen -->
		<div class="bg-white rounded-2xl shadow-md border border-gray-100 p-8 sm:p-12 text-center">
			<div
				class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-10 h-10"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			</div>

			<h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
				{tradeInCaptions.form.successTitle}
			</h2>
			<p class="text-gray-600 max-w-xl mx-auto mb-6 text-base sm:text-lg leading-relaxed">
				{tradeInCaptions.form.successDesc}
			</p>

			<div
				class="bg-gray-50 rounded-xl p-5 max-w-md mx-auto mb-8 border border-gray-200/80 text-left text-sm"
			>
				<div class="flex justify-between py-1.5 border-b border-gray-200">
					<span class="text-gray-500">Nomor Referensi:</span>
					<span class="font-mono font-bold text-gray-900">{submissionId}</span>
				</div>
				<div class="flex justify-between py-1.5 border-b border-gray-200">
					<span class="text-gray-500">Mobil:</span>
					<span class="font-semibold text-gray-900">{year} {make} {model}</span>
				</div>
				<div class="flex justify-between py-1.5 border-b border-gray-200">
					<span class="text-gray-500">Ekspektasi Harga:</span>
					<span class="font-bold text-red-700">{formatRupiah(sellingPrice)}</span>
				</div>
				<div class="flex justify-between py-1.5">
					<span class="text-gray-500">WhatsApp Pelanggan:</span>
					<span class="font-semibold text-gray-900">{customerPhone}</span>
				</div>
			</div>

			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<button
					type="button"
					onclick={resetForm}
					class="px-6 py-3 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition"
				>
					{tradeInCaptions.form.submitAnother}
				</button>
				<a
					href="/cars"
					class="px-6 py-3 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-800 transition shadow-sm"
				>
					Lihat Stok Tersedia
				</a>
			</div>
		</div>
	{:else}
		<!-- Draft Restoration Banner -->
		{#if hasDraft && !isSubmitted && currentStep === 1}
			<div
				class="mb-6 bg-gradient-to-r from-red-50 to-amber-50 border border-red-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200"
			>
				<div class="flex items-start gap-3">
					<div
						class="size-9 rounded-xl bg-red-100 flex items-center justify-center text-red-700 shrink-0 mt-0.5"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="size-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<div>
						<h4 class="font-bold text-gray-900 text-sm sm:text-base">
							{tradeInCaptions.form.draftFoundTitle}
						</h4>
						<p class="text-xs text-gray-600 mt-0.5 max-w-xl">
							{tradeInCaptions.form.draftFoundDesc}
							{#if draftData?.make || draftData?.model}
								<span class="font-semibold text-gray-800">
									(Unit: {draftData.year}
									{draftData.make}
									{draftData.model})
								</span>
							{/if}
						</p>
					</div>
				</div>

				<div class="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
					<button
						type="button"
						onclick={discardDraft}
						class="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-white transition"
					>
						{tradeInCaptions.form.discardDraft}
					</button>
					<button
						type="button"
						onclick={applyDraft}
						class="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-red-700 text-white font-bold text-xs hover:bg-red-800 transition shadow-sm"
					>
						{tradeInCaptions.form.useDraft}
					</button>
				</div>
			</div>
		{/if}

		<!-- Wizard Container -->
		<div class="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
			<!-- Stepper Progress Bar -->
			<div class="bg-gray-50 border-b border-gray-200 px-2 py-3 sm:px-6 sm:py-4">
				<div class="grid grid-cols-4 gap-1.5 sm:gap-3 text-center text-xs sm:text-sm font-semibold">
					{#each stepItems as step (step.num)}
						{@const isActive = currentStep === step.num}
						{@const isCompleted = currentStep > step.num}
						{@const isUpcoming = currentStep < step.num}
						<button
							type="button"
							onclick={() => goToStep(step.num)}
							disabled={isUpcoming}
							class="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 rounded-xl transition-all duration-200 {isActive
								? 'bg-red-700 text-white font-bold shadow-sm'
								: isCompleted
									? 'text-gray-700 hover:bg-gray-200/70 hover:text-gray-900 cursor-pointer'
									: 'text-gray-400 opacity-60 cursor-not-allowed'}"
						>
							<span
								class="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 transition-colors {isActive
									? 'bg-white text-red-700 font-black shadow-xs'
									: isCompleted
										? 'bg-green-100 text-green-700 font-bold'
										: 'bg-gray-200 text-gray-500'}"
							>
								{#if isCompleted}✓{:else}{step.num}{/if}
							</span>
							<span class="text-[11px] sm:text-xs md:text-sm truncate leading-tight">
								<span class="sm:hidden">{step.shortLabel}</span>
								<span class="hidden sm:inline">{step.label}</span>
							</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Wizard Body -->
			<div class="p-6 sm:p-10">
				{#if submitError}
					<div
						class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-3"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="w-5 h-5 text-red-600 shrink-0 mt-0.5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
						<div>{submitError}</div>
					</div>
				{/if}

				<!-- STEP 1: Vehicle Specs & Price -->
				{#if currentStep === 1}
					<div>
						<h3 class="text-xl font-bold text-gray-900 mb-2">{tradeInCaptions.steps.step1}</h3>
						<p class="text-gray-500 text-sm mb-6">
							Masukkan informasi spesifikasi teknis dan estimasi harga jual yang Anda harapkan.
						</p>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
							<div>
								<label for="make" class="block text-sm font-semibold text-gray-700 mb-1">
									{tradeInCaptions.form.make} <span class="text-red-600">*</span>
								</label>
								<input
									type="text"
									id="make"
									bind:value={make}
									placeholder={tradeInCaptions.form.makePlaceholder}
									class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
									required
								/>
							</div>

							<div>
								<label for="model" class="block text-sm font-semibold text-gray-700 mb-1">
									{tradeInCaptions.form.model} <span class="text-red-600">*</span>
								</label>
								<input
									type="text"
									id="model"
									bind:value={model}
									placeholder={tradeInCaptions.form.modelPlaceholder}
									class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
									required
								/>
							</div>

							<div>
								<label for="year" class="block text-sm font-semibold text-gray-700 mb-1">
									{tradeInCaptions.form.year} <span class="text-red-600">*</span>
								</label>
								<input
									type="number"
									id="year"
									bind:value={year}
									min="1950"
									max={new Date().getFullYear() + 1}
									placeholder={tradeInCaptions.form.yearPlaceholder}
									class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
									required
								/>
							</div>

							<div>
								<label for="mileage" class="block text-sm font-semibold text-gray-700 mb-1">
									{tradeInCaptions.form.mileage} <span class="text-red-600">*</span>
								</label>
								<input
									type="number"
									id="mileage"
									bind:value={mileage}
									min="0"
									placeholder={tradeInCaptions.form.mileagePlaceholder}
									class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
									required
								/>
							</div>

							<div>
								<label for="transmission" class="block text-sm font-semibold text-gray-700 mb-1">
									{tradeInCaptions.form.transmission} <span class="text-red-600">*</span>
								</label>
								<select
									id="transmission"
									bind:value={transmission}
									class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
								>
									<option value="Automatic">Automatic (Matic)</option>
									<option value="Manual">Manual</option>
									<option value="CVT">CVT</option>
									<option value="Dual-Clutch">Dual-Clutch</option>
								</select>
							</div>

							<div>
								<label for="fuelType" class="block text-sm font-semibold text-gray-700 mb-1">
									{tradeInCaptions.form.fuelType}
								</label>
								<select
									id="fuelType"
									bind:value={fuelType}
									class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
								>
									<option value="Petrol">Bensin (Petrol)</option>
									<option value="Diesel">Solar (Diesel)</option>
									<option value="Hybrid">Hybrid</option>
									<option value="Electric">Listrik (Electric)</option>
								</select>
							</div>

							<div class="sm:col-span-2 bg-red-50/60 p-5 rounded-xl border border-red-100">
								<label for="sellingPrice" class="block text-sm font-bold text-gray-900 mb-1">
									{tradeInCaptions.form.sellingPrice} <span class="text-red-600">*</span>
								</label>
								<input
									type="number"
									id="sellingPrice"
									bind:value={sellingPrice}
									min="1000000"
									step="1000000"
									placeholder={tradeInCaptions.form.sellingPricePlaceholder}
									class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition bg-white"
									required
								/>
								{#if sellingPrice && sellingPrice > 0}
									<p class="mt-2 text-sm font-bold text-red-700">
										Estimasi: {formatRupiah(sellingPrice)}
									</p>
								{/if}
							</div>
						</div>

						<div class="mt-8 flex justify-end">
							<button
								type="button"
								onclick={() => goToStep(2)}
								disabled={!isStep1Valid}
								class="px-8 py-3 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
							>
								<span>{tradeInCaptions.form.next}</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="w-4 h-4"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						</div>
					</div>

					<!-- STEP 2: Documents & Condition -->
				{:else if currentStep === 2}
					<div>
						<h3 class="text-xl font-bold text-gray-900 mb-2">{tradeInCaptions.steps.step2}</h3>
						<p class="text-gray-500 text-sm mb-6">
							Berikan informasi riwayat dan status kelengkapan surat-surat mobil Anda secara jujur
							dan transparan.
						</p>

						<div class="space-y-6">
							<!-- Legalitas Dokumen -->
							<div class="p-5 sm:p-6 bg-gray-50 rounded-xl border border-gray-200">
								<h4 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="w-5 h-5 text-red-700"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
											clip-rule="evenodd"
										/>
									</svg>
									Status Legalitas & Surat Kendaraan
								</h4>

								<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
									<div class="sm:col-span-2">
										<label
											for="tradeInPlateNumber"
											class="block text-sm font-semibold text-gray-700 mb-1"
										>
											Nomor Polisi / Plat Nomor <span class="text-red-600">*</span>
										</label>
										<input
											type="text"
											id="tradeInPlateNumber"
											bind:value={plateNumber}
											onblur={handlePlateBlur}
											oninput={handlePlateInput}
											placeholder="mis. B 1234 ABC"
											class="w-full px-4 py-2.5 rounded-xl border {plateError
												? 'border-red-500 ring-1 ring-red-500'
												: 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-600 bg-white text-sm transition uppercase font-medium"
										/>
										{#if plateError}
											<p class="mt-1.5 text-xs text-red-600 font-medium">{plateError}</p>
										{:else}
											<p class="mt-1 text-xs text-gray-400">
												Format plat nomor kendaraan Indonesia (mis. B 1234 ABC).
											</p>
										{/if}
									</div>

									<div class="sm:col-span-2">
										<span class="block text-sm font-semibold text-gray-700 mb-2">
											{tradeInCaptions.form.ownershipStatus || tradeInCaptions.form.bpkbStatus}
										</span>
										<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
											{#each ownershipStatuses as status (status)}
												<label
													class="flex items-center gap-3 p-3.5 rounded-xl border h-full transition cursor-pointer {ownershipStatus ===
													status
														? 'border-red-600 bg-red-50/50 text-red-950 font-semibold ring-1 ring-red-600 shadow-sm'
														: 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}"
												>
													<input
														type="radio"
														bind:group={ownershipStatus}
														value={status}
														class="size-4 text-red-700 accent-red-700 shrink-0"
													/>
													<span class="text-xs sm:text-sm leading-snug"
														>{ownershipStatusMap[status] || status}</span
													>
												</label>
											{/each}
										</div>
									</div>

									{#if ownershipStatus === "company_car"}
										<div class="sm:col-span-2">
											<div
												class="p-4 sm:p-5 rounded-xl border transition {sphError
													? 'border-red-300 bg-red-50/40'
													: sphFile
														? 'border-emerald-300 bg-emerald-50/30'
														: 'border-amber-200 bg-amber-50/40'}"
											>
												<div
													class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3"
												>
													<div>
														<div class="flex items-center gap-2">
															<span class="font-bold text-gray-900 text-sm">
																Surat Pelepasan Hak (SPH)
															</span>
															<span
																class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700"
															>
																Wajib untuk Mobil PT/Instansi
															</span>
														</div>
														<p class="text-xs text-gray-500 mt-1">
															Harap lampirkan dokumen resmi SPH dari instansi/perusahaan pemilik
															kendaraan.
														</p>
													</div>
													{#if sphFile}
														<span
															class="text-emerald-700 text-xs font-bold flex items-center gap-1 shrink-0"
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																class="size-4"
																viewBox="0 0 20 20"
																fill="currentColor"
															>
																<path
																	fill-rule="evenodd"
																	d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
																	clip-rule="evenodd"
																/>
															</svg>
															Terlampir
														</span>
													{/if}
												</div>

												{#if sphFile}
													<div
														class="flex items-center justify-between p-3 bg-white border border-emerald-200 rounded-lg shadow-sm"
													>
														<div class="flex items-center gap-3 min-w-0">
															<div
																class="size-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs uppercase"
															>
																{sphFile.name.split(".").pop() || "DOC"}
															</div>
															<div class="min-w-0">
																<p
																	class="text-sm font-medium text-gray-900 truncate max-w-xs sm:max-w-md"
																>
																	{sphFile.name}
																</p>
																<p class="text-xs text-gray-500">
																	{formatFileSize(sphFile.size)}
																</p>
															</div>
														</div>
														<button
															type="button"
															onclick={removeSphFile}
															class="text-xs font-semibold text-red-600 hover:text-red-700 px-2.5 py-1.5 rounded-md hover:bg-red-50 transition shrink-0 ml-2"
														>
															Ganti Dokumen
														</button>
													</div>
												{:else}
													<label
														class="flex flex-col items-center justify-center border-2 border-dashed {sphError
															? 'border-red-400 bg-red-50/40'
															: 'border-gray-300 hover:border-red-400 bg-white'} rounded-xl p-5 cursor-pointer transition text-center group"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="size-8 text-gray-400 group-hover:text-red-600 transition mb-2"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
															/>
														</svg>
														<span
															class="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-red-700"
														>
															Pilih berkas SPH atau seret ke sini
														</span>
														<span class="text-xs text-gray-400 mt-1">
															Format: PDF, DOC, atau DOCX (Maksimal 4 MB)
														</span>
														<input
															type="file"
															accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
															onchange={handleSphSelect}
															class="hidden"
														/>
													</label>
												{/if}

												{#if sphError}
													<p
														class="mt-2 text-xs text-red-600 font-medium flex items-center gap-1.5"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="size-4 shrink-0"
															viewBox="0 0 20 20"
															fill="currentColor"
														>
															<path
																fill-rule="evenodd"
																d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
																clip-rule="evenodd"
															/>
														</svg>
														{sphError}
													</p>
												{/if}
											</div>
										</div>
									{/if}

									<div>
										<span class="block text-sm font-semibold text-gray-700 mb-2">
											{tradeInCaptions.form.stnkStatus}
										</span>
										<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
											<label
												class="flex items-center gap-3 p-3 rounded-xl border h-full transition cursor-pointer {stnkStatus ===
												'active'
													? 'border-red-600 bg-red-50/50 text-red-950 font-semibold ring-1 ring-red-600 shadow-sm'
													: 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}"
											>
												<input
													type="radio"
													bind:group={stnkStatus}
													value="active"
													class="size-4 text-red-700 accent-red-700 shrink-0"
												/>
												<span class="text-xs sm:text-sm">{tradeInCaptions.form.stnkActive}</span>
											</label>
											<label
												class="flex items-center gap-3 p-3 rounded-xl border h-full transition cursor-pointer {stnkStatus ===
												'expired'
													? 'border-red-600 bg-red-50/50 text-red-950 font-semibold ring-1 ring-red-600 shadow-sm'
													: 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}"
											>
												<input
													type="radio"
													bind:group={stnkStatus}
													value="expired"
													class="size-4 text-red-700 accent-red-700 shrink-0"
												/>
												<span class="text-xs sm:text-sm">{tradeInCaptions.form.stnkExpired}</span>
											</label>
										</div>
									</div>

									<div>
										<label
											for="stnkTaxExpiry"
											class="block text-sm font-semibold text-gray-700 mb-2"
										>
											{tradeInCaptions.form.stnkTaxExpiry}
										</label>
										<input
											type="text"
											id="stnkTaxExpiry"
											bind:value={stnkTaxExpiry}
											placeholder={tradeInCaptions.form.stnkTaxExpiryPlaceholder}
											class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition bg-white text-sm"
										/>
									</div>
								</div>

								<div class="mt-6 pt-5 border-t border-gray-200">
									<span class="block text-sm font-semibold text-gray-700 mb-3">
										{tradeInCaptions.form.equipmentChecklist}
									</span>
									<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
										<label
											class="flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer {hasFaktur
												? 'border-red-600 bg-red-50/50 text-red-950 font-semibold ring-1 ring-red-600 shadow-sm'
												: 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}"
										>
											<input
												type="checkbox"
												bind:checked={hasFaktur}
												class="size-4 rounded text-red-700 accent-red-700 shrink-0"
											/>
											<span class="text-xs sm:text-sm">{tradeInCaptions.form.hasFaktur}</span>
										</label>
										<label
											class="flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer {hasServiceBook
												? 'border-red-600 bg-red-50/50 text-red-950 font-semibold ring-1 ring-red-600 shadow-sm'
												: 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}"
										>
											<input
												type="checkbox"
												bind:checked={hasServiceBook}
												class="size-4 rounded text-red-700 accent-red-700 shrink-0"
											/>
											<span class="text-xs sm:text-sm">{tradeInCaptions.form.hasServiceBook}</span>
										</label>
										<label
											class="flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer {hasSpareKey
												? 'border-red-600 bg-red-50/50 text-red-950 font-semibold ring-1 ring-red-600 shadow-sm'
												: 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}"
										>
											<input
												type="checkbox"
												bind:checked={hasSpareKey}
												class="size-4 rounded text-red-700 accent-red-700 shrink-0"
											/>
											<span class="text-xs sm:text-sm">{tradeInCaptions.form.hasSpareKey}</span>
										</label>
									</div>
								</div>

								<div class="mt-5">
									<label for="adminNotes" class="block text-sm font-semibold text-gray-700 mb-1">
										{tradeInCaptions.form.adminNotes}
									</label>
									<input
										type="text"
										id="adminNotes"
										bind:value={adminNotes}
										placeholder={tradeInCaptions.form.adminNotesPlaceholder}
										class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition bg-white text-sm"
									/>
								</div>
							</div>

							<!-- Kondisi Fisik & Riwayat -->
							<div class="p-5 sm:p-6 bg-gray-50 rounded-xl border border-gray-200">
								<h4 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="w-5 h-5 text-red-700"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
											clip-rule="evenodd"
										/>
									</svg>
									Riwayat & Kondisi Kendaraan
								</h4>

								<!-- Simple Checkboxes for Bebas Banjir & Bebas Lakalantas -->
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
									<label
										class="flex items-start gap-3 p-4 rounded-xl border transition cursor-pointer {isFloodFree
											? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 font-semibold ring-1 ring-emerald-600 shadow-sm'
											: 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}"
									>
										<input
											type="checkbox"
											bind:checked={isFloodFree}
											class="size-4 mt-0.5 rounded text-emerald-700 accent-emerald-700 shrink-0"
										/>
										<div>
											<span class="text-sm font-bold block text-gray-900"
												>{tradeInCaptions.form.floodFree}</span
											>
											<span class="text-xs text-gray-500 block mt-0.5 leading-relaxed"
												>{tradeInCaptions.form.floodFreeDesc}</span
											>
										</div>
									</label>

									<label
										class="flex items-start gap-3 p-4 rounded-xl border transition cursor-pointer {isAccidentFree
											? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 font-semibold ring-1 ring-emerald-600 shadow-sm'
											: 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}"
									>
										<input
											type="checkbox"
											bind:checked={isAccidentFree}
											class="size-4 mt-0.5 rounded text-emerald-700 accent-emerald-700 shrink-0"
										/>
										<div>
											<span class="text-sm font-bold block text-gray-900"
												>{tradeInCaptions.form.accidentFree}</span
											>
											<span class="text-xs text-gray-500 block mt-0.5 leading-relaxed"
												>{tradeInCaptions.form.accidentFreeDesc}</span
											>
										</div>
									</label>
								</div>

								<div>
									<label
										for="conditionNotes"
										class="block text-sm font-semibold text-gray-700 mb-1"
									>
										{tradeInCaptions.form.conditionNotes}
									</label>
									<textarea
										id="conditionNotes"
										bind:value={conditionNotes}
										rows="3"
										placeholder={tradeInCaptions.form.conditionNotesPlaceholder}
										class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition bg-white text-sm"
									></textarea>
								</div>
							</div>
						</div>

						<div class="mt-8 flex justify-between">
							<button
								type="button"
								onclick={() => goToStep(1)}
								class="px-6 py-3 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition"
							>
								{tradeInCaptions.form.back}
							</button>

							<button
								type="button"
								onclick={() => goToStep(3)}
								class="px-8 py-3 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-800 transition flex items-center gap-2"
							>
								<span>{tradeInCaptions.form.next}</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="w-4 h-4"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						</div>
					</div>

					<!-- STEP 3: 10 Guided Photo Slots -->
				{:else if currentStep === 3}
					<div>
						<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
							<h3 class="text-xl font-bold text-gray-900">
								{tradeInCaptions.form.photoSectionTitle}
							</h3>
							<div
								class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold {completedSlotsCount >=
								10
									? 'bg-green-100 text-green-800'
									: 'bg-amber-100 text-amber-800'}"
							>
								{completedSlotsCount} / {slots.length} Foto Wajib Terisi
							</div>
						</div>
						<p class="text-gray-500 text-sm mb-6">
							{tradeInCaptions.form.photoSectionDesc}
						</p>

						<!-- 10 Guided Photo Slots Grid -->
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
							{#each slots as slot, idx (slot.id)}
								<div
									class="p-4 rounded-xl border {photoMap[slot.id]
										? 'border-green-300 bg-green-50/20'
										: 'border-gray-200 bg-gray-50'} flex flex-col justify-between"
								>
									<div class="flex items-start justify-between gap-2 mb-3">
										<div>
											<span
												class="inline-block text-xs font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-800 mr-1.5"
											>
												Slot {idx + 1}
											</span>
											<span class="font-bold text-gray-900 text-sm">{slot.label}</span>
											<p class="text-xs text-gray-500 mt-0.5">{slot.desc}</p>
										</div>
										{#if photoMap[slot.id]}
											<span class="text-green-600 text-xs font-bold flex items-center gap-1">
												✓ Terisi
											</span>
										{:else}
											<span class="text-red-600 text-xs font-semibold">Wajib</span>
										{/if}
									</div>

									{#if photoMap[slot.id]}
										<!-- Photo Preview Thumbnail -->
										<div
											class="relative rounded-lg overflow-hidden border border-gray-200 bg-black/5 aspect-video mb-3 flex items-center justify-center"
										>
											<img
												src={photoMap[slot.id].previewUrl}
												alt={slot.label}
												class="w-full h-full object-cover"
											/>
											<button
												type="button"
												onclick={() => removeSlotFile(slot.id)}
												class="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 shadow hover:bg-red-700 transition"
												title="Hapus foto"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="w-4 h-4"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path
														fill-rule="evenodd"
														d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
														clip-rule="evenodd"
													/>
												</svg>
											</button>
										</div>
									{:else}
										<!-- Mobile (< 640px): Dual Action Buttons (Camera & Gallery) -->
										<div
											class="sm:hidden border-2 border-dashed border-gray-300 hover:border-red-300 rounded-xl p-3 bg-white transition text-center flex flex-col items-center justify-center gap-2"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="size-5 text-gray-400"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="1.8"
													d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
												/>
											</svg>
											<div class="flex items-center gap-1.5 w-full justify-center">
												<!-- Camera Trigger -->
												<label
													class="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-700 font-semibold text-xs transition cursor-pointer shadow-sm group"
													title="Buka kamera perangkat untuk mengambil foto langsung"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="size-4 shrink-0 text-red-600 group-hover:scale-110 transition-transform"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
														/>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
														/>
													</svg>
													<span class="truncate">{tradeInCaptions.form.takePhoto}</span>
													<input
														type="file"
														accept="image/*"
														capture="environment"
														class="hidden"
														onchange={(e) => handleSlotFileSelect(slot.id, e)}
													/>
												</label>
												<!-- Gallery Trigger -->
												<label
													class="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs transition cursor-pointer shadow-sm group"
													title="Pilih foto dari galeri perangkat"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="size-4 shrink-0 text-gray-500 group-hover:text-gray-700"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
														/>
													</svg>
													<span class="truncate">{tradeInCaptions.form.chooseGallery}</span>
													<input
														type="file"
														accept="image/*"
														class="hidden"
														onchange={(e) => handleSlotFileSelect(slot.id, e)}
													/>
												</label>
											</div>
											<span class="text-[10px] text-gray-400">JPG, PNG, WEBP</span>
										</div>

										<!-- Laptop/Desktop (>= 640px): Classic Unified Full Dropzone -->
										<label
											class="hidden sm:flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-red-400 rounded-xl p-4 cursor-pointer bg-white hover:bg-red-50/20 transition text-center group"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="size-8 text-gray-400 group-hover:text-red-600 transition mb-1.5"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="1.8"
													d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
												/>
											</svg>
											<span class="text-xs font-semibold text-gray-700 group-hover:text-red-700"
												>Pilih Foto atau seret ke sini</span
											>
											<span class="text-[11px] text-gray-400 mt-0.5"
												>JPG, PNG, WEBP (Maksimal 15 MB)</span
											>
											<input
												type="file"
												accept="image/*"
												class="hidden"
												onchange={(e) => handleSlotFileSelect(slot.id, e)}
											/>
										</label>
									{/if}
								</div>
							{/each}
						</div>

						<!-- Optional Extra Photos -->
						<div class="mt-8 pt-6 border-t border-gray-200">
							<h4 class="font-bold text-gray-900 text-sm mb-1">Foto Tambahan (Opsional)</h4>
							<p class="text-xs text-gray-500 mb-4">
								Unggah foto tambahan seperti ban, velg, atau bagian bodi tertentu jika diperlukan.
							</p>

							<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
								{#each extraPhotos as extra (extra.id)}
									<div
										class="relative rounded-lg overflow-hidden border border-gray-200 aspect-square"
									>
										<img
											src={extra.previewUrl}
											alt="Foto Tambahan"
											class="w-full h-full object-cover"
										/>
										<button
											type="button"
											onclick={() => removeExtraPhoto(extra.id)}
											class="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="w-3.5 h-3.5"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fill-rule="evenodd"
													d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
													clip-rule="evenodd"
												/>
											</svg>
										</button>
									</div>
								{/each}

								<!-- Mobile (< 640px): Dual Action Buttons -->
								<div class="col-span-2 sm:hidden flex items-center gap-2">
									<label
										class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs transition cursor-pointer border border-red-200/80 shadow-sm"
										title="Ambil foto tambahan langsung dengan kamera"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="size-4 shrink-0 text-red-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
											/>
										</svg>
										<span class="truncate">{tradeInCaptions.form.takePhoto}</span>
										<input
											type="file"
											accept="image/*"
											capture="environment"
											class="hidden"
											onchange={handleExtraFileSelect}
										/>
									</label>

									<label
										class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs transition cursor-pointer shadow-sm"
										title="Pilih foto tambahan dari galeri"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="size-4 shrink-0 text-gray-500"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
											/>
										</svg>
										<span class="truncate">{tradeInCaptions.form.chooseGallery}</span>
										<input
											type="file"
											accept="image/*"
											multiple
											class="hidden"
											onchange={handleExtraFileSelect}
										/>
									</label>
								</div>

								<!-- Laptop/Desktop (>= 640px): Classic Square Dropzone Tile -->
								<label
									class="hidden sm:flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-red-400 rounded-lg p-4 cursor-pointer bg-white hover:bg-red-50/20 transition text-center aspect-square group"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="w-6 h-6 text-gray-400 group-hover:text-red-600 mb-1 transition"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4v16m8-8H4"
										/>
									</svg>
									<span class="text-xs font-semibold text-gray-600 group-hover:text-red-700"
										>Tambah Foto</span
									>
									<input
										type="file"
										accept="image/*"
										multiple
										class="hidden"
										onchange={handleExtraFileSelect}
									/>
								</label>
							</div>
						</div>

						<div class="mt-8 flex justify-between">
							<button
								type="button"
								onclick={() => goToStep(2)}
								class="px-6 py-3 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition"
							>
								{tradeInCaptions.form.back}
							</button>

							<button
								type="button"
								onclick={() => goToStep(4)}
								disabled={!isStep3Valid}
								class="px-8 py-3 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
							>
								<span>{tradeInCaptions.form.next}</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="w-4 h-4"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						</div>
					</div>

					<!-- STEP 4: Contact Info & Review -->
				{:else if currentStep === 4}
					<div>
						<h3 class="text-xl font-bold text-gray-900 mb-2">{tradeInCaptions.steps.step4}</h3>
						<p class="text-gray-500 text-sm mb-6">
							Isi kontak Anda agar tim appraisal kami dapat menghubungi Anda dengan penawaran harga
							terbaik.
						</p>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
							<div>
								<label for="customerName" class="block text-sm font-semibold text-gray-700 mb-1">
									{tradeInCaptions.form.customerName} <span class="text-red-600">*</span>
								</label>
								<input
									type="text"
									id="customerName"
									bind:value={customerName}
									placeholder={tradeInCaptions.form.customerNamePlaceholder}
									class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
									required
								/>
							</div>

							<div>
								<label for="customerPhone" class="block text-sm font-semibold text-gray-700 mb-1">
									{tradeInCaptions.form.customerPhone} <span class="text-red-600">*</span>
								</label>
								<input
									type="tel"
									id="customerPhone"
									bind:value={customerPhone}
									placeholder={tradeInCaptions.form.customerPhonePlaceholder}
									class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
									required
								/>
							</div>

							<div>
								<label for="customerCity" class="block text-sm font-semibold text-gray-700 mb-1">
									{tradeInCaptions.form.customerCity} <span class="text-red-600">*</span>
								</label>
								<input
									type="text"
									id="customerCity"
									bind:value={customerCity}
									placeholder={tradeInCaptions.form.customerCityPlaceholder}
									class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
									required
								/>
							</div>

							<div>
								<label for="customerEmail" class="block text-sm font-semibold text-gray-700 mb-1">
									{tradeInCaptions.form.customerEmail}
								</label>
								<input
									type="email"
									id="customerEmail"
									bind:value={customerEmail}
									placeholder={tradeInCaptions.form.customerEmailPlaceholder}
									class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
								/>
							</div>
						</div>

						<!-- Review Summary Box -->
						<div class="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-8">
							<h4 class="font-bold text-gray-900 mb-3 text-sm flex items-center justify-between">
								<span>Ringkasan Pengajuan Kendaraan</span>
								<span class="text-xs text-gray-500 font-normal">Pastikan data sudah tepat</span>
							</h4>

							<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
								<div class="bg-white p-3 rounded-lg border border-gray-100">
									<span class="text-gray-400 block">Unit Mobil</span>
									<span class="font-bold text-gray-900 text-sm">{year} {make} {model}</span>
								</div>
								<div class="bg-white p-3 rounded-lg border border-gray-100">
									<span class="text-gray-400 block">Jarak Tempuh</span>
									<span class="font-bold text-gray-900 text-sm"
										>{mileage?.toLocaleString("id-ID")} KM</span
									>
								</div>
								<div class="bg-white p-3 rounded-lg border border-gray-100">
									<span class="text-gray-400 block">Ekspektasi Harga</span>
									<span class="font-bold text-red-700 text-sm">{formatRupiah(sellingPrice)}</span>
								</div>
								<div class="bg-white p-3 rounded-lg border border-gray-100">
									<span class="text-gray-400 block">Jumlah Foto</span>
									<span class="font-bold text-green-700 text-sm"
										>{completedSlotsCount + extraPhotos.length} Foto</span
									>
								</div>
							</div>
						</div>

						<div class="flex flex-col sm:flex-row items-center justify-between gap-4">
							<button
								type="button"
								onclick={() => goToStep(3)}
								disabled={isSubmitting}
								class="w-full sm:w-auto px-6 py-3 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition"
							>
								{tradeInCaptions.form.back}
							</button>

							<button
								type="button"
								onclick={handleSubmit}
								disabled={!isStep4Valid || isSubmitting}
								class="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-red-700 text-white font-bold hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md flex items-center justify-center gap-2"
							>
								{#if isSubmitting}
									<svg
										class="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									<span>{submitProgressText}</span>
								{:else}
									<span>{tradeInCaptions.form.submit}</span>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="w-5 h-5"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
											clip-rule="evenodd"
										/>
									</svg>
								{/if}
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Submission & Adaptive Compression Progress Overlay -->
	{#if isSubmitting}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
			role="dialog"
			aria-modal="true"
		>
			<div
				class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center animate-in fade-in duration-200"
			>
				<div
					class="size-16 rounded-2xl bg-red-50 flex items-center justify-center mb-5 text-red-700 shadow-inner"
				>
					<svg
						class="animate-spin size-8"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				</div>

				<h3 class="text-lg font-bold text-gray-900 mb-1">
					{submitPhaseTitle || tradeInCaptions.form.submitting}
				</h3>
				<p class="text-xs text-gray-500 mb-6 max-w-xs leading-relaxed">
					{submitProgressText}
				</p>

				<!-- Progress Bar -->
				<div
					class="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-2 p-0.5 border border-gray-200"
				>
					<div
						class="bg-gradient-to-r from-red-600 to-red-700 h-full rounded-full transition-all duration-300 ease-out"
						style="width: {submitProgressPercent}%"
					></div>
				</div>
				<div class="w-full flex justify-between text-xs font-semibold text-gray-500 mb-5 px-1">
					<span>Status Proses</span>
					<span class="text-red-700 font-bold">{submitProgressPercent}%</span>
				</div>

				<div
					class="bg-gray-50 border border-gray-200/80 rounded-xl p-3.5 text-xs text-gray-500 flex items-center gap-2.5 text-left"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="size-5 shrink-0 text-amber-500"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
							clip-rule="evenodd"
						/>
					</svg>
					<span class="leading-normal">{tradeInCaptions.form.progressWarning}</span>
				</div>
			</div>
		</div>
	{/if}
</div>
