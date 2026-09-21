<script lang="ts">
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
	let submitError = $state("");
	let isSubmitted = $state(false);
	let submissionId = $state("");

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

	const isStep2Valid = $derived(validatePlateNumber(plateNumber.trim()));

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
				if (!isStep2Valid) return;
			}
			if (currentStep === 3 && !isStep3Valid) return;
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
		submitProgressText = "Menyiapkan foto kendaraan...";

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
			submitProgressText = "Mengompres foto secara adaptif (< 5 MB)...";
			const { compressed, totalBytes } = await compressImagesBatch(photoItems);

			submitProgressText = `Mengunggah data & ${(totalBytes / 1024 / 1024).toFixed(2)} MB foto...`;

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
										<!-- Upload Trigger Dropzone -->
										<label
											class="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-red-400 rounded-lg p-4 cursor-pointer bg-white transition text-center"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="w-8 h-8 text-gray-400 mb-1"
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
											<span class="text-xs font-semibold text-gray-700">Pilih Foto</span>
											<span class="text-[11px] text-gray-400">JPG, PNG, WEBP</span>
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

								<label
									class="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-red-400 rounded-lg p-4 cursor-pointer bg-white transition text-center aspect-square"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="w-6 h-6 text-gray-400 mb-1"
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
									<span class="text-xs font-semibold text-gray-600">Tambah Foto</span>
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
</div>
