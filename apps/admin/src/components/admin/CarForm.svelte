<script lang="ts">
	import { navigate } from "astro:transitions/client";
	import { ownershipStatuses, ownershipStatusMap } from "@harka/db";

	export let car: any = null;

	let isLoading = false;
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
	let videoTourUrl = car?.videoTourUrl || "";

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
	let hasFloodDamage = car?.hasFloodDamage ?? false;
	let hasAccidentDamage = car?.hasAccidentDamage ?? false;

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
	let featured = car?.featured ?? false;

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
		errorMessage = "";
		successMessage = "";

		try {
			// Step 1: Upload new images if any
			const newFiles = galleryItems.filter((item) => item.file).map((item) => item.file as File);
			let uploadedUrls: string[] = [];

			if (newFiles.length > 0) {
				const uploadFormData = new FormData();
				newFiles.forEach((f) => uploadFormData.append("file", f));

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

			// Step 3: Submit flattened payload
			const payload = {
				title: finalTitle,
				excerpt,
				videoTourUrl,
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
				plateNumber: plateNumber.trim() || null,
				hasFloodDamage,
				hasAccidentDamage,
				taxExpirationDate,
				seatingCapacity,
				gallery: finalGallery,
				hidden,
				featured,
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
		}
	};
</script>

<div
	class="max-w-4xl mx-auto bg-white text-gray-900 rounded-xl shadow-md overflow-hidden border border-gray-200 mb-12"
>
	<!-- Header -->
	<div
		class="bg-gray-50 p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
	>
		<div>
			<h2 class="text-xl font-bold text-gray-900">
				{car?.id ? "Edit Kendaraan" : "Tambah Kendaraan Baru"}
			</h2>
			{#if car?.id}
				<p class="text-gray-500 text-sm mt-1 font-mono">ID: {car.id}</p>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			{#if hidden}
				<div
					class="px-3 py-1 rounded text-xs font-bold uppercase tracking-widest bg-yellow-100 text-yellow-800 border border-yellow-200"
				>
					Sembunyi (Draf)
				</div>
			{:else}
				<div
					class="px-3 py-1 rounded text-xs font-bold uppercase tracking-widest bg-green-100 text-green-800 border border-green-200"
				>
					Publik (Live)
				</div>
			{/if}
			{#if featured}
				<div
					class="px-3 py-1 rounded text-xs font-bold uppercase tracking-widest bg-blue-100 text-blue-800 border border-blue-200"
				>
					Unggulan
				</div>
			{/if}
		</div>
	</div>

	<div class="p-8">
		{#if errorMessage}
			<div
				class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
						clip-rule="evenodd"
					/>
				</svg>
				<span class="font-medium">{errorMessage}</span>
			</div>
		{/if}

		<form on:submit|preventDefault={submitForm} class="space-y-12">
			<!-- Informasi Umum -->
			<div>
				<h3 class="text-lg font-semibold mb-6 text-gray-900 flex items-center border-b pb-2">
					<span class="bg-blue-600 w-1.5 h-5 mr-3 block rounded"></span> Informasi Umum
				</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="col-span-1 md:col-span-2">
						<label class="block text-sm font-medium text-gray-700 mb-1">Judul Tampilan</label>
						<input
							type="text"
							bind:value={title}
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white"
							placeholder="mis. Porsche 911 Carrera S"
						/>
					</div>
					<div class="col-span-1 md:col-span-2">
						<label class="block text-sm font-medium text-gray-700 mb-1"
							>Kutipan / Deskripsi Singkat</label
						>
						<textarea
							rows="3"
							bind:value={excerpt}
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white"
							placeholder="Ringkasan spesifikasi, kondisi istimewa, atau catatan unit..."
						></textarea>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Merek *</label>
						<input
							type="text"
							bind:value={make}
							required
							class="w-full p-2 border border-gray-300 rounded bg-white"
							placeholder="mis. Porsche"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Model *</label>
						<input
							type="text"
							bind:value={model}
							required
							class="w-full p-2 border border-gray-300 rounded bg-white"
							placeholder="mis. 911 Carrera"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Harga (Rp) *</label>
						<input
							type="number"
							bind:value={price}
							required
							min="1"
							class="w-full p-2 border border-gray-300 rounded bg-white"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Tipe Body</label>
						<select
							bind:value={bodyType}
							class="w-full p-2 border border-gray-300 rounded bg-white"
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
					<div class="col-span-1 md:col-span-2 pt-4 border-t border-gray-200 mt-2 flex gap-8">
						<label class="flex items-center gap-3 cursor-pointer w-fit">
							<input
								type="checkbox"
								bind:checked={hidden}
								class="w-5 h-5 text-blue-600 border-gray-300 rounded"
							/>
							<span class="text-sm font-medium text-gray-900">Sembunyikan (Status Draf)</span>
						</label>
						<label class="flex items-center gap-3 cursor-pointer w-fit">
							<input
								type="checkbox"
								bind:checked={featured}
								class="w-5 h-5 text-blue-600 border-gray-300 rounded"
							/>
							<span class="text-sm font-medium text-gray-900">Jadikan Unit Unggulan</span>
						</label>
					</div>
				</div>
			</div>

			<!-- Performa & Riwayat Mesin -->
			<div>
				<h3 class="text-lg font-semibold mb-6 text-gray-900 flex items-center border-b pb-2">
					<span class="bg-blue-600 w-1.5 h-5 mr-3 block rounded"></span> Performa & Spesifikasi Mesin
				</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Tahun Model *</label>
						<input
							type="number"
							bind:value={year}
							required
							class="w-full p-2 border border-gray-300 rounded bg-white"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Jarak Tempuh (km) *</label>
						<input
							type="number"
							bind:value={mileage}
							required
							class="w-full p-2 border border-gray-300 rounded bg-white"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Tenaga (PS)</label>
						<input
							type="number"
							bind:value={horsePower}
							class="w-full p-2 border border-gray-300 rounded bg-white"
							placeholder="mis. 385"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Kapasitas Mesin (cc)</label>
						<input
							type="number"
							bind:value={engineSizeCC}
							class="w-full p-2 border border-gray-300 rounded bg-white"
							placeholder="mis. 2981"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Transmisi</label>
						<select
							bind:value={transmission}
							class="w-full p-2 border border-gray-300 rounded bg-white"
						>
							<option value="Automatic">Matic</option>
							<option value="Manual">Manual</option>
							<option value="Dual-Clutch">Dual-Clutch</option>
							<option value="CVT">CVT</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Bahan Bakar</label>
						<select
							bind:value={fuelType}
							class="w-full p-2 border border-gray-300 rounded bg-white"
						>
							<option value="Petrol">Bensin</option>
							<option value="Diesel">Solar</option>
							<option value="Hybrid">Hybrid</option>
							<option value="Electric">Listrik</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Warna Eksterior</label>
						<input
							type="text"
							bind:value={color}
							class="w-full p-2 border border-gray-300 rounded bg-white"
							placeholder="mis. Hitam Metalik"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Kapasitas Penumpang</label>
						<input
							type="number"
							bind:value={seatingCapacity}
							class="w-full p-2 border border-gray-300 rounded bg-white"
							placeholder="mis. 5 atau 7"
						/>
					</div>
				</div>
			</div>

			<!-- Provenance & Legalitas -->
			<div>
				<h3 class="text-lg font-semibold mb-6 text-gray-900 flex items-center border-b pb-2">
					<span class="bg-blue-600 w-1.5 h-5 mr-3 block rounded"></span> Status Kepemilikan & Legalitas
				</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Status Kepemilikan *</label>
						<select
							bind:value={ownershipStatus}
							class="w-full p-2 border border-gray-300 rounded bg-white"
						>
							{#each ownershipStatuses as status}
								<option value={status}>{ownershipStatusMap[status] || status}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Nomor Polisi / Plat Nomor
							<span class="text-xs font-normal text-gray-500">(Khusus internal admin)</span>
						</label>
						<input
							type="text"
							bind:value={plateNumber}
							class="w-full p-2 border border-gray-300 rounded bg-white"
							placeholder="mis. B 1234 ABC"
						/>
					</div>
					<div class="col-span-1 md:col-span-2">
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Masa Berlaku Pajak (Status Pajak)
							<span class="text-xs font-normal text-gray-500"
								>(Kosongkan jika belum diketahui / '-')</span
							>
						</label>
						<div class="grid grid-cols-2 gap-4">
							<select
								bind:value={taxMonth}
								class="w-full p-2 border border-gray-300 rounded bg-white"
							>
								<option value="">- Pilih Bulan (-) -</option>
								{#each months as m}
									<option value={m.value}>{m.label}</option>
								{/each}
							</select>
							<select
								bind:value={taxYear}
								class="w-full p-2 border border-gray-300 rounded bg-white"
							>
								<option value="">- Pilih Tahun (-) -</option>
								{#each years as y}
									<option value={y.toString()}>{y}</option>
								{/each}
							</select>
						</div>
					</div>
					<div
						class="col-span-1 md:col-span-2 pt-2 border-t border-gray-100 flex flex-col sm:flex-row gap-6"
					>
						<label class="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={hasFloodDamage}
								class="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
							/>
							<span class="text-sm font-medium text-gray-900">Bukan Bekas Banjir</span>
						</label>
						<label class="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={hasAccidentDamage}
								class="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
							/>
							<span class="text-sm font-medium text-gray-900">Bebas Lakalantas</span
							>
						</label>
					</div>
				</div>
			</div>

			<!-- Media Gallery -->
			<div>
				<h3 class="text-lg font-semibold mb-6 text-gray-900 flex items-center border-b pb-2">
					<span class="bg-blue-600 w-1.5 h-5 mr-3 block rounded"></span> Galeri Foto & Media
				</h3>
				<div class="space-y-4">
					<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						{#each galleryItems as item, idx (item.id)}
							<div
								class="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex flex-col group relative"
							>
								{#if idx === 0}
									<div
										class="absolute top-2 left-2 bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded z-10"
									>
										Cover
									</div>
								{/if}
								<div class="relative h-32 bg-gray-200 flex-shrink-0">
									<img src={item.preview} alt="" class="w-full h-full object-contain" />

									<div
										class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
									>
										<button
											type="button"
											class="bg-white/90 p-1.5 rounded hover:bg-white text-gray-800 disabled:opacity-50"
											on:click={() => moveItem(idx, -1)}
											disabled={idx === 0}
										>
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 19l-7-7 7-7"
												/></svg
											>
										</button>
										<button
											type="button"
											class="bg-red-500/90 p-1.5 rounded hover:bg-red-500 text-white"
											on:click={() => removeGalleryItem(idx)}
										>
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												/></svg
											>
										</button>
										<button
											type="button"
											class="bg-white/90 p-1.5 rounded hover:bg-white text-gray-800 disabled:opacity-50"
											on:click={() => moveItem(idx, 1)}
											disabled={idx === galleryItems.length - 1}
										>
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 5l7 7-7 7"
												/></svg
											>
										</button>
									</div>
								</div>
								<div class="p-2 border-t border-gray-200">
									<input
										type="text"
										bind:value={item.alt}
										placeholder="Alt text (opsional)"
										class="w-full text-xs p-1 border border-transparent hover:border-gray-300 focus:border-blue-500 outline-none rounded bg-transparent focus:bg-white"
									/>
								</div>
							</div>
						{/each}

						<!-- Upload Button -->
						<div
							class="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-lg h-full min-h-[160px] flex flex-col items-center justify-center text-center transition cursor-pointer relative group bg-gray-50"
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
								class="h-8 w-8 mx-auto mb-2 text-gray-400 group-hover:text-blue-500 transition"
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
							<span class="text-sm font-medium text-gray-500 group-hover:text-blue-600"
								>Tambah Foto</span
							>
						</div>
					</div>

					<div class="mt-4 pt-4 border-t border-gray-100">
						<label class="block text-sm font-medium text-gray-700 mb-1"
							>URL Tur Video (YouTube)</label
						>
						<input
							type="url"
							bind:value={videoTourUrl}
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white"
							placeholder="https://youtube.com/watch?v=..."
						/>
					</div>
				</div>
			</div>

			<!-- Actions Footer -->
			<div class="mt-10 flex items-center justify-end pt-6 border-t border-gray-200">
				<button
					type="submit"
					disabled={isLoading || !isFormValid || galleryItems.length === 0}
					class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded font-bold uppercase tracking-wider text-sm transition disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center"
				>
					{#if isLoading}
						<svg
							class="animate-spin h-4 w-4 text-white"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							><circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle><path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path></svg
						>
						Menyimpan...
					{:else}
						Simpan Kendaraan
					{/if}
				</button>
			</div>
		</form>
	</div>
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
