<script lang="ts">
	import { onMount } from "svelte";
	import type { Car } from "~/types";
	import type { Promo } from "@harka/db";
	import { getPrice, getMileage, getMileageUnit } from "~/utils/helpers";
	import {
		bodyTypes,
		fuelTypes,
		fuelTypeMap,
		transmissions,
		transmissionMap,
	} from "~/data/constants";
	import CarImageSlider from "./CarImageSlider.svelte";
	import PromoBannerCarousel from "./PromoBannerCarousel.svelte";

	interface Props {
		initialCars: Car[];
		totalCount: number;
		availableMakes: string[];
		initialModels?: string[];
		initialSearch?: string;
		initialMake?: string;
		initialModel?: string;
		initialBodyType?: string;
		initialTransmission?: string;
		initialFuelType?: string;
		initialPrice?: string;
		initialYearFrom?: string;
		initialYearTo?: string;
		initialSort?: string;
		promos?: Promo[];
	}

	let {
		initialCars = [],
		totalCount = 0,
		availableMakes = [],
		initialModels = [],
		initialSearch = "",
		initialMake = "all",
		initialModel = "all",
		initialBodyType = "all",
		initialTransmission = "all",
		initialFuelType = "all",
		initialPrice = "all",
		initialYearFrom = "",
		initialYearTo = "",
		initialSort = "date-desc",
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

	const pricePresets = [
		{ value: "0-150000000", label: "< 150 Jt" },
		{ value: "150000000-250000000", label: "150 – 250 Jt" },
		{ value: "250000000-400000000", label: "250 – 400 Jt" },
		{ value: "400000000-", label: "> 400 Jt" },
	];

	// Filter state
	let searchQuery = $state(initialSearch);
	let selectedMake = $state(initialMake);
	let selectedModel = $state(initialModel);
	let availableModels = $state<string[]>(initialModels);
	let isLoadingModels = $state(false);
	let selectedBodyType = $state(initialBodyType);
	let selectedTransmission = $state(initialTransmission);
	let selectedFuelType = $state(initialFuelType);
	let selectedPrice = $state(initialPrice);
	let yearFrom = $state(initialYearFrom);
	let yearTo = $state(initialYearTo);
	let selectedSort = $state(initialSort);

	// Custom price min/max (in Juta)
	function parsePriceParts(priceVal: string): { min: string; max: string } {
		if (!priceVal || priceVal === "all") return { min: "", max: "" };
		const [minRaw, maxRaw] = priceVal.split("-");
		const minNum = minRaw ? Number(minRaw) : NaN;
		const maxNum = maxRaw ? Number(maxRaw) : NaN;
		return {
			min: !Number.isNaN(minNum) && minNum > 0 ? String(Math.round(minNum / 1_000_000)) : "",
			max: !Number.isNaN(maxNum) && maxNum > 0 ? String(Math.round(maxNum / 1_000_000)) : "",
		};
	}

	const initPriceParts = parsePriceParts(initialPrice);
	let priceMinJuta = $state(initPriceParts.min);
	let priceMaxJuta = $state(initPriceParts.max);

	// UI state
	let isSortDropdownOpen = $state(false);
	let isMobileDrawerOpen = $state(false);
	let sortDropdownRef = $state<HTMLElement | null>(null);

	let activeSortLabel = $derived(
		sortOptions.find((opt) => opt.value === selectedSort)?.label || "Terbaru",
	);

	// Results state
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

	interface ActiveChip {
		key: string;
		label: string;
		clear: () => void;
	}

	let activeChips = $derived.by((): ActiveChip[] => {
		const chips: ActiveChip[] = [];
		if (searchQuery.trim()) {
			chips.push({
				key: "search",
				label: `Cari: "${searchQuery.trim()}"`,
				clear: () => {
					searchQuery = "";
					handleFilterChange();
				},
			});
		}
		if (selectedMake && selectedMake !== "all") {
			chips.push({
				key: "make",
				label: `Merek: ${selectedMake}`,
				clear: () => {
					selectedMake = "all";
					selectedModel = "all";
					availableModels = [];
					handleFilterChange();
				},
			});
		}
		if (selectedModel && selectedModel !== "all") {
			chips.push({
				key: "model",
				label: `Model: ${selectedModel}`,
				clear: () => {
					selectedModel = "all";
					handleFilterChange();
				},
			});
		}
		if (selectedPrice && selectedPrice !== "all") {
			const preset = pricePresets.find((p) => p.value === selectedPrice);
			const parts = parsePriceParts(selectedPrice);
			const customLabel =
				parts.min && parts.max
					? `Rp ${parts.min}–${parts.max} Jt`
					: parts.min
						? `> Rp ${parts.min} Jt`
						: `< Rp ${parts.max} Jt`;
			chips.push({
				key: "price",
				label: `Harga: ${preset?.label || customLabel}`,
				clear: () => {
					selectedPrice = "all";
					priceMinJuta = "";
					priceMaxJuta = "";
					handleFilterChange();
				},
			});
		}
		if (selectedBodyType && selectedBodyType !== "all") {
			chips.push({
				key: "bodyType",
				label: `Bodi: ${selectedBodyType}`,
				clear: () => {
					selectedBodyType = "all";
					handleFilterChange();
				},
			});
		}
		if (selectedTransmission && selectedTransmission !== "all") {
			chips.push({
				key: "transmission",
				label: `Transmisi: ${transmissionMap[selectedTransmission] || selectedTransmission}`,
				clear: () => {
					selectedTransmission = "all";
					handleFilterChange();
				},
			});
		}
		if (selectedFuelType && selectedFuelType !== "all") {
			chips.push({
				key: "fuelType",
				label: `BBM: ${fuelTypeMap[selectedFuelType] || selectedFuelType}`,
				clear: () => {
					selectedFuelType = "all";
					handleFilterChange();
				},
			});
		}
		if (yearFrom || yearTo) {
			const yearLabel =
				yearFrom && yearTo ? `${yearFrom}–${yearTo}` : yearFrom ? `≥ ${yearFrom}` : `≤ ${yearTo}`;
			chips.push({
				key: "year",
				label: `Tahun: ${yearLabel}`,
				clear: () => {
					yearFrom = "";
					yearTo = "";
					handleFilterChange();
				},
			});
		}
		return chips;
	});

	let activeFilterCount = $derived(activeChips.length);

	async function loadModelsForMake(make: string) {
		if (!make || make === "all") {
			availableModels = [];
			return;
		}
		isLoadingModels = true;
		try {
			const res = await fetch(`/api/getModels.json?make=${encodeURIComponent(make)}`);
			if (res.ok) {
				const data = await res.json();
				availableModels = Array.isArray(data) ? data : [];
			} else {
				availableModels = [];
			}
		} catch {
			availableModels = [];
		} finally {
			isLoadingModels = false;
		}
	}

	function syncUrlParams() {
		if (typeof window === "undefined") return;
		const url = new URL(window.location.href);

		const setOrDelete = (key: string, val: string, defaultVal = "") => {
			if (val && val !== defaultVal) {
				url.searchParams.set(key, val);
			} else {
				url.searchParams.delete(key);
			}
		};

		setOrDelete("search", searchQuery.trim());
		setOrDelete("make", selectedMake, "all");
		setOrDelete("model", selectedModel, "all");
		setOrDelete("bodyType", selectedBodyType, "all");
		setOrDelete("transmission", selectedTransmission, "all");
		setOrDelete("fuelType", selectedFuelType, "all");
		setOrDelete("price", selectedPrice, "all");
		setOrDelete("yearFrom", yearFrom.trim());
		setOrDelete("yearTo", yearTo.trim());
		setOrDelete("sort", selectedSort, "date-desc");
		url.searchParams.delete("page");

		window.history.replaceState({}, "", url.toString());
	}

	async function fetchCars(page: number, append = false) {
		if (abortController) {
			abortController.abort();
		}
		abortController = new AbortController();

		const queryParts = [`page=${encodeURIComponent(page)}`, "pageSize=12"];

		if (searchQuery.trim()) queryParts.push(`search=${encodeURIComponent(searchQuery.trim())}`);
		if (selectedMake && selectedMake !== "all")
			queryParts.push(`make=${encodeURIComponent(selectedMake)}`);
		if (selectedModel && selectedModel !== "all")
			queryParts.push(`model=${encodeURIComponent(selectedModel)}`);
		if (selectedBodyType && selectedBodyType !== "all")
			queryParts.push(`bodyType=${encodeURIComponent(selectedBodyType)}`);
		if (selectedTransmission && selectedTransmission !== "all")
			queryParts.push(`transmission=${encodeURIComponent(selectedTransmission)}`);
		if (selectedFuelType && selectedFuelType !== "all")
			queryParts.push(`fuelType=${encodeURIComponent(selectedFuelType)}`);
		if (selectedPrice && selectedPrice !== "all")
			queryParts.push(`price=${encodeURIComponent(selectedPrice)}`);
		if (yearFrom.trim()) queryParts.push(`yearFrom=${encodeURIComponent(yearFrom.trim())}`);
		if (yearTo.trim()) queryParts.push(`yearTo=${encodeURIComponent(yearTo.trim())}`);
		if (selectedSort && selectedSort !== "date-desc")
			queryParts.push(`sort=${encodeURIComponent(selectedSort)}`);

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

			cars = append ? [...cars, ...newCars] : newCars;
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

	function handleFilterChange() {
		isSearching = true;
		syncUrlParams();
		fetchCars(1, false);
	}

	function handleDebouncedFilterChange() {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			handleFilterChange();
		}, 300);
	}

	function clearSearch() {
		searchQuery = "";
		handleFilterChange();
	}

	function handleMakeChange(make: string) {
		if (selectedMake === make) return;
		selectedMake = make;
		selectedModel = "all";
		if (make === "all") {
			availableModels = [];
		} else {
			loadModelsForMake(make);
		}
		handleFilterChange();
	}

	function toggleBodyType(bt: string) {
		selectedBodyType = selectedBodyType === bt ? "all" : bt;
		handleFilterChange();
	}

	function toggleTransmission(tr: string) {
		selectedTransmission = selectedTransmission === tr ? "all" : tr;
		handleFilterChange();
	}

	function toggleFuelType(ft: string) {
		selectedFuelType = selectedFuelType === ft ? "all" : ft;
		handleFilterChange();
	}

	function selectPricePreset(val: string) {
		if (selectedPrice === val) {
			selectedPrice = "all";
			priceMinJuta = "";
			priceMaxJuta = "";
		} else {
			selectedPrice = val;
			const parts = parsePriceParts(val);
			priceMinJuta = parts.min;
			priceMaxJuta = parts.max;
		}
		handleFilterChange();
	}

	function applyCustomPrice() {
		const min = priceMinJuta.trim() ? Number(priceMinJuta.trim()) * 1_000_000 : 0;
		const max = priceMaxJuta.trim() ? Number(priceMaxJuta.trim()) * 1_000_000 : 0;
		if (!min && !max) {
			selectedPrice = "all";
		} else {
			selectedPrice = `${min || 0}-${max || ""}`;
		}
		handleDebouncedFilterChange();
	}

	function selectSort(sortValue: string) {
		selectedSort = sortValue;
		isSortDropdownOpen = false;
		handleFilterChange();
	}

	function resetFilters() {
		searchQuery = "";
		selectedMake = "all";
		selectedModel = "all";
		availableModels = [];
		selectedBodyType = "all";
		selectedTransmission = "all";
		selectedFuelType = "all";
		selectedPrice = "all";
		priceMinJuta = "";
		priceMaxJuta = "";
		yearFrom = "";
		yearTo = "";
		selectedSort = "date-desc";
		isSortDropdownOpen = false;
		handleFilterChange();
	}

	function loadMore() {
		if (hasMore && !isLoadingMore && !isSearching) {
			isLoadingMore = true;
			fetchCars(currentPage + 1, true);
		}
	}

	function handleWindowClick(event: MouseEvent) {
		if (isSortDropdownOpen && sortDropdownRef && !sortDropdownRef.contains(event.target as Node)) {
			isSortDropdownOpen = false;
		}
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			isSortDropdownOpen = false;
			isMobileDrawerOpen = false;
		}
	}

	onMount(() => {
		window.addEventListener("click", handleWindowClick);
		window.addEventListener("keydown", handleWindowKeydown);

		observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isSearching) {
					loadMore();
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

{#snippet filterFacets()}
	<div class="space-y-6">
		<!-- 1. Merek & Model -->
		<div>
			<label
				for="filter-make"
				class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2"
			>
				Merek & Model
			</label>
			<div class="space-y-2.5">
				<select
					id="filter-make"
					value={selectedMake}
					onchange={(e) => handleMakeChange(e.currentTarget.value)}
					class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none"
				>
					<option value="all">Semua Merek</option>
					{#each availableMakes as make (make)}
						<option value={make}>{make}</option>
					{/each}
				</select>

				{#if selectedMake !== "all"}
					<select
						aria-label="Pilih Model"
						value={selectedModel}
						disabled={isLoadingModels}
						onchange={(e) => {
							selectedModel = e.currentTarget.value;
							handleFilterChange();
						}}
						class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none disabled:opacity-60"
					>
						<option value="all">
							{isLoadingModels ? "Memuat model..." : "Semua Model"}
						</option>
						{#each availableModels as model (model)}
							<option value={model}>{model}</option>
						{/each}
					</select>
				{/if}
			</div>
		</div>

		<!-- 2. Kisaran Harga -->
		<div class="pt-5 border-t border-gray-100">
			<span class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
				Kisaran Harga
			</span>
			<div class="grid grid-cols-2 gap-2 mb-3">
				{#each pricePresets as preset (preset.value)}
					{@const active = selectedPrice === preset.value}
					<button
						type="button"
						onclick={() => selectPricePreset(preset.value)}
						class={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
							active
								? "bg-red-50 text-red-700 border-red-600"
								: "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
						}`}
					>
						{preset.label}
					</button>
				{/each}
			</div>
			<div class="grid grid-cols-2 gap-2">
				<input
					type="number"
					min="0"
					placeholder="Min (Jt)"
					bind:value={priceMinJuta}
					oninput={applyCustomPrice}
					class="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-red-600 outline-none"
				/>
				<input
					type="number"
					min="0"
					placeholder="Maks (Jt)"
					bind:value={priceMaxJuta}
					oninput={applyCustomPrice}
					class="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-red-600 outline-none"
				/>
			</div>
		</div>

		<!-- 3. Tipe Bodi -->
		<div class="pt-5 border-t border-gray-100">
			<span class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
				Tipe Bodi
			</span>
			<div class="flex flex-wrap gap-2">
				{#each bodyTypes as bt (bt)}
					{@const active = selectedBodyType === bt}
					<button
						type="button"
						onclick={() => toggleBodyType(bt)}
						class={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
							active
								? "bg-red-700 text-white border-red-700"
								: "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
						}`}
					>
						{bt}
					</button>
				{/each}
			</div>
		</div>

		<!-- 4. Transmisi -->
		<div class="pt-5 border-t border-gray-100">
			<span class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
				Transmisi
			</span>
			<div class="flex flex-wrap gap-2">
				{#each transmissions as tr (tr)}
					{@const active = selectedTransmission === tr}
					<button
						type="button"
						onclick={() => toggleTransmission(tr)}
						class={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
							active
								? "bg-red-700 text-white border-red-700"
								: "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
						}`}
					>
						{transmissionMap[tr] || tr}
					</button>
				{/each}
			</div>
		</div>

		<!-- 5. Bahan Bakar -->
		<div class="pt-5 border-t border-gray-100">
			<span class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
				Bahan Bakar
			</span>
			<div class="flex flex-wrap gap-2">
				{#each fuelTypes as ft (ft)}
					{@const active = selectedFuelType === ft}
					<button
						type="button"
						onclick={() => toggleFuelType(ft)}
						class={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
							active
								? "bg-red-700 text-white border-red-700"
								: "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
						}`}
					>
						{fuelTypeMap[ft] || ft}
					</button>
				{/each}
			</div>
		</div>

		<!-- 6. Tahun -->
		<div class="pt-5 border-t border-gray-100">
			<span class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
				Tahun Pembuatan
			</span>
			<div class="grid grid-cols-2 gap-2">
				<input
					type="number"
					min="1980"
					max="2030"
					placeholder="Dari"
					bind:value={yearFrom}
					oninput={handleDebouncedFilterChange}
					class="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-red-600 outline-none"
				/>
				<input
					type="number"
					min="1980"
					max="2030"
					placeholder="Sampai"
					bind:value={yearTo}
					oninput={handleDebouncedFilterChange}
					class="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-red-600 outline-none"
				/>
			</div>
		</div>
	</div>
{/snippet}

<!-- TOP CATALOG SEARCH & SORT BAR -->
<section class="bg-white border-b border-gray-200">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{#if promos && promos.length > 0}
			<PromoBannerCarousel {promos} />
		{/if}

		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
			<div>
				<h1 class="text-2xl sm:text-3xl font-bold text-gray-900 font-header">
					Katalog Mobil Bekas
				</h1>
				<p class="text-sm text-gray-500 mt-1">
					Pilihan unit terinspeksi bebas tabrak & banjir, harga transparan.
				</p>
			</div>

			<div class="flex items-center gap-2 text-sm">
				<span class="px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-semibold">
					{total} unit ditemukan
				</span>
			</div>
		</div>

		<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
			<!-- Search Input -->
			<div class="relative grow">
				<div
					class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400"
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
					oninput={handleDebouncedFilterChange}
					placeholder="Cari merek, model, atau tahun (contoh: Avanza, CR-V 2021)..."
					class="w-full pl-11 pr-10 py-3 bg-gray-50 text-gray-900 placeholder-gray-400 rounded-xl border border-gray-200 focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-sm sm:text-base outline-none transition"
				/>
				{#if searchQuery}
					<button
						type="button"
						onclick={clearSearch}
						class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-700 transition cursor-pointer"
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

			<div class="flex items-center gap-2.5 shrink-0">
				<!-- Mobile Filter Button -->
				<button
					type="button"
					onclick={() => (isMobileDrawerOpen = true)}
					class="lg:hidden inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold transition cursor-pointer"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="size-4 text-red-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
						/>
					</svg>
					<span>Filter</span>
					{#if activeFilterCount > 0}
						<span
							class="px-1.5 py-0.5 text-[11px] rounded-full bg-red-600 text-white font-bold leading-none"
						>
							{activeFilterCount}
						</span>
					{/if}
				</button>

				<!-- Sort Dropdown -->
				<div bind:this={sortDropdownRef} class="relative grow sm:grow-0">
					<button
						type="button"
						onclick={() => (isSortDropdownOpen = !isSortDropdownOpen)}
						aria-haspopup="listbox"
						aria-expanded={isSortDropdownOpen}
						class="w-full sm:w-auto inline-flex items-center justify-between gap-2.5 px-4 py-3 bg-white hover:bg-gray-50 text-gray-800 rounded-xl border border-gray-200 focus:border-red-600 text-sm font-semibold outline-none transition cursor-pointer whitespace-nowrap"
					>
						<span class="truncate">
							<span class="text-gray-400 font-normal">Urutkan:</span>
							{activeSortLabel}
						</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class={`size-4 text-gray-400 transition-transform duration-200 shrink-0 ${isSortDropdownOpen ? "rotate-180 text-gray-700" : ""}`}
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

					{#if isSortDropdownOpen}
						<div
							role="listbox"
							class="absolute right-0 top-full mt-2 w-full sm:w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 z-40"
						>
							{#each sortOptions as option (option.value)}
								{@const isSelected = selectedSort === option.value}
								<button
									type="button"
									role="option"
									aria-selected={isSelected}
									onclick={() => selectSort(option.value)}
									class={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer text-left ${
										isSelected
											? "bg-red-50 text-red-700 font-bold"
											: "text-gray-700 hover:bg-gray-50"
									}`}
								>
									<span>{option.label}</span>
									{#if isSelected}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="size-4 text-red-600"
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
		</div>

		<!-- Active Filter Chips -->
		{#if activeChips.length > 0}
			<div class="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
				{#each activeChips as chip (chip.key)}
					<button
						type="button"
						onclick={chip.clear}
						class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 transition cursor-pointer"
					>
						<span>{chip.label}</span>
						<span aria-hidden="true" class="text-red-500 font-bold">×</span>
					</button>
				{/each}
				<button
					type="button"
					onclick={resetFilters}
					class="text-xs font-semibold text-gray-500 hover:text-red-700 underline ml-1 cursor-pointer"
				>
					Reset Semua
				</button>
			</div>
		{/if}
	</div>
</section>

<!-- MAIN CATALOG WORKSPACE: SIDEBAR + GRID -->
<section class="bg-gray-50 py-8 lg:py-10 min-h-[650px]">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex flex-col lg:flex-row gap-8 items-start">
			<!-- Left Sticky Sidebar (Desktop) -->
			<aside
				class="hidden lg:block w-72 shrink-0 sticky top-6 bg-white rounded-2xl border border-gray-200 p-5 shadow-xs"
			>
				<div class="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
					<h2 class="text-base font-bold text-gray-900 font-header">Filter Pencarian</h2>
					{#if activeFilterCount > 0}
						<button
							type="button"
							onclick={resetFilters}
							class="text-xs font-semibold text-red-700 hover:underline cursor-pointer"
						>
							Reset
						</button>
					{/if}
				</div>
				{@render filterFacets()}
			</aside>

			<!-- Vehicle Results Grid -->
			<div class="flex-1 min-w-0 w-full">
				{#if isSearching}
					<div
						class="mb-4 flex items-center gap-2 text-xs text-red-700 font-semibold animate-pulse"
					>
						<svg
							class="animate-spin size-4 text-red-700"
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
						<span>Memperbarui hasil...</span>
					</div>
				{/if}

				{#if cars.length > 0}
					<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
						{#each cars as car (car.id)}
							{@const isSold = car.archiveReason === "sold"}
							{@const rawMileage = car.mileage ?? 0}
							{@const formattedMileage = getMileage(rawMileage)}
							{@const transmissionLabel =
								transmissionMap[car.transmission || ""] || car.transmission}
							{@const fuelLabel = fuelTypeMap[car.fuelType || ""] || car.fuelType}

							<article
								data-car-id={car.id}
								class={`group bg-white rounded-2xl shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200/90 flex flex-col h-full hover:border-red-600 ${isSold ? "opacity-80" : ""}`}
							>
								<a href={`/view/${car.id}`} class="flex flex-col h-full">
									<CarImageSlider gallery={car.gallery} title={car.title} {isSold} carId={car.id} />

									<div class="p-5 flex flex-col grow">
										<div class="h-12 flex items-start mb-2 overflow-hidden">
											<h2
												class="car-card-title text-base font-bold text-gray-900 group-hover:text-red-700 transition-colors line-clamp-2 leading-snug"
											>
												{car.title}
											</h2>
										</div>

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

										<div class="mb-4 flex items-baseline gap-2 flex-wrap min-h-[1.75rem]">
											{#if car.promoPrice && car.promoPrice < car.price}
												<span class="text-xs text-gray-400 line-through font-medium">
													{getPrice(car.price)}
												</span>
												<span class="text-lg font-bold text-red-700 tracking-tight font-inter">
													{getPrice(car.promoPrice)}
												</span>
											{:else}
												<span class="text-lg font-bold text-gray-900 tracking-tight font-inter">
													{getPrice(car.price)}
												</span>
											{/if}
										</div>

										<div
											class="mt-auto pt-3 border-t border-gray-100 flex flex-wrap items-center gap-1.5"
										>
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

											{#if car.ownershipStatus === "first_hand"}
												<span
													class="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200/60"
												>
													Tangan Pertama
												</span>
											{/if}

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

					{#if isLoadingMore}
						<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
							{#each Array(3) as _, i (i)}
								<div
									class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs animate-pulse"
								>
									<div class="aspect-[4/3] bg-gray-200"></div>
									<div class="p-5 space-y-3">
										<div class="h-5 bg-gray-200 rounded w-3/4"></div>
										<div class="h-4 bg-gray-100 rounded w-1/2"></div>
										<div class="h-6 bg-gray-200 rounded w-2/3"></div>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					{#if hasMore}
						<div
							bind:this={sentinelElement}
							class="flex flex-col items-center justify-center my-10 gap-3"
						>
							{#if !isLoadingMore}
								<button
									type="button"
									onclick={loadMore}
									class="px-6 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-800 shadow-xs transition cursor-pointer"
								>
									Muat Lebih Banyak
								</button>
							{/if}
						</div>
					{:else}
						<div class="mt-10 mb-4 text-center">
							<div
								class="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-gray-200 shadow-xs text-gray-500 text-xs sm:text-sm font-semibold"
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
					<div
						class="max-w-md mx-auto my-12 p-8 text-center bg-white rounded-2xl border border-gray-200 shadow-xs"
					>
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
		</div>
	</div>
</section>

<!-- MOBILE SLIDE-OVER FILTER DRAWER -->
{#if isMobileDrawerOpen}
	<div
		class="fixed inset-0 z-50 lg:hidden"
		role="dialog"
		aria-modal="true"
		aria-label="Filter Mobil"
	>
		<button
			type="button"
			aria-label="Tutup filter"
			onclick={() => (isMobileDrawerOpen = false)}
			class="fixed inset-0 bg-black/50 backdrop-blur-xs"
		></button>
		<div class="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl flex flex-col">
			<div class="flex items-center justify-between px-5 py-4 border-b border-gray-200">
				<h2 class="text-base font-bold text-gray-900 font-header">Filter Pencarian</h2>
				<button
					type="button"
					onclick={() => (isMobileDrawerOpen = false)}
					class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
					aria-label="Tutup"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="size-5"
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

			<div class="flex-1 overflow-y-auto p-5">
				{@render filterFacets()}
			</div>

			<div class="p-4 border-t border-gray-200 flex items-center gap-3 bg-gray-50">
				<button
					type="button"
					onclick={resetFilters}
					class="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 cursor-pointer"
				>
					Reset
				</button>
				<button
					type="button"
					onclick={() => (isMobileDrawerOpen = false)}
					class="flex-1 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-bold cursor-pointer"
				>
					Tampilkan {total} Unit
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(.car-card-title) {
		font-size: 1rem !important;
		line-height: 1.375rem !important;
	}
</style>
