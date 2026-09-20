<script lang="ts">
	import { navigate } from "astro:transitions/client";
	import {
		ownershipStatuses,
		ownershipStatusMap,
		validatePlateNumber,
		formatPlateNumber,
	} from "@harka/db";
	import { compressCarImages } from "~/utils/imageCompression";

	export let car: any = null;

	let isLoading = false;
	let statusMessage = "";
	let errorMessage = "";
	let successMessage = "";

	let popup = {
		show: false,
		title: "",
		message: "",
		type: "success",
	};

	const showPopup = (
		title: string,
		message: string,
		type: "success" | "error",
		action: string = "updated",
	) => {
		if (type === "success") {
			navigate(`/cars?toast=${action}`);
		} else {
			popup = { show: true, title, message, type };
			setTimeout(() => {
				popup.show = false;
			}, 4000);
		}
	};

	// Direct Flat Bindings
	let title = car?.title || "";
	let excerpt = car?.excerpt || "";
	let relatedUrl = car?.relatedUrl || (car as any)?.videoTourUrl || "";

	let make = car?.make || "";
	let model = car?.model || "";
	let price = car?.price || 0;
	let year = car?.year || new Date().getFullYear();
	let mileage = car?.mileage ?? 0;
	let bodyType = car?.bodyType || "SUV";
	let fuelType = car?.fuelType || "Petrol";
	let transmission = car?.transmission || "Automatic";
	let color = car?.color || "";

	let horsePower = car?.horsePower ?? null;
	let engineSizeCC = car?.engineSizeCC ?? null;

	let ownershipStatus = car?.ownershipStatus || "first_hand";
	let plateNumber = car?.plateNumber || "";
	let plateError = "";

	function handlePlateBlur() {
		const trimmed = plateNumber.trim();
		if (!trimmed) {
			plateError = "";
			plateNumber = "";
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
		if (plateError && (!plateNumber.trim() || validatePlateNumber(plateNumber.trim()))) {
			plateError = "";
		}
	}
	let isFloodFree = car?.isFloodFree ?? false;
	let isAccidentFree = car?.isAccidentFree ?? false;

	const existingTaxDate = car?.taxExpirationDate ? new Date(car.taxExpirationDate) : null;
	let taxMonth = existingTaxDate ? (existingTaxDate.getMonth() + 1).toString() : "";
	let taxYear = existingTaxDate ? existingTaxDate.getFullYear().toString() : "";

	let seatingCapacity = car?.seatingCapacity ?? null;

	const months = [
		{ value: "1", label: "Januari" },
		{ value: "2", label: "Februari" },
		{ value: "3", label: "Maret" },
		{ value: "4", label: "April" },
		{ value: "5", label: "Mei" },
		{ value: "6", label: "Juni" },
		{ value: "7", label: "Juli" },
		{ value: "8", label: "Agustus" },
		{ value: "9", label: "September" },
		{ value: "10", label: "Oktober" },
		{ value: "11", label: "November" },
		{ value: "12", label: "Desember" },
	];

	const currentYear = new Date().getFullYear();
	const years = Array.from({ length: 15 }, (_, i) => currentYear - 5 + i);

	let hidden = car?.hidden ?? false;

	// Gallery State
	type GalleryItem = { id: string; url?: string; file?: File; alt: string; preview: string };
	let galleryItems: GalleryItem[] = (car?.gallery || []).map((g: any, i: number) => ({
		id: `existing-${i}`,
		url: g.image,
		alt: g.alt,
		preview: g.image,
	}));

	$: isFormValid =
		make.trim() !== "" &&
		model.trim() !== "" &&
		price > 0 &&
		year > 0 &&
		mileage >= 0 &&
		mileage !== "";

	const handleFileSelect = (e: Event) => {
		const target = e.target as HTMLInputElement;
		if (target.files) {
			const newFiles = Array.from(target.files);
			const newItems = newFiles.map((file) => ({
				id: `new-${Math.random().toString(36).substring(2, 9)}`,
				file,
				alt: "",
				preview: URL.createObjectURL(file),
			}));
			galleryItems = [...galleryItems, ...newItems];
		}
		target.value = "";
	};

	const removeGalleryItem = (index: number) => {
		const item = galleryItems[index];
		if (item.file) URL.revokeObjectURL(item.preview);
		galleryItems = galleryItems.filter((_, i) => i !== index);
	};

	const moveItem = (index: number, dir: number) => {
		if (index + dir < 0 || index + dir >= galleryItems.length) return;
		const items = [...galleryItems];
		const temp = items[index];
		items[index] = items[index + dir];
		items[index + dir] = temp;
		galleryItems = items;
	};

	const submitForm = async () => {
		const finalTitle = title.trim() || `${make} ${model} ${year}`;
		isLoading = true;
		statusMessage = "";
		errorMessage = "";
		successMessage = "";

		try {
			// Step 1: Upload new images if any
			const newFiles = galleryItems.filter((item) => item.file).map((item) => item.file as File);
			let uploadedUrls: string[] = [];

			if (newFiles.length > 0) {
				statusMessage = `Mengompresi foto (0/${newFiles.length})...`;
				const { compressed, totalBytes } = await compressCarImages(newFiles, (current, total) => {
					statusMessage = `Mengompresi foto (${current}/${total})...`;
				});

				const mbFormatted = (totalBytes / (1024 * 1024)).toFixed(1);
				statusMessage = `Mengunggah ${compressed.length} foto (${mbFormatted} MB)...`;

				const uploadFormData = new FormData();
				compressed.forEach((f) => uploadFormData.append("file", f));

				const uploadRes = await fetch("/api/images/upload", {
					method: "POST",
					body: uploadFormData,
				});
				const uploadData = (await uploadRes.json()) as any;
				if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal mengunggah foto");
				uploadedUrls = uploadData.urls;
			}

			// Step 2: Construct final gallery
			let newFileIndex = 0;
			const finalGallery = galleryItems.map((item) => {
				if (item.file) {
					const url = uploadedUrls[newFileIndex++];
					return { image: url, alt: item.alt };
				}
				return { image: item.url as string, alt: item.alt };
			});

			// Tax Expiration Date calculation
			let taxExpirationDate: string | null = null;
			if (taxMonth && taxYear) {
				taxExpirationDate = new Date(Number(taxYear), Number(taxMonth) - 1, 1).toISOString();
			}

			statusMessage = "Menyimpan data mobil...";

			// Step 3: Submit flattened payload
			const payload = {
				title: finalTitle,
				excerpt,
				relatedUrl,
				make,
				model,
				price,
				year,
				mileage,
				bodyType,
				fuelType,
				transmission,
				color,
				horsePower,
				engineSizeCC,
				ownershipStatus,
				plateNumber: (() => {
					const trimmed = plateNumber.trim();
					if (trimmed && !validatePlateNumber(trimmed)) {
						plateError = "Format plat nomor tidak valid (mis. B 1234 ABC)";
						throw new Error("Format plat nomor tidak valid (mis. B 1234 ABC)");
					}
					return trimmed ? formatPlateNumber(trimmed) : null;
				})(),
				isFloodFree,
				isAccidentFree,
				taxExpirationDate,
				seatingCapacity,
				gallery: finalGallery,
				hidden,
			};

			const url = car?.id ? `/api/cars/${car.id}` : "/api/cars";
			const method = car?.id ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data = (await response.json()) as any;
			if (!response.ok) throw new Error(data.error || "Gagal menyimpan kendaraan");

			const action = car?.id ? "updated" : "created";
			successMessage = `Kendaraan berhasil ${action === "created" ? "ditambahkan" : "diperbarui"}!`;
			showPopup("Berhasil!", successMessage, "success", action);
		} catch (err: any) {
			errorMessage = err.message;
			showPopup("Error", err.message, "error");
			isLoading = false;
			statusMessage = "";
		}
	};
</script>

<div class="max-w-4xl mx-auto mb-16 space-y-8">
	<!-- Top Header Card -->
	<div
		class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
	>
		<div>
			<h2 class="text-2xl font-bold text-gray-900">
				{car?.id ? "Ubah Data Mobil" : "Tambah Mobil Baru"}
			</h2>
			<p class="text-sm text-gray-500 mt-1">
				{#if car?.id}
					ID Referensi: <span class="font-mono font-bold text-gray-700">{car.id}</span>
				{:else}
					Lengkapi data spesifikasi, kelengkapan surat, dan galeri foto unit inventaris.
				{/if}
			</p>
		</div>
		<div class="flex items-center gap-2">
			{#if hidden}
				<div
					class="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200"
				>
					Sembunyi (Draf)
				</div>
			{:else}
				<div
					class="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200"
				>
					Publik (Live)
				</div>
			{/if}
		</div>
	</div>

	{#if errorMessage}
		<div
			class="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 shrink-0 text-red-600"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
					clip-rule="evenodd"
				/>
			</svg>
			<span class="font-medium text-sm">{errorMessage}</span>
		</div>
	{/if}

	<form on:submit|preventDefault={submitForm} class="space-y-8">
		<!-- 1. Informasi Umum & Identitas -->
		<div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
			<h3
				class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2.5 pb-3 border-b border-gray-100"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-5 h-5 text-red-700"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
						clip-rule="evenodd"
					/>
				</svg>
				Informasi Umum & Identitas Unit
			</h3>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div class="col-span-1 md:col-span-2">
					<label class="block text-sm font-semibold text-gray-700 mb-1.5">Nama</label>
					<input
						type="text"
						bind:value={title}
						class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
						placeholder="mis. Porsche 911 Carrera S"
					/>
				</div>
				<div class="col-span-1 md:col-span-2">
					<label class="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi Singkat</label>
					<textarea
						rows="3"
						bind:value={excerpt}
						class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
						placeholder="Ringkasan spesifikasi, kondisi istimewa, atau catatan unit..."></textarea>
				</div>
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-1.5"
						>Merek <span class="text-red-600">*</span></label
					>
					<input
						type="text"
						bind:value={make}
						required
						class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
						placeholder="mis. Porsche"
					/>
				</div>
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-1.5"
						>Model <span class="text-red-600">*</span></label
					>
					<input
						type="text"
						bind:value={model}
						required
						class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
						placeholder="mis. 911 Carrera"
					/>
				</div>
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-1.5"
						>Harga (Rp) <span class="text-red-600">*</span></label
					>
					<input
						type="number"
						bind:value={price}
						required
						min="1"
						class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
					/>
				</div>
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-1.5">Tipe Body</label>
					<select
						bind:value={bodyType}
						class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
					>
						<option value="SUV">SUV</option>
						<option value="Sedan">Sedan</option>
						<option value="Hatchback">Hatchback</option>
						<option value="Coupe">Coupe</option>
						<option value="Convertible">Convertible</option>
						<option value="Pickup">Pickup</option>
						<option value="MPV">MPV</option>
					</select>
				</div>

				<div class="col-span-1 md:col-span-2 pt-4 border-t border-gray-100">
					<label
						class="flex items-center gap-3.5 p-4 rounded-xl border transition cursor-pointer {hidden
							? 'border-amber-500 bg-amber-50/60 text-amber-950 font-semibold ring-1 ring-amber-500 shadow-sm'
							: 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}"
					>
						<input
							type="checkbox"
							bind:checked={hidden}
							class="size-4 rounded accent-amber-600 text-amber-600 shrink-0"
						/>
						<div>
							<span class="text-sm font-bold block text-gray-900">Sembunyikan dari Publik</span>
							<span class="text-xs text-gray-500 block mt-0.5"
								>Status draf internal, tidak tampil di katalog publik</span
							>
						</div>
					</label>
				</div>
			</div>
		</div>

		<!-- 2. Performa & Spesifikasi Mesin -->
		<div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
			<h3
				class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2.5 pb-3 border-b border-gray-100"
			>
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
				Performa & Spesifikasi Mesin
			</h3>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-1.5"
						>Tahun Model <span class="text-red-600">*</span></label
					>
					<input
						type="number"
						bind:value={year}
						required
						class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
					/>
				</div>
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-1.5"
						>Jarak Tempuh (km) <span class="text-red-600">*</span></label
					>
					<input
						type="number"
						bind:value={mileage}
						required
						class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
					/>
				</div>
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-1.5">Tenaga (PS)</label>
					<input
						type="number"
						bind:value={horsePower}
						class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
						placeholder="mis. 385"
					/>
				</div>
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-1.5"
						>Kapasitas Mesin (cc)</label
					>
					<input
						type="number"
						bind:value={engineSizeCC}
						class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
						placeholder="mis. 2981"
					/>
				</div>
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-1.5">Transmisi</label>
					<select
						bind:value={transmission}
						class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
					>
						<option value="Automatic">Matic</option>
						<option value="Manual">Manual</option>
						<option value="Dual-Clutch">Dual-Clutch</option>
						<option value="CVT">CVT</option>
					</select>
				</div>
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-1.5">Bahan Bakar</label>
					<select
						bind:value={fuelType}
						class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
					>
						<option value="Petrol">Bensin</option>
						<option value="Diesel">Solar</option>
						<option value="Hybrid">Hybrid</option>
						<option value="Electric">Listrik</option>
					</select>
				</div>
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-1.5">Warna Eksterior</label>
					<input
						type="text"
						bind:value={color}
						class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
						placeholder="mis. Hitam Metalik"
					/>
				</div>
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-1.5">Kapasitas Penumpang</label
					>
					<input
						type="number"
						bind:value={seatingCapacity}
						class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
						placeholder="mis. 5 atau 7"
					/>
				</div>
			</div>
		</div>

		<!-- 3. Status Kepemilikan & Legalitas -->
		<div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
			<h3
				class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2.5 pb-3 border-b border-gray-100"
			>
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
				Status Kepemilikan, Legalitas & Kondisi Fisik
			</h3>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-1.5"
						>Status Kepemilikan <span class="text-red-600">*</span></label
					>
					<select
						bind:value={ownershipStatus}
						class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
					>
						{#each ownershipStatuses as status}
							<option value={status}>{ownershipStatusMap[status] || status}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-1.5"> Nomor Polisi </label>
					<input
						type="text"
						bind:value={plateNumber}
						on:blur={handlePlateBlur}
						on:input={handlePlateInput}
						class="w-full px-4 py-2.5 border {plateError
							? 'border-red-500 ring-1 ring-red-500'
							: 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition uppercase"
						placeholder="mis. B 1234 ABC"
					/>
					{#if plateError}
						<p class="mt-1.5 text-xs text-red-600 font-medium">{plateError}</p>
					{/if}
				</div>
				<div class="col-span-1 md:col-span-2">
					<label class="block text-sm font-semibold text-gray-700 mb-1.5">
						Masa Berlaku Pajak (Status Pajak STNK)
						<span class="text-xs font-normal text-gray-500"
							>(Kosongkan jika belum diketahui / '-')</span
						>
					</label>
					<div class="grid grid-cols-2 gap-4">
						<select
							bind:value={taxMonth}
							class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
						>
							<option value="">- Pilih Bulan (-) -</option>
							{#each months as m}
								<option value={m.value}>{m.label}</option>
							{/each}
						</select>
						<select
							bind:value={taxYear}
							class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
						>
							<option value="">- Pilih Tahun (-) -</option>
							{#each years as y}
								<option value={y.toString()}>{y}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="col-span-1 md:col-span-2 pt-4 border-t border-gray-100">
					<span class="block text-sm font-semibold text-gray-700 mb-3">
						Sertifikasi & Kondisi Khusus Kendaraan
					</span>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<!-- 1. Kondisi Banjir (First) -->
						<label
							class="flex items-start gap-3.5 p-4 rounded-xl border transition cursor-pointer {isFloodFree
								? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-semibold ring-1 ring-emerald-600 shadow-sm'
								: 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}"
						>
							<input
								type="checkbox"
								bind:checked={isFloodFree}
								class="size-4 mt-0.5 rounded text-emerald-700 accent-emerald-700 shrink-0"
							/>
							<div>
								<span class="text-sm font-bold block text-gray-900">Bukan Bekas Banjir</span>
								<span class="text-xs text-gray-500 block mt-0.5 leading-relaxed">
									{isFloodFree
										? "Unit terverifikasi aman dan tidak memiliki riwayat terendam banjir"
										: "Centang jika unit terverifikasi aman dan bebas dari riwayat terendam banjir"}
								</span>
							</div>
						</label>

						<!-- 2. Kondisi Lakalantas (Second) -->
						<label
							class="flex items-start gap-3.5 p-4 rounded-xl border transition cursor-pointer {isAccidentFree
								? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-semibold ring-1 ring-emerald-600 shadow-sm'
								: 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}"
						>
							<input
								type="checkbox"
								bind:checked={isAccidentFree}
								class="size-4 mt-0.5 rounded text-emerald-700 accent-emerald-700 shrink-0"
							/>
							<div>
								<span class="text-sm font-bold block text-gray-900">Bebas Lakalantas</span>
								<span class="text-xs text-gray-500 block mt-0.5 leading-relaxed">
									{isAccidentFree
										? "Struktur rangka dan bodi unit utuh, bebas dari insiden tabrakan besar"
										: "Centang jika rangka dan bodi unit bebas dari riwayat tabrakan atau insiden besar"}
								</span>
							</div>
						</label>
					</div>
				</div>
			</div>
		</div>

		<!-- 4. Galeri Foto & Media -->
		<div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
			<h3
				class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2.5 pb-3 border-b border-gray-100"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-5 h-5 text-red-700"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
						clip-rule="evenodd"
					/>
				</svg>
				Galeri Foto & Media
			</h3>

			<div class="space-y-6">
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{#each galleryItems as item, idx (item.id)}
						<div
							class="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex flex-col group relative shadow-xs transition hover:shadow-sm"
						>
							{#if idx === 0}
								<div
									class="absolute top-2 left-2 bg-red-700 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-md z-10 shadow-xs"
								>
									Cover
								</div>
							{/if}
							<div class="relative h-36 bg-gray-100 flex-shrink-0">
								<img src={item.preview} alt="" class="w-full h-full object-cover" />

								<div
									class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 backdrop-blur-xs"
								>
									<button
										type="button"
										class="bg-white/95 p-2 rounded-lg hover:bg-white text-gray-800 disabled:opacity-40 transition shadow-sm"
										on:click={() => moveItem(idx, -1)}
										disabled={idx === 0}
										title="Pindah ke kiri"
									>
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 19l-7-7 7-7"
											/>
										</svg>
									</button>
									<button
										type="button"
										class="bg-red-600/95 p-2 rounded-lg hover:bg-red-700 text-white transition shadow-sm"
										on:click={() => removeGalleryItem(idx)}
										title="Hapus foto"
									>
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
									<button
										type="button"
										class="bg-white/95 p-2 rounded-lg hover:bg-white text-gray-800 disabled:opacity-40 transition shadow-sm"
										on:click={() => moveItem(idx, 1)}
										disabled={idx === galleryItems.length - 1}
										title="Pindah ke kanan"
									>
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 5l7 7-7 7"
											/>
										</svg>
									</button>
								</div>
							</div>
							<div class="p-2.5 border-t border-gray-200 bg-white">
								<input
									type="text"
									bind:value={item.alt}
									placeholder="Alt text (opsional)"
									class="w-full text-xs px-2 py-1.5 border border-transparent hover:border-gray-300 focus:border-red-600 outline-none rounded-lg bg-transparent focus:bg-white transition"
								/>
							</div>
						</div>
					{/each}

					<!-- Upload Button -->
					<div
						class="border-2 border-dashed border-gray-300 hover:border-red-600 hover:bg-red-50/20 rounded-xl h-full min-h-[170px] flex flex-col items-center justify-center text-center transition cursor-pointer relative group bg-gray-50/70 p-4"
					>
						<input
							type="file"
							accept="image/*"
							multiple
							on:change={handleFileSelect}
							class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
						/>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-8 w-8 mx-auto mb-2 text-gray-400 group-hover:text-red-700 transition"
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
						<span class="text-sm font-bold text-gray-700 group-hover:text-red-700 transition">
							Tambah Foto
						</span>
						<span class="text-[11px] text-gray-400 mt-0.5">JPG, PNG, atau WebP</span>
					</div>
				</div>

				<div class="pt-4 border-t border-gray-100">
					<label class="block text-sm font-semibold text-gray-700 mb-1.5"
						>Tautan Terkait (Instagram / Media Sosial)</label
					>
					<input
						type="url"
						bind:value={relatedUrl}
						class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-sm transition"
						placeholder="https://www.instagram.com/p/... atau tautan lainnya"
					/>
					<p class="text-xs text-gray-500 mt-1.5">
						Tautan postingan, video reel, atau ulasan unit ini di media sosial
					</p>
				</div>
			</div>
		</div>

		<!-- 5. Actions Footer Bar -->
		<div
			class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
		>
			<div class="text-xs sm:text-sm text-gray-500">
				{#if isLoading && statusMessage}
					<span class="text-red-700 font-semibold flex items-center gap-1.5 animate-pulse">
						<svg
							class="animate-spin w-4 h-4 text-red-700"
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
						{statusMessage}
					</span>
				{:else if !isFormValid}
					<span class="text-amber-700 font-medium flex items-center gap-1.5">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="w-4 h-4"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
						Mohon lengkapi merek, model, tahun, harga, dan jarak tempuh.
					</span>
				{:else if galleryItems.length === 0}
					<span class="text-amber-700 font-medium flex items-center gap-1.5">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="w-4 h-4"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
						Harap unggah minimal 1 foto kendaraan sebagai foto cover.
					</span>
				{:else}
					<span class="text-green-700 font-medium flex items-center gap-1.5">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="w-4 h-4"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						Semua data wajib dan {galleryItems.length} foto siap disimpan.
					</span>
				{/if}
			</div>

			<div class="flex items-center gap-3 w-full sm:w-auto">
				<a
					href="/cars"
					class="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition text-sm text-center flex-1 sm:flex-initial"
				>
					Batal
				</a>
				<button
					type="submit"
					disabled={isLoading || !isFormValid || galleryItems.length === 0}
					class="bg-red-700 hover:bg-red-800 text-white px-7 py-2.5 rounded-xl font-bold text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-1 sm:flex-initial"
				>
					{#if isLoading}
						<svg
							class="animate-spin h-4 w-4 text-white"
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
						<span>{statusMessage || "Menyimpan..."}</span>
					{:else}
						<span>{car?.id ? "Simpan Perubahan" : "Simpan Kendaraan"}</span>
					{/if}
				</button>
			</div>
		</div>
	</form>
</div>

{#if popup.show}
	<div
		class="fixed top-20 right-4 md:right-8 z-50 animate-fade-in max-w-sm w-full shadow-xl rounded-lg border-l-4 p-4 {popup.type ===
		'success'
			? 'bg-white border-green-500'
			: 'bg-white border-red-500'}"
	>
		<div class="flex items-start gap-3">
			<div class="flex-1">
				<h4 class="font-bold text-gray-900">{popup.title}</h4>
				<p class="text-sm text-gray-600 mt-1">{popup.message}</p>
			</div>
			<button
				class="ml-auto text-gray-400 hover:text-gray-600"
				on:click={() => (popup.show = false)}>✕</button
			>
		</div>
	</div>
{/if}

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-fade-in {
		animation: fadeIn 0.4s ease-out forwards;
	}
</style>
