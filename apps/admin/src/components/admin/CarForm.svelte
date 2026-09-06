<script lang="ts">
	import { navigate } from "astro:transitions/client";

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

	// Data bindings (Initialize with existing car data or empty defaults)
	let title = car?.title || "";
	let excerpt = car?.excerpt || "";
	let imageAlt = car?.imageAlt || "";
	let videoTourUrl = car?.videoTourUrl || "";
	let existingImage = car?.image || "";
	let files: FileList | null = null;

	let general = car?.general || { make: "", model: "", price: 0, bodyType: "SUV", doors: 4, seatingCapacity: 5 };
	let history = car?.history || { year: new Date().getFullYear(), mileage: 0 };
	let technical = car?.technical || { horsePower: 0, engineSizeCC: 0, transmission: "Automatic" };
	let efficiency = car?.efficiency || { fuelType: "Petrol" };
	let exterior = car?.exterior || { color: "" };
	let misc = car?.misc || { hidden: false };

	$: isFormValid = general.make && general.model && general.price > 0 && history.year > 0 && (history.mileage >= 0 && history.mileage !== "");

	const submitForm = async () => {
		const finalTitle = title.trim() || `${general.make} ${general.model} ${history.year}`;

		isLoading = true;
		errorMessage = "";
		successMessage = "";

		try {
			const formData = new FormData();
			formData.append("title", finalTitle);
			formData.append("excerpt", excerpt);
			formData.append("imageAlt", imageAlt);
			formData.append("videoTourUrl", videoTourUrl);
			
			if (car?.id) {
				formData.append("image", existingImage); // fallback if no new file
			}

			if (files && files.length > 0) {
				formData.append("imageFile", files[0]);
			}

			formData.append("general", JSON.stringify(general));
			formData.append("history", JSON.stringify(history));
			formData.append("technical", JSON.stringify(technical));
			formData.append("efficiency", JSON.stringify(efficiency));
			formData.append("exterior", JSON.stringify(exterior));
			formData.append("misc", JSON.stringify(misc));

			const url = car?.id ? `/api/cars/${car.id}` : "/api/cars";
			const method = car?.id ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				body: formData,
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to save car");
			}

			const action = car?.id ? "updated" : "created";
			successMessage = `Vehicle ${action} successfully!`;
			showPopup("Success!", `Vehicle ${action} successfully! Redirecting to inventory...`, "success", action);
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
			<h2 class="text-xl font-bold text-gray-900">{car?.id ? "Edit Vehicle" : "Add New Vehicle"}</h2>
			{#if car?.id}
				<p class="text-gray-500 text-sm mt-1 font-mono">{car.id}</p>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			{#if misc.hidden}
				<div
					class="px-3 py-1 rounded text-xs font-bold uppercase tracking-widest bg-yellow-100 text-yellow-800 border border-yellow-200"
				>
					Hidden (Draft)
				</div>
			{:else}
				<div
					class="px-3 py-1 rounded text-xs font-bold uppercase tracking-widest bg-green-100 text-green-800 border border-green-200"
				>
					Public (Live)
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

		{#if successMessage}
			<div
				class="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
						clip-rule="evenodd"
					/>
				</svg>
				<span class="font-medium">{successMessage}</span>
			</div>
		{/if}

		<form on:submit|preventDefault={submitForm} class="space-y-12">
			<!-- General Information -->
			<div>
				<h3 class="text-lg font-semibold mb-6 text-gray-900 flex items-center border-b pb-2">
					<span class="bg-blue-600 w-1.5 h-5 mr-3 block rounded"></span> General Information
				</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="col-span-1 md:col-span-2">
						<label class="block text-sm font-medium text-gray-700 mb-1">Display Title <span class="text-gray-400 font-normal text-xs ml-2">(Optional - Auto-generates if blank)</span></label>
						<input
							type="text"
							bind:value={title}
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900"
							placeholder="{general.make && general.model && history.year ? `${general.make} ${general.model} ${history.year}` : 'e.g. 2026 Porsche 911 Turbo S'}"
						/>
					</div>

					<div class="col-span-1 md:col-span-2">
						<label class="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
						<input
							type="text"
							bind:value={excerpt}
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900"
							placeholder="Short description for cards..."
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Make <span class="text-red-500">*</span></label>
						<input
							type="text"
							bind:value={general.make}
							required
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Model <span class="text-red-500">*</span></label>
						<input
							type="text"
							bind:value={general.model}
							required
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Price (Rp) <span class="text-red-500">*</span></label>
						<input
							type="number"
							bind:value={general.price}
							required
							min="1"
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Body Type</label>
						<select
							bind:value={general.bodyType}
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900"
						>
							<option value="SUV">SUV</option>
							<option value="Sedan">Sedan</option>
							<option value="Hatchback">Hatchback</option>
							<option value="Coupe">Coupe</option>
							<option value="Convertible">Convertible</option>
							<option value="Pickup">Pickup</option>
						</select>
					</div>

					<div
						class="col-span-1 md:col-span-2 pt-4 border-t border-gray-200 mt-2 flex flex-col gap-4"
					>
						<div>
							<label class="flex items-center gap-3 cursor-pointer w-fit">
								<input
									type="checkbox"
									bind:checked={misc.hidden}
									class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
								/>
								<span class="text-sm font-medium text-gray-900">Hidden (Draft Status)</span>
							</label>
							<p class="text-xs text-gray-500 mt-1 ml-8">
								If checked, this car will not appear on the main website.
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Performance & History -->
			<div>
				<h3 class="text-lg font-semibold mb-6 text-gray-900 flex items-center border-b pb-2">
					<span class="bg-blue-600 w-1.5 h-5 mr-3 block rounded"></span> Performance & History
				</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Model Year <span class="text-red-500">*</span></label>
						<input
							type="number"
							bind:value={history.year}
							required
							min="1900"
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Mileage (km) <span class="text-red-500">*</span></label>
						<input
							type="number"
							bind:value={history.mileage}
							required
							min="0"
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Horsepower (BHP)</label>
						<input
							type="number"
							bind:value={technical.horsePower}
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Engine Size (CC)</label>
						<input
							type="number"
							bind:value={technical.engineSizeCC}
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
						<select
							bind:value={technical.transmission}
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900"
						>
							<option value="Automatic">Automatic</option>
							<option value="Manual">Manual</option>
							<option value="Dual-Clutch">Dual-Clutch</option>
							<option value="CVT">CVT</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Configuration -->
			<div>
				<h3 class="text-lg font-semibold mb-6 text-gray-900 flex items-center border-b pb-2">
					<span class="bg-blue-600 w-1.5 h-5 mr-3 block rounded"></span> Configuration
				</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
						<select
							bind:value={efficiency.fuelType}
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900"
						>
							<option value="Petrol">Petrol</option>
							<option value="Diesel">Diesel</option>
							<option value="Hybrid">Hybrid</option>
							<option value="Electric">Electric</option>
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Exterior Color</label>
						<input
							type="text"
							bind:value={exterior.color}
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Doors</label>
						<input
							type="number"
							bind:value={general.doors}
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Seating</label>
						<input
							type="number"
							bind:value={general.seatingCapacity}
							class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900"
						/>
					</div>
				</div>
			</div>

			<!-- Media -->
			<div>
				<h3 class="text-lg font-semibold mb-6 text-gray-900 flex items-center border-b pb-2">
					<span class="bg-blue-600 w-1.5 h-5 mr-3 block rounded"></span> Media
				</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
					{#if existingImage}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Current Image</label>
							<div class="rounded-lg overflow-hidden border border-gray-700 h-48 bg-gray-100">
								<img
									src={existingImage}
									alt="Car thumbnail"
									class="w-full h-full object-cover opacity-80 hover:opacity-100 transition"
								/>
							</div>
						</div>
					{/if}

					<div class={existingImage ? "" : "col-span-1 md:col-span-2"}>
						<label class="block text-sm font-medium text-gray-700 mb-1">{existingImage ? "Replace Image" : "Main Image"}</label>
						<div
							class="bg-gray-50 border border-dashed border-gray-300 hover:border-blue-500 rounded-lg h-48 flex flex-col items-center justify-center text-center hover:border-blue-500 transition cursor-pointer relative group"
						>
							<input
								type="file"
								bind:files
								accept="image/*"
								class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
							/>

							<svg
								xmlns="http://www.w3.org/2000/svg"
								class={`h-10 w-10 mx-auto mb-3 transition ${files && files.length ? "text-blue-500" : "text-gray-500 group-hover:text-blue-400"}`}
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
							<p class="text-sm font-medium text-gray-400 px-4">
								{files && files.length ? files[0].name : "Drag & drop to replace or upload"}
							</p>
						</div>
					</div>

					<div class="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Image Alt Text</label>
							<input
								type="text"
								bind:value={imageAlt}
								class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900"
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Video Tour URL</label>
							<input
								type="url"
								bind:value={videoTourUrl}
								class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-gray-900"
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- Actions Footer -->
			<div
				class="mt-10 flex items-center justify-end pt-6 border-t border-gray-200"
			>
				<button
					type="submit"
					disabled={isLoading || !isFormValid}
					class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded font-bold uppercase tracking-wider text-sm transition disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center"
				>
					{#if isLoading}
						<svg
							class="animate-spin h-4 w-4 text-white"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Saving...
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
						Save Vehicle
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>

{#if popup.show}
	<div
		class="fixed top-20 right-4 md:right-8 z-50 animate-fade-in max-w-sm w-full shadow-xl rounded-lg border-l-4 p-4 {popup.type === 'success' ? 'bg-white border-green-500' : 'bg-white border-red-500'}"
	>
		<div class="flex items-start gap-3">
			{#if popup.type === "success"}
				<svg class="h-6 w-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
			{:else}
				<svg class="h-6 w-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
			{/if}
			<div class="flex-1">
				<h4 class="font-bold text-gray-900">{popup.title}</h4>
				<p class="text-sm text-gray-600 mt-1">{popup.message}</p>
			</div>
			<button class="ml-auto text-gray-400 hover:text-gray-600 flex-shrink-0" on:click={() => (popup.show = false)}>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
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
