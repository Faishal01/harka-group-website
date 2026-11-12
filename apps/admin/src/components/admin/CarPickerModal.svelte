<script lang="ts">
	import type { Car } from "@harka/db";

	interface Props {
		isOpen: boolean;
		selectedCarIds: string[];
		cars: Car[];
		onSave: (carIds: string[]) => void;
		onClose: () => void;
	}

	let { isOpen, selectedCarIds = [], cars = [], onSave, onClose }: Props = $props();

	let searchQuery = $state("");
	let activeTab = $state<"all" | "selected">("all");
	let currentSelection = $state<string[]>([]);

	// Synchronize when modal opens
	$effect(() => {
		if (isOpen) {
			currentSelection = [...selectedCarIds];
			searchQuery = "";
			activeTab = "all";
		}
	});

	function formatRupiah(val: number): string {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);
	}

	const filteredCars = $derived(
		cars.filter((car) => {
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			return (
				car.title.toLowerCase().includes(q) ||
				car.make.toLowerCase().includes(q) ||
				car.model.toLowerCase().includes(q) ||
				car.year.toString().includes(q)
			);
		}),
	);

	const selectedCarsList = $derived(
		currentSelection
			.map((id) => cars.find((c) => c.id === id))
			.filter((c): c is Car => c !== undefined),
	);

	function toggleSelection(id: string) {
		if (currentSelection.includes(id)) {
			currentSelection = currentSelection.filter((item) => item !== id);
		} else {
			currentSelection = [...currentSelection, id];
		}
	}

	function moveUp(index: number) {
		if (index <= 0) return;
		const next = [...currentSelection];
		const temp = next[index];
		next[index] = next[index - 1];
		next[index - 1] = temp;
		currentSelection = next;
	}

	function moveDown(index: number) {
		if (index >= currentSelection.length - 1) return;
		const next = [...currentSelection];
		const temp = next[index];
		next[index] = next[index + 1];
		next[index + 1] = temp;
		currentSelection = next;
	}

	function removeCar(id: string) {
		currentSelection = currentSelection.filter((item) => item !== id);
	}

	function handleSave() {
		onSave(currentSelection);
		onClose();
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
		role="dialog"
		aria-modal="true"
	>
		<!-- Modal Content -->
		<div
			class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
		>
			<!-- Header -->
			<div
				class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50"
			>
				<div>
					<h3 class="text-lg font-bold text-gray-900">Pilih Mobil untuk Promo</h3>
					<p class="text-xs text-gray-500 mt-0.5">
						Tentukan unit mobil tertentu yang masuk ke dalam kampanye promo ini.
					</p>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
					aria-label="Tutup modal"
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
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Search & View Tabs -->
			<div class="p-6 pb-2 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
				<div class="relative grow">
					<span
						class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400"
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
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					</span>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Cari merek, model, atau tahun..."
						class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none"
					/>
				</div>

				<!-- Tabs -->
				<div class="flex items-center bg-gray-100 p-1 rounded-xl shrink-0">
					<button
						type="button"
						onclick={() => (activeTab = "all")}
						class="px-3 py-1.5 rounded-lg text-xs font-semibold transition {activeTab === 'all'
							? 'bg-white text-gray-900 shadow-sm'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Semua Unit ({cars.length})
					</button>
					<button
						type="button"
						onclick={() => (activeTab = "selected")}
						class="px-3 py-1.5 rounded-lg text-xs font-semibold transition {activeTab === 'selected'
							? 'bg-white text-gray-900 shadow-sm'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Dipilih ({currentSelection.length})
					</button>
				</div>
			</div>

			<!-- Scrollable List -->
			<div class="grow overflow-y-auto p-6 space-y-2">
				{#if activeTab === "all"}
					{#if filteredCars.length === 0}
						<div class="text-center py-12 text-gray-400">
							<p class="text-sm">Tidak ada mobil yang cocok dengan pencarian.</p>
						</div>
					{:else}
						{#each filteredCars as car (car.id)}
							{@const isSelected = currentSelection.includes(car.id)}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => toggleSelection(car.id)}
								class="flex items-center gap-3.5 p-3 rounded-xl border transition cursor-pointer {isSelected
									? 'border-red-600 bg-red-50/40 ring-1 ring-red-600'
									: 'border-gray-200 hover:border-gray-300 bg-white'}"
							>
								<input
									type="checkbox"
									checked={isSelected}
									onchange={() => {}}
									class="size-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
								/>
								<div
									class="size-12 shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
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
									<h4 class="text-sm font-bold text-gray-900 truncate">{car.title}</h4>
									<div class="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
										<span>{car.year}</span>
										<span>•</span>
										<span>{car.transmission}</span>
										<span>•</span>
										<span class="font-semibold text-gray-800">{formatRupiah(car.price)}</span>
										{#if car.promoPrice && car.promoPrice < car.price}
											<span class="text-red-700 font-bold">({formatRupiah(car.promoPrice)})</span>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					{/if}
				{:else}
					<!-- Selected tab with manual ordering -->
					{#if selectedCarsList.length === 0}
						<div class="text-center py-12 text-gray-400">
							<p class="text-sm">Belum ada mobil yang dipilih.</p>
							<button
								type="button"
								onclick={() => (activeTab = "all")}
								class="mt-2 text-xs text-red-600 font-semibold hover:underline"
							>
								Pilih dari daftar semua unit &rarr;
							</button>
						</div>
					{:else}
						<p class="text-xs text-gray-500 mb-2">
							Gunakan tombol panah untuk mengatur urutan tampil mobil di halaman promo.
						</p>
						{#each selectedCarsList as car, i (car.id)}
							<div
								class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white shadow-sm"
							>
								<span class="text-xs font-bold text-gray-400 w-5 text-center">{i + 1}</span>
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
									<h4 class="text-sm font-bold text-gray-900 truncate">{car.title}</h4>
									<div class="text-xs text-gray-500">
										<span>{car.year}</span> • <span>{formatRupiah(car.price)}</span>
									</div>
								</div>
								<div class="flex items-center gap-1">
									<button
										type="button"
										onclick={() => moveUp(i)}
										disabled={i === 0}
										class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 rounded-lg transition"
										title="Geser ke atas"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="size-4"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
												clip-rule="evenodd"
											/>
										</svg>
									</button>
									<button
										type="button"
										onclick={() => moveDown(i)}
										disabled={i === selectedCarsList.length - 1}
										class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 rounded-lg transition"
										title="Geser ke bawah"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="size-4"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
												clip-rule="evenodd"
											/>
										</svg>
									</button>
									<button
										type="button"
										onclick={() => removeCar(car.id)}
										class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition ml-1"
										title="Hapus dari daftar promo"
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
							</div>
						{/each}
					{/if}
				{/if}
			</div>

			<!-- Footer -->
			<div
				class="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50"
			>
				<span class="text-xs text-gray-500 font-medium">
					{currentSelection.length} mobil dipilih
				</span>
				<div class="flex items-center gap-2.5">
					<button
						type="button"
						onclick={onClose}
						class="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition"
					>
						Batal
					</button>
					<button
						type="button"
						onclick={handleSave}
						class="px-5 py-2 text-sm font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl shadow-sm transition"
					>
						Terapkan ({currentSelection.length})
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
