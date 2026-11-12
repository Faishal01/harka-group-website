<script lang="ts">
	import { onMount } from "svelte";
	import type { Car } from "~/types";
	import type { Promo } from "@harka/db";
	import { getPrice, getMileage, getMileageUnit } from "~/utils/helpers";
	import { transmissionMap, fuelTypeMap } from "~/data/constants";
	import CarImageSlider from "./CarImageSlider.svelte";
	import PromoBannerCarousel from "./PromoBannerCarousel.svelte";

	interface Props {
		initialCars: Car[];
		totalCount: number;
		availableMakes: string[];
		initialSearch?: string;
		initialMake?: string;
		initialSort?: string;
		backgroundImageSrc?: string;
		promos?: Promo[];
	}

	let {
		initialCars = [],
		totalCount = 0,
		availableMakes = [],
		initialSearch = "",
		initialMake = "all",
		initialSort = "date-desc",
		backgroundImageSrc = "",
		promos = [],
	}: Props = $props();

	const sortOptions = [
		{ value: "date-desc", label: "Terbaru" },
		{ value: "price-asc", label: "Harga Terendah" },
		{ value: "price-desc", label: "Harga Tertinggi" },
		{ value: "year-desc", label: "Tahun Terbaru" },
		{ value: "year-asc", label: "Tahun Terlama" },
		{ value: "mileage-asc", label: "Kilometer Terendah" },
	];

	// State
	let searchQuery = $state(initialSearch);
	let selectedMake = $state(initialMake);
	let selectedSort = $state(initialSort);
	let isSortDropdownOpen = $state(false);
	let sortDropdownRef = $state<HTMLElement | null>(null);

	let activeSortLabel = $derived(
		sortOptions.find((opt) => opt.value === selectedSort)?.label || "Terbaru",
	);

	let cars = $state<Car[]>(initialCars);
	let currentPage = $state(1);
	let total = $state(totalCount);
	let hasMore = $state(totalCount > initialCars.length);
	let isLoadingMore = $state(false);
	let isSearching = $state(false);

	let sentinelElement = $state<HTMLElement | null>(null);
	let observer: IntersectionObserver | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let abortController: AbortController | null = null;

	const mileageUnit = getMileageUnit();

	// Update browser URL query params
	function syncUrlParams() {
		if (typeof window === "undefined") return;
		const url = new URL(window.location.href);

		if (searchQuery.trim()) {
			url.searchParams.set("search", searchQuery.trim());
		} else {
			url.searchParams.delete("search");
		}

		if (selectedMake && selectedMake !== "all") {
			url.searchParams.set("make", selectedMake);
		} else {
			url.searchParams.delete("make");
		}

		if (selectedSort && selectedSort !== "date-desc") {
			url.searchParams.set("sort", selectedSort);
		} else {
			url.searchParams.delete("sort");
		}

		// Reset page parameter on filter change
		url.searchParams.delete("page");

		window.history.replaceState({}, "", url.toString());
	}

	// Fetch cars from API
	async function fetchCars(page: number, append = false) {
		if (abortController) {
			abortController.abort();
		}
		abortController = new AbortController();

		const queryParts = [`page=${encodeURIComponent(page)}`, "pageSize=12"];

		if (searchQuery.trim()) {
			queryParts.push(`search=${encodeURIComponent(searchQuery.trim())}`);
		}
		if (selectedMake && selectedMake !== "all") {
			queryParts.push(`make=${encodeURIComponent(selectedMake)}`);
		}
		if (selectedSort && selectedSort !== "date-desc") {
			queryParts.push(`sort=${encodeURIComponent(selectedSort)}`);
		}

		try {
			const res = await fetch(`/api/getFilteredCars.json?${queryParts.join("&")}`, {
				signal: abortController.signal,
			});

			if (!res.ok) {
				if (!append) {
					cars = [];
					total = 0;
					hasMore = false;
				}
				return;
			}

			const data = await res.json();
			const newCars: Car[] = data.cars || [];
			const pagination = data.pagination || {
				total: newCars.length,
				hasMore: false,
			};

			if (append) {
				cars = [...cars, ...newCars];
			} else {
				cars = newCars;
			}

			currentPage = page;
			total = pagination.total ?? cars.length;
			hasMore = pagination.hasMore ?? false;
		} catch (err: unknown) {
			if (err instanceof Error && err.name !== "AbortError") {
				console.error("Error fetching cars:", err);
			}
		} finally {
			isLoadingMore = false;
			isSearching = false;
		}
	}

	// Trigger fresh query when filters change
	function handleFilterChange() {
		isSearching = true;
		syncUrlParams();
		fetchCars(1, false);
	}

	function handleSearchInput() {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			handleFilterChange();
		}, 300);
	}

	function clearSearch() {
		searchQuery = "";
		handleFilterChange();
	}

	function selectMake(make: string) {
		if (selectedMake === make) return;
		selectedMake = make;
		handleFilterChange();
	}

	function selectSort(sortValue: string) {
		selectedSort = sortValue;
		isSortDropdownOpen = false;
		handleFilterChange();
	}

	function resetFilters() {
		searchQuery = "";
		selectedMake = "all";
		selectedSort = "date-desc";
		isSortDropdownOpen = false;
		handleFilterChange();
	}

	function handleWindowClick(event: MouseEvent) {
		if (isSortDropdownOpen && sortDropdownRef && !sortDropdownRef.contains(event.target as Node)) {
			isSortDropdownOpen = false;
		}
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === "Escape" && isSortDropdownOpen) {
			isSortDropdownOpen = false;
		}
	}

	onMount(() => {
		// Read initial URL params in case client mounted with existing query
		const url = new URL(window.location.href);
		const urlSearch = url.searchParams.get("search") || "";
		const urlMake = url.searchParams.get("make") || "all";
		const urlSort = url.searchParams.get("sort") || "date-desc";

		if (urlSearch !== initialSearch || urlMake !== initialMake || urlSort !== initialSort) {
			searchQuery = urlSearch;
			selectedMake = urlMake;
			selectedSort = urlSort;
			fetchCars(1, false);
		}

		// Click outside and keydown listeners
		window.addEventListener("click", handleWindowClick);
		window.addEventListener("keydown", handleWindowKeydown);

		// Setup Infinite Scroll Observer
		observer = new IntersectionObserver(
			(entries) => {
				const first = entries[0];
				if (first.isIntersecting && hasMore && !isLoadingMore && !isSearching) {
					isLoadingMore = true;
					fetchCars(currentPage + 1, true);
				}
			},
			{ rootMargin: "300px" },
		);

		if (sentinelElement) {
			observer.observe(sentinelElement);
		}

		return () => {
			if (debounceTimer) clearTimeout(debounceTimer);
			if (abortController) abortController.abort();
			if (observer) observer.disconnect();
			window.removeEventListener("click", handleWindowClick);
			window.removeEventListener("keydown", handleWindowKeydown);
		};
	});

	$effect(() => {
		if (sentinelElement && observer) {
			observer.disconnect();
			if (hasMore) {
				observer.observe(sentinelElement);
			}
		}
	});
