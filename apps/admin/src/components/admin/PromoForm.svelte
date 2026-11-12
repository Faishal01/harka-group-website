<script lang="ts">
	import { navigate } from "astro:transitions/client";
	import {
		bodyTypes,
		transmissions,
		type Promo,
		type Car,
		type BodyType,
		type Transmission,
		type PromoMode,
	} from "@harka/db";
	import { compressCarImages } from "~/utils/imageCompression";
	import ImageCropModal, { type CropResultData } from "./ImageCropModal.svelte";
	import CarPickerModal from "./CarPickerModal.svelte";
	import CustomDropdown, { type DropdownOption } from "./CustomDropdown.svelte";

	interface Props {
		promo?: Partial<Promo> | null;
		cars?: Car[];
		availableMakes?: string[];
	}

	let { promo = null, cars = [], availableMakes = [] }: Props = $props();

	let isLoading = $state(false);
	let errorMessage = $state("");
	let successMessage = $state("");

	// Core form fields
	let title = $state(promo?.title || "");
	let slug = $state(promo?.slug || "");
	let isCustomSlug = $state(Boolean(promo?.slug));
	let description = $state(promo?.description || "");
	let mode = $state<PromoMode>(promo?.mode || "filter");
	let isActive = $state(promo?.isActive ?? true);
	let order = $state(promo?.order ?? 0);
	let startDate = $state(
		promo?.startDate ? new Date(promo.startDate).toISOString().slice(0, 16) : "",
	);
	let endDate = $state(promo?.endDate ? new Date(promo.endDate).toISOString().slice(0, 16) : "");

	// Filter Mode fields
	let filterMake = $state(promo?.filterParams?.make || "");
	let filterBodyType = $state<BodyType | "">(promo?.filterParams?.bodyType || "");
	let filterTransmission = $state<Transmission | "">(promo?.filterParams?.transmission || "");
	let filterMaxPrice = $state<number | null>(promo?.filterParams?.maxPrice ?? null);
	let filterMinYear = $state<number | null>(promo?.filterParams?.minYear ?? null);
	let filterMaxMileage = $state<number | null>(promo?.filterParams?.maxMileage ?? null);

	// Custom Mode fields
	let customCarIds = $state<string[]>(promo?.customCarIds || []);
	let isCarPickerOpen = $state(false);

	// Banner image state
	let bannerDisplayUrl = $state<string>(promo?.bannerImage || "");
	let bannerOriginalUrl = $state<string | null>(promo?.bannerOriginalImage || null);
	let bannerCropData = $state<CropResultData | null>(
		(promo?.bannerCropData as CropResultData) || null,
	);
	let bannerFile = $state<File | null>(null);
	let bannerOriginalFile = $state<File | null>(null);

	// Cropper modal state
	let isCropperOpen = $state(false);
	let cropperImageSrc = $state<string | null>(null);

	function slugify(text: string): string {
		return text
			.toString()
			.toLowerCase()
			.trim()
			.replace(/\s+/g, "-")
			.replace(/&/g, "-and-")
			.replace(/[^\w-]+/g, "")
			.replace(/--+/g, "-")
			.replace(/^-+/, "")
			.replace(/-+$/, "");
	}

	function handleTitleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		title = target.value;
		if (!isCustomSlug) {
			slug = slugify(title);
		}
	}

	function handleSlugInput(e: Event) {
		const target = e.target as HTMLInputElement;
		slug = target.value;
		isCustomSlug = true;
	}

	function formatRupiah(val: number | null | undefined): string {
		if (typeof val !== "number" || isNaN(val) || val <= 0) return "";
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);
	}

	const isFormValid = $derived(
		title.trim() !== "" &&
			(bannerDisplayUrl !== "" || bannerFile !== null) &&
			(mode === "filter" || customCarIds.length > 0),
	);

	const selectedCarsList = $derived(
		customCarIds
			.map((id) => cars.find((c) => c.id === id))
			.filter((c): c is Car => c !== undefined),
	);

	const transmissionMap: Record<string, string> = {
		Automatic: "Matic",
		Manual: "Manual",
		CVT: "CVT",
		"Dual-Clutch": "Dual-Clutch",
	};

	const makeOptions = $derived<DropdownOption[]>([
		{ value: "", label: "Semua Merek" },
		...availableMakes.map((m) => ({ value: m, label: m })),
	]);

	const bodyTypeOptions = $derived<DropdownOption[]>([
		{ value: "", label: "Semua Tipe Body" },
		...bodyTypes.map((b) => ({ value: b, label: b })),
	]);

	const transmissionOptions = $derived<DropdownOption[]>([
		{ value: "", label: "Semua Transmisi" },
		...transmissions.map((t) => ({ value: t, label: transmissionMap[t] || t })),
	]);

	const scheduleStatus = $derived.by(() => {
		const now = new Date();
		const start = startDate ? new Date(startDate) : null;
		const end = endDate ? new Date(endDate) : null;

		if (end && end < now) {
			return {
				type: "expired",
				label: "Periode Telah Berakhir",
				desc: "Jadwal promo telah lewat. Promo otomatis tidak akan tayang di beranda.",
				badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
			};
		}
		if (start && start > now) {
			return {
				type: "scheduled",
				label: "Terjadwal (Akan Datang)",
				desc: `Promo dijadwalkan otomatis mulai tayang pada ${start.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}.`,
				badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
			};
		}
		if (start || end) {
			return {
				type: "active-period",
				label: "Sedang Berlangsung",
				desc: end
					? `Promo aktif dan akan berakhir pada ${end.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}.`
					: "Promo telah mulai tayang dan berlangsung seterusnya.",
				badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
			};
		}
		return {
			type: "forever",
			label: "Tanpa Batas Waktu",
			desc: "Promo akan terus tayang selama status publikasi aktif.",
			badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
		};
	});

	// File selection
	function handleBannerSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const files = target.files;
		if (!files || files.length === 0) return;

		const file = files[0];
		bannerOriginalFile = file;
		cropperImageSrc = URL.createObjectURL(file);
		isCropperOpen = true;
		target.value = "";
	}

	function handleReCrop() {
		if (bannerOriginalFile) {
			cropperImageSrc = URL.createObjectURL(bannerOriginalFile);
			isCropperOpen = true;
		} else if (bannerOriginalUrl) {
			cropperImageSrc = bannerOriginalUrl;
			isCropperOpen = true;
		} else if (bannerDisplayUrl) {
			cropperImageSrc = bannerDisplayUrl;
			isCropperOpen = true;
		}
	}

	function handleApplyCrop(croppedBlob: Blob, croppedUrl: string, cropData: CropResultData) {
		const file = new File([croppedBlob], `promo-banner-${Date.now()}.webp`, {
			type: "image/webp",
		});
		bannerFile = file;
		bannerDisplayUrl = croppedUrl;
		bannerCropData = cropData;
		isCropperOpen = false;
	}

	function handleCancelCrop() {
		isCropperOpen = false;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!isFormValid || isLoading) return;

		isLoading = true;
		errorMessage = "";
		successMessage = "";

		try {
			let uploadedDisplayUrl = bannerDisplayUrl;
			let uploadedOriginalUrl = bannerOriginalUrl;

			// Upload new banner if selected/cropped
			if (bannerFile) {
				const uploadQueue: { file: File; role: "display" | "original" }[] = [
					{ file: bannerFile, role: "display" },
				];
				if (bannerOriginalFile) {
					uploadQueue.push({ file: bannerOriginalFile, role: "original" });
				}

				const { compressed } = await compressCarImages(uploadQueue.map((q) => q.file));
				const formData = new FormData();
				compressed.forEach((f) => formData.append("file", f));

				const res = await fetch("/api/images/upload", {
					method: "POST",
					body: formData,
				});

				const uploadData = (await res.json()) as { error?: string; urls?: string[] };
				if (!res.ok || !uploadData.urls) {
					throw new Error(uploadData.error || "Gagal mengunggah banner");
				}

				uploadedDisplayUrl = uploadData.urls[0];
				if (uploadQueue.length > 1) {
					uploadedOriginalUrl = uploadData.urls[1];
				}
			}

			const payload = {
				title: title.trim(),
				slug: slug.trim() ? slugify(slug) : slugify(title),
				description: description.trim() || null,
				bannerImage: uploadedDisplayUrl,
				bannerOriginalImage: uploadedOriginalUrl || null,
				bannerCropData,
				mode,
				filterParams:
					mode === "filter"
						? {
								make: filterMake.trim() || null,
								bodyType: filterBodyType || null,
								transmission: filterTransmission || null,
								maxPrice: filterMaxPrice || null,
								minYear: filterMinYear || null,
								maxMileage: filterMaxMileage || null,
							}
						: null,
				customCarIds: mode === "custom" ? customCarIds : null,
				isActive,
				startDate: startDate ? new Date(startDate).toISOString() : null,
				endDate: endDate ? new Date(endDate).toISOString() : null,
				order: Number(order) || 0,
			};

			const endpoint = promo?.id ? `/api/promos/${promo.id}` : "/api/promos";
			const method = promo?.id ? "PUT" : "POST";

			const apiRes = await fetch(endpoint, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const result = (await apiRes.json()) as { error?: string; redirect?: string };
			if (!apiRes.ok) {
				throw new Error(result.error || "Gagal menyimpan kampanye promo");
			}

			successMessage = "Promo berhasil disimpan! Mengalihkan...";
			setTimeout(() => {
				navigate(result.redirect || "/promos");
			}, 700);
		} catch (err: unknown) {
			console.error("Promo submission error:", err);
			errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan internal";
		} finally {
			isLoading = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-8">
	{#if errorMessage}
		<div class="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
			{errorMessage}
		</div>
	{/if}

	{#if successMessage}
		<div class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl">
			{successMessage}
		</div>
	{/if}

	<!-- Section 1: Informasi Utama -->
	<div class="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
		<h2 class="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
			Informasi Utama Promo
		</h2>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div>
				<label class="block text-sm font-semibold text-gray-700 mb-1.5"
					>Judul Promo <span class="text-red-500">*</span></label
				>
				<input
					type="text"
					bind:value={title}
					oninput={handleTitleInput}
					placeholder="Contoh: Promo Lebaran Berkah 2026"
					required
					class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm outline-none transition"
				/>
			</div>

			<div>
				<label class="block text-sm font-semibold text-gray-700 mb-1.5"
					>Slug URL <span class="text-xs font-normal text-gray-400">(otomatis dari judul)</span
					></label
				>
				<div class="flex items-center">
					<span
						class="inline-flex items-center px-3 py-2.5 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs font-mono"
					>
						/promo/
					</span>
					<input
						type="text"
						bind:value={slug}
						oninput={handleSlugInput}
						placeholder="promo-lebaran-berkah"
						class="w-full px-4 py-2.5 border border-gray-300 rounded-r-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm outline-none transition font-mono"
					/>
				</div>
			</div>
		</div>

		<div>
			<label class="block text-sm font-semibold text-gray-700 mb-1.5"
				>Deskripsi / Syarat & Ketentuan <span class="text-xs font-normal text-gray-400"
					>(Opsional)</span
				></label
			>
			<textarea
				bind:value={description}
				rows="3"
				placeholder="Jelaskan detail keuntungan promo, masa berlaku, atau syarat khusus..."
				class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm outline-none transition"
			></textarea>
		</div>
	</div>

	<!-- Section 2: Banner Gambar (2.5:1 Strip) -->
	<div class="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
		<div class="flex items-center justify-between border-b border-gray-100 pb-3">
			<div>
				<h2 class="text-lg font-bold text-gray-900">Gambar Banner Promo</h2>
				<p class="text-xs text-gray-500 mt-0.5">
					Format rasio tetap 2.5:1 (Ultra-wide strip) yang tampil di beranda dan halaman kampanye.
				</p>
			</div>
			{#if bannerDisplayUrl}
				<button
					type="button"
					onclick={handleReCrop}
					class="px-3.5 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition inline-flex items-center gap-1.5"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="size-3.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
						/>
					</svg>
					Atur Potongan (Crop)
				</button>
			{/if}
		</div>

		{#if bannerDisplayUrl}
			<div
				class="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm aspect-[2.5/1] bg-gray-900 group"
			>
				<img src={bannerDisplayUrl} alt="Banner Preview" class="size-full object-cover" />
				<div
					class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3"
				>
					<button
						type="button"
						onclick={handleReCrop}
						class="px-4 py-2 bg-white text-gray-900 font-bold text-xs rounded-xl shadow-md hover:bg-gray-100 transition"
					>
						Ubah Potongan
					</button>
					<label
						class="px-4 py-2 bg-red-700 text-white font-bold text-xs rounded-xl shadow-md hover:bg-red-800 transition cursor-pointer"
					>
						Ganti Gambar
						<input type="file" accept="image/*" onchange={handleBannerSelect} class="hidden" />
					</label>
				</div>
			</div>
		{:else}
			<label
				class="border-2 border-dashed border-gray-300 hover:border-red-500 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition bg-gray-50/50 hover:bg-red-50/20"
			>
				<div class="p-3 bg-red-50 text-red-600 rounded-xl mb-3">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="size-8"
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
				</div>
				<span class="text-sm font-bold text-gray-800">Klik untuk mengunggah banner promo</span>
				<span class="text-xs text-gray-500 mt-1"
					>Rekomendasi rasio 2.5:1 (misal 1000×400px atau lebih tinggi)</span
				>
				<input type="file" accept="image/*" onchange={handleBannerSelect} class="hidden" />
			</label>
		{/if}
	</div>

	<!-- Section 3: Mode Promo & Pemilihan Unit -->
	<div class="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
		<h2 class="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Mode Kampanye</h2>

		<!-- Mode Switcher -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<label
				class="relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition {mode ===
				'filter'
					? 'border-red-600 bg-red-50/40 ring-1 ring-red-600'
					: 'border-gray-200 hover:border-gray-300 bg-white'}"
			>
				<div class="flex items-center justify-between mb-1">
					<span class="font-bold text-sm text-gray-900">Mode Filter (Otomatis)</span>
					<input
						type="radio"
						name="promo-mode"
						value="filter"
						checked={mode === "filter"}
						onchange={() => (mode = "filter")}
						class="text-red-600 focus:ring-red-500"
					/>
				</div>
				<p class="text-xs text-gray-500">
					Unit mobil akan otomatis terfilter sesuai kriteria (merek, tipe body, batas harga, tahun,
					dll).
				</p>
			</label>

			<label
				class="relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition {mode ===
				'custom'
					? 'border-red-600 bg-red-50/40 ring-1 ring-red-600'
					: 'border-gray-200 hover:border-gray-300 bg-white'}"
			>
				<div class="flex items-center justify-between mb-1">
					<span class="font-bold text-sm text-gray-900">Mode Kustom (Pilih Unit)</span>
					<input
						type="radio"
						name="promo-mode"
						value="custom"
						checked={mode === "custom"}
						onchange={() => (mode = "custom")}
						class="text-red-600 focus:ring-red-500"
					/>
				</div>
				<p class="text-xs text-gray-500">
					Admin memilih dan mengurutkan secara spesifik unit mobil mana saja yang masuk ke promo
					ini.
				</p>
			</label>
		</div>

		<!-- Filter Mode Form -->
		{#if mode === "filter"}
			<div class="pt-4 border-t border-gray-100 space-y-4">
				<p class="text-xs text-gray-500">
					Kosongkan opsi yang tidak ingin dibatasi (misal kosongkan merek untuk mencakup semua
					merek).
				</p>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div>
						<CustomDropdown
							label="Merek"
							options={makeOptions}
							value={filterMake}
							onChange={(val) => (filterMake = String(val))}
							placeholder="Semua Merek"
						/>
					</div>

					<div>
						<CustomDropdown
							label="Tipe Body"
							options={bodyTypeOptions}
							value={filterBodyType}
							onChange={(val) => (filterBodyType = val as BodyType | "")}
							placeholder="Semua Tipe Body"
						/>
					</div>

					<div>
						<CustomDropdown
							label="Transmisi"
							options={transmissionOptions}
							value={filterTransmission}
							onChange={(val) => (filterTransmission = val as Transmission | "")}
							placeholder="Semua Transmisi"
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div>
						<label class="block text-xs font-semibold text-gray-700 mb-1">Harga Maksimal (Rp)</label
						>
						<input
							type="number"
							bind:value={filterMaxPrice}
							min="0"
							placeholder="Semua Harga"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-600"
						/>
						{#if filterMaxPrice && filterMaxPrice > 0}
							<span class="text-[11px] text-gray-400 mt-0.5 block"
								>{formatRupiah(filterMaxPrice)}</span
							>
						{/if}
					</div>

					<div>
						<label class="block text-xs font-semibold text-gray-700 mb-1">Tahun Minimal</label>
						<input
							type="number"
							bind:value={filterMinYear}
							min="1990"
							max="2030"
							placeholder="Semua Tahun"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-600"
						/>
					</div>

					<div>
						<label class="block text-xs font-semibold text-gray-700 mb-1">Kilometer Maksimal</label>
						<input
							type="number"
							bind:value={filterMaxMileage}
							min="0"
							placeholder="Semua Jarak Tempuh"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-600"
						/>
					</div>
				</div>
			</div>
		{:else}
			<!-- Custom Mode Section -->
			<div class="pt-4 border-t border-gray-100 space-y-4">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-sm font-bold text-gray-900">Daftar Mobil Terpilih</h3>
						<p class="text-xs text-gray-500 mt-0.5">
							{customCarIds.length} mobil dimasukkan ke promo ini.
						</p>
					</div>
					<button
						type="button"
						onclick={() => (isCarPickerOpen = true)}
						class="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="size-4"
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
						Pilih Mobil
					</button>
				</div>

				{#if selectedCarsList.length === 0}
					<div
						class="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 bg-gray-50/50"
					>
						<p class="text-sm">Belum ada mobil yang dipilih.</p>
						<button
							type="button"
							onclick={() => (isCarPickerOpen = true)}
							class="mt-2 text-xs text-red-600 font-semibold hover:underline"
						>
							Klik di sini untuk memilih mobil &rarr;
						</button>
					</div>
				{:else}
					<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
						{#each selectedCarsList as car (car.id)}
							<div
								class="p-2.5 rounded-xl border border-gray-200 bg-white flex items-center gap-3 shadow-xs"
							>
								<div
									class="size-11 shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
								>
									{#if car.gallery?.[0]?.image}
										<img
											src={car.gallery[0].image}
											alt={car.title}
											class="size-full object-cover"
										/>
									{:else}
										<div
											class="size-full flex items-center justify-center text-gray-400 text-[10px]"
										>
											No Img
										</div>
									{/if}
								</div>
								<div class="min-w-0 grow">
									<h4 class="text-xs font-bold text-gray-900 truncate">{car.title}</h4>
									<div class="text-[11px] text-gray-500">{formatRupiah(car.price)}</div>
								</div>
								<button
									type="button"
									onclick={() => (customCarIds = customCarIds.filter((id) => id !== car.id))}
									class="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
									title="Hapus"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="size-4"
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
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Section 4: Pengaturan & Jadwal -->
	<div class="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
		<div
			class="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
		>
			<div>
				<h2 class="text-lg font-bold text-gray-900">Status Publikasi & Jadwal</h2>
				<p class="text-xs text-gray-500 mt-0.5">
					Atur ketersediaan promo di etalase beranda dan masa aktif kampanye.
				</p>
			</div>
			<!-- Schedule status badge -->
			<div
				class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border {scheduleStatus.badgeClass}"
			>
				<span
					class="size-1.5 rounded-full {scheduleStatus.type === 'expired'
						? 'bg-amber-500'
						: scheduleStatus.type === 'scheduled'
							? 'bg-blue-500'
							: scheduleStatus.type === 'active-period'
								? 'bg-emerald-500 animate-pulse'
								: 'bg-gray-400'}"
				></span>
				{scheduleStatus.label}
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Box A: Status Publikasi & Prioritas Urutan -->
			<div class="space-y-4 p-5 rounded-2xl bg-gray-50/60 border border-gray-200/80">
				<div>
					<label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
						Status Publikasi
					</label>
					<button
						type="button"
						onclick={() => (isActive = !isActive)}
						class="w-full flex items-center justify-between p-3.5 rounded-xl border transition text-left cursor-pointer {isActive
							? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200'
							: 'bg-white border-gray-300 hover:border-gray-400'}"
					>
						<div class="flex items-center gap-3">
							<div
								class="size-3.5 rounded-full {isActive
									? 'bg-emerald-500 shadow-xs shadow-emerald-400'
									: 'bg-gray-300'}"
							></div>
							<div>
								<div class="text-sm font-bold {isActive ? 'text-emerald-950' : 'text-gray-700'}">
									{isActive ? "Aktif (Tayang di Beranda)" : "Nonaktif (Draft / Sembunyikan)"}
								</div>
								<div class="text-xs {isActive ? 'text-emerald-700' : 'text-gray-500'} mt-0.5">
									{isActive
										? "Promo dapat diakses publik & muncul di carousel"
										: "Promo disembunyikan dari etalase publik"}
								</div>
							</div>
						</div>
						<div
							class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out {isActive
								? 'bg-emerald-600'
								: 'bg-gray-300'}"
						>
							<span
								class="pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out {isActive
									? 'translate-x-5'
									: 'translate-x-0'}"
							></span>
						</div>
					</button>
				</div>

				<div class="pt-3 border-t border-gray-200/60">
					<label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
						Prioritas Urutan Carousel
					</label>
					<div class="flex items-center gap-3">
						<input
							type="number"
							bind:value={order}
							min="0"
							class="w-24 px-3.5 py-2 border border-gray-300 rounded-xl bg-white text-sm font-bold text-gray-900 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none text-center shadow-xs"
						/>
						<span class="text-xs text-gray-500">
							Urutan tampil di slider beranda. Angka lebih kecil (misal 0, 1) tampil di slide awal.
						</span>
					</div>
				</div>
			</div>

			<!-- Box B: Masa Berlaku (Jadwal) -->
			<div class="space-y-4 p-5 rounded-2xl bg-gray-50/60 border border-gray-200/80">
				<div>
					<label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
						Jadwal Tayang (Opsional)
					</label>
					<div class="space-y-3">
						<div>
							<div class="flex items-center justify-between mb-1">
								<span class="text-xs font-semibold text-gray-700">Mulai Berlaku</span>
								{#if startDate}
									<button
										type="button"
										onclick={() => (startDate = "")}
										class="text-[11px] text-gray-400 hover:text-red-600 cursor-pointer"
									>
										Hapus Batas Mulai
									</button>
								{/if}
							</div>
							<input
								type="datetime-local"
								bind:value={startDate}
								class="w-full px-3.5 py-2 border border-gray-300 rounded-xl bg-white text-xs font-medium focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition shadow-xs text-gray-800"
							/>
						</div>

						<div>
							<div class="flex items-center justify-between mb-1">
								<span class="text-xs font-semibold text-gray-700">Berakhir Pada</span>
								{#if endDate}
									<button
										type="button"
										onclick={() => (endDate = "")}
										class="text-[11px] text-gray-400 hover:text-red-600 cursor-pointer"
									>
										Hapus Batas Akhir
									</button>
								{/if}
							</div>
							<input
								type="datetime-local"
								bind:value={endDate}
								class="w-full px-3.5 py-2 border border-gray-300 rounded-xl bg-white text-xs font-medium focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition shadow-xs text-gray-800"
							/>
						</div>
					</div>
				</div>

				<div class="p-3 bg-white/80 rounded-xl border border-gray-200/60 text-xs text-gray-600">
					{scheduleStatus.desc}
				</div>
			</div>
		</div>
	</div>

	<!-- Submit actions -->
	<div class="flex items-center justify-end gap-3 pt-4">
		<a
			href="/promos"
			class="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition text-sm"
		>
			Batal
		</a>
		<button
			type="submit"
			disabled={!isFormValid || isLoading}
			class="px-8 py-3 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition text-sm flex items-center gap-2"
		>
			{#if isLoading}
				<svg class="animate-spin size-4 text-white" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				Menyimpan...
			{:else}
				{promo?.id ? "Perbarui Promo" : "Terbitkan Promo"}
			{/if}
		</button>
	</div>
</form>

<!-- Modal Cropper (2.5:1 Ultra-wide) -->
<ImageCropModal
	isOpen={isCropperOpen}
	imageSrc={cropperImageSrc}
	initialAspectRatio={2.5 / 1}
	initialCropData={bannerCropData}
	onApply={handleApplyCrop}
	onCancel={handleCancelCrop}
/>

<!-- Modal Car Picker for Custom Mode -->
<CarPickerModal
	isOpen={isCarPickerOpen}
	selectedCarIds={customCarIds}
	{cars}
	onSave={(ids) => (customCarIds = ids)}
	onClose={() => (isCarPickerOpen = false)}
/>