</script>

<!-- TOP COCKPIT: Minimal Dark Automotive Strip with Background Vignette -->
<section class="relative bg-gray-950 text-white border-b border-gray-800 shadow-xl">
	<!-- Background Image with Dramatic Vignette (contained in overflow-hidden) -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none select-none">
		{#if backgroundImageSrc}
			<img
				src={backgroundImageSrc}
				alt=""
				aria-hidden="true"
				class="w-full h-full object-cover scale-125 origin-[center_40%] md:scale-100 md:origin-center opacity-35 mix-blend-luminosity"
			/>
		{/if}
		<div
			class="absolute inset-0 bg-gradient-to-b from-gray-950/90 via-gray-900/60 to-gray-950/95 backdrop-blur-[1px]"
		></div>
	</div>

	<!-- Cockpit content aligned to max-w-6xl -->
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-10 lg:py-14">
		<!-- Promo Banner Carousel (Cleanly hidden if 0 active promos) -->
		{#if promos && promos.length > 0}
			<PromoBannerCarousel {promos} />
		{/if}

		<!-- Search Bar & Custom Sort Dropdown -->
		<div class="w-full flex flex-col sm:flex-row items-center gap-3">
			<!-- Search Bar -->
			<div class="relative w-full grow">
				<div
					class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"
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
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</div>
				<input
					type="text"
					bind:value={searchQuery}
					oninput={handleSearchInput}
					placeholder="Cari merek, model, atau tahun (contoh: Avanza, CR-V 2021)..."
					class="w-full pl-11 pr-10 py-3.5 bg-gray-900/90 text-white placeholder-gray-400 rounded-xl border border-gray-700/80 focus:border-red-600 focus:ring-2 focus:ring-red-600/30 text-base shadow-inner outline-none transition backdrop-blur-md"
				/>
				{#if searchQuery}
					<button
						type="button"
						onclick={clearSearch}
						class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition cursor-pointer"
						aria-label="Bersihkan pencarian"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="size-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				{/if}
			</div>

			<!-- Theme-Adjusted Custom Sort Dropdown -->
			<div bind:this={sortDropdownRef} class="relative w-full sm:w-auto shrink-0">
				<button
					type="button"
					onclick={() => (isSortDropdownOpen = !isSortDropdownOpen)}
					aria-haspopup="listbox"
					aria-expanded={isSortDropdownOpen}
					class="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2.5 px-4 py-3.5 bg-gray-900/90 hover:bg-gray-800/90 text-white rounded-xl border border-gray-700/80 focus:border-red-600 focus:ring-2 focus:ring-red-600/30 text-sm font-semibold shadow-inner outline-none transition cursor-pointer backdrop-blur-md whitespace-nowrap"
				>
					<!-- Sort Icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="size-4 text-red-500 shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
						/>
					</svg>

					<span class="truncate">
						<span class="text-gray-400 font-normal">Urutkan:</span>
						{activeSortLabel}
					</span>

					<!-- Chevron Icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class={`size-4 text-gray-400 transition-transform duration-200 shrink-0 ${isSortDropdownOpen ? "rotate-180 text-white" : ""}`}
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

				<!-- Dropdown Popover -->
				{#if isSortDropdownOpen}
					<div
						role="listbox"
						class="absolute right-0 top-full mt-2 w-full sm:w-60 bg-gray-900/98 border border-gray-700/80 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-lg animate-in fade-in slide-in-from-top-2 duration-150"
					>
						{#each sortOptions as option (option.value)}
							{@const isSelected = selectedSort === option.value}
							<button
								type="button"
								role="option"
								aria-selected={isSelected}
								onclick={() => selectSort(option.value)}
								class={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer text-left ${
									isSelected
										? "bg-red-700/20 text-red-400 font-bold border border-red-600/30"
										: "text-gray-300 hover:bg-gray-800 hover:text-white"
								}`}
							>
								<span>{option.label}</span>
								{#if isSelected}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="size-4 text-red-500"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Quick Filter Brand Chips -->
		{#if availableMakes.length > 0}
			<div class="w-full mt-4 pt-1">
				<div
					class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700"
				>
					<button
						type="button"
						onclick={() => selectMake("all")}
						class={`shrink-0 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer border ${
							selectedMake === "all"
								? "bg-red-700 text-white border-red-600 shadow-md shadow-red-900/30"
								: "bg-gray-900/80 text-gray-300 hover:bg-gray-800 hover:text-white border-gray-700/80"
						}`}
					>
						Semua Merek
					</button>

					{#each availableMakes as make (make)}
						<button
							type="button"
							onclick={() => selectMake(make)}
							class={`shrink-0 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer border ${
								selectedMake === make
									? "bg-red-700 text-white border-red-600 shadow-md shadow-red-900/30"
									: "bg-gray-900/80 text-gray-300 hover:bg-gray-800 hover:text-white border-gray-700/80"
							}`}
						>
							{make}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</section>

<!-- MAIN VEHICLE FEED SECTION (Aligned to max-w-6xl) -->
<section class="bg-gray-50 py-10 lg:py-14 min-h-[600px]">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Active Status & Counter Bar -->
		<div class="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
			<div class="flex items-center gap-2">
				<span class="text-sm font-bold text-gray-900 font-header"> Stok Mobil Tersedia </span>
				<span class="text-xs px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-700 font-semibold">
					{total} unit
				</span>
			</div>

			<div class="flex items-center gap-3">
				{#if isSearching}
					<span class="flex items-center gap-1.5 text-xs text-red-700 font-medium animate-pulse">
						<svg
							class="animate-spin size-3.5 text-red-700"
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
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
						</svg>
						Mencari...
					</span>
				{/if}

				{#if searchQuery || selectedMake !== "all"}
					<button
						type="button"
						onclick={resetFilters}
						class="text-xs text-red-700 hover:text-red-800 hover:underline font-semibold cursor-pointer"
					>
						Reset Filter
					</button>
				{/if}
			</div>
		</div>

		<!-- Vehicles Grid (3 columns on desktop, 2 on tablet, 1 on mobile) -->
		{#if cars.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
				{#each cars as car (car.id)}
					{@const isSold = car.archiveReason === "sold"}
					{@const rawMileage = car.mileage ?? 0}
					{@const formattedMileage = getMileage(rawMileage)}
					{@const transmissionLabel = transmissionMap[car.transmission || ""] || car.transmission}
					{@const fuelLabel = fuelTypeMap[car.fuelType || ""] || car.fuelType}

					<article
						data-car-id={car.id}
						class="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200/90 flex flex-col h-full hover:border-red-600"
					>
						<a href={`/view/${car.id}`} class="flex flex-col h-full">
							<!-- Photo Container with Dynamic Image Slider -->
							<CarImageSlider gallery={car.gallery} title={car.title} {isSold} carId={car.id} />

							<!-- Content Body -->
							<div class="p-5 sm:p-6 flex flex-col grow">
								<!-- Title: Locked 2-Line Height for Fixed Vertical Position -->
								<div class="h-12 flex items-start mb-2 overflow-hidden">
									<h2
										class="car-card-title text-base sm:text-lg font-bold text-gray-900 group-hover:text-red-700 transition-colors line-clamp-2 leading-snug"
									>
										{car.title}
									</h2>
								</div>

								<!-- Specs Row: Mileage • Transmission • Fuel • Year -->
								<div class="flex items-center gap-1.5 text-xs text-gray-500 mb-3 truncate">
									<span>{formattedMileage} {mileageUnit}</span>
									{#if transmissionLabel}
										<span class="text-gray-300">•</span>
										<span>{transmissionLabel}</span>
									{/if}
									{#if fuelLabel}
										<span class="text-gray-300">•</span>
										<span>{fuelLabel}</span>
									{/if}
									{#if car.year}
										<span class="text-gray-300">•</span>
										<span>{car.year}</span>
									{/if}
								</div>

								<!-- Price: Clean font-inter, Vertically Fixed Across All Cards -->
								<div class="mb-4 flex items-baseline gap-2 flex-wrap min-h-[1.75rem]">
									{#if car.promoPrice && car.promoPrice < car.price}
										<span class="text-xs sm:text-sm text-gray-400 line-through font-medium">
											{getPrice(car.price)}
										</span>
										<span
											class="text-lg sm:text-xl font-bold text-red-700 tracking-tight font-inter"
										>
											{getPrice(car.promoPrice)}
										</span>
									{:else}
										<span
											class="text-lg sm:text-xl font-bold text-gray-900 tracking-tight font-inter"
										>
											{getPrice(car.price)}
										</span>
									{/if}
								</div>

								<!-- Trust Badges (Verified against Production Database) -->
								<div
									class="mt-auto pt-3 border-t border-gray-100 flex flex-wrap items-center gap-1.5"
								>
									<!-- Bebas Banjir & Tabrak -->
									{#if car.isFloodFree && car.isAccidentFree}
										<span
											class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200/60"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="size-3 text-emerald-600 shrink-0"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fill-rule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clip-rule="evenodd"
												/>
											</svg>
											Bebas Tabrak & Banjir
										</span>
									{/if}

									<!-- Tangan Pertama -->
									{#if car.ownershipStatus === "first_hand"}
										<span
											class="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200/60"
										>
											Tangan Pertama
										</span>
									{/if}

									<!-- Seating Capacity if present -->
									{#if car.seatingCapacity}
										<span
											class="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium"
										>
											{car.seatingCapacity} Kursi
										</span>
									{/if}
								</div>
							</div>
						</a>
					</article>
				{/each}
			</div>

			<!-- Skeletons when loading next batch -->
			{#if isLoadingMore}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-6 lg:mt-8">
					{#each Array(3) as _, i (i)}
						<div
							class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm animate-pulse"
						>
							<div class="aspect-[4/3] bg-gray-200"></div>
							<div class="p-6 space-y-4">
								<div class="h-6 bg-gray-200 rounded w-3/4"></div>
								<div class="h-8 bg-gray-200 rounded w-1/2"></div>
								<div class="h-4 bg-gray-100 rounded w-full"></div>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Infinite Scroll Sentinel -->
			{#if hasMore}
				<div bind:this={sentinelElement} class="h-10 w-full flex items-center justify-center my-8">
					<span class="sr-only">Memuat mobil selanjutnya...</span>
				</div>
			{:else}
				<!-- End-of-inventory exhaustion badge -->
				<div class="mt-12 mb-6 text-center">
					<div
						class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 text-sm font-semibold"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="size-4 text-emerald-600"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>Semua unit telah ditampilkan ({total} unit)</span>
					</div>
				</div>
			{/if}
		{:else if !isSearching}
			<!-- Empty State -->
			<div
				class="max-w-md mx-auto my-16 p-8 text-center bg-white rounded-2xl border border-gray-200 shadow-sm"
			>
				<div
					class="size-16 mx-auto mb-4 rounded-full bg-red-50 text-red-700 flex items-center justify-center"
				>
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
							d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<h3 class="text-lg font-bold text-gray-900 font-header">Mobil Tidak Ditemukan</h3>
				<p class="mt-2 text-sm text-gray-500 leading-relaxed">
					Tidak ada unit mobil yang sesuai dengan kata kunci atau filter yang Anda pilih.
				</p>
				<button
					type="button"
					onclick={resetFilters}
					class="mt-6 inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl transition cursor-pointer shadow"
				>
					Reset Semua Filter
				</button>
			</div>
		{/if}
	</div>
</section>

<style>
	:global(.car-card-title) {
		font-size: 1rem !important;
		line-height: 1.375rem !important;
	}
	@media (min-width: 640px) {
		:global(.car-card-title) {
			font-size: 1.125rem !important;
			line-height: 1.5rem !important;
		}
	}
</style>
