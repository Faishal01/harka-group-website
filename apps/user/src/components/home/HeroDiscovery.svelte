<script lang="ts">
	import { bodyTypes } from "~/data/constants";

	interface Props {
		availableMakes?: string[];
	}

	let { availableMakes = [] }: Props = $props();

	let activeTab = $state<"buy" | "sell">("buy");
	let searchQuery = $state("");

	const priceShortcuts = [
		{ label: "< 150 Jt", value: "0-150000000" },
		{ label: "150–250 Jt", value: "150000000-250000000" },
		{ label: "250–400 Jt", value: "250000000-400000000" },
		{ label: "> 400 Jt", value: "400000000-" },
	];
</script>

<div class="bg-white rounded-2xl border border-gray-200/90 shadow-lg overflow-hidden">
	<!-- Top Mode Tabs (Desktop only: Beli Mobil | Jual / Tukar Tambah) -->
	<div class="hidden sm:grid grid-cols-2 border-b border-gray-200 bg-gray-50/70">
		<button
			type="button"
			onclick={() => (activeTab = "buy")}
			class={`py-3.5 px-4 text-sm sm:text-base font-bold transition cursor-pointer border-b-2 ${
				activeTab === "buy"
					? "bg-white text-red-700 border-red-700"
					: "text-gray-600 hover:text-gray-900 border-transparent"
			}`}
		>
			Beli Mobil
		</button>
		<button
			type="button"
			onclick={() => (activeTab = "sell")}
			class={`py-3.5 px-4 text-sm sm:text-base font-bold transition cursor-pointer border-b-2 ${
				activeTab === "sell"
					? "bg-white text-red-700 border-red-700"
					: "text-gray-600 hover:text-gray-900 border-transparent"
			}`}
		>
			Jual / Tukar Tambah
		</button>
	</div>

	{#if activeTab === "buy"}
		<div class="p-4 sm:p-6 lg:p-7 space-y-4 sm:space-y-5">
			<!-- Search Form -> /cars?search=... -->
			<form action="/cars" method="GET" class="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
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
						name="search"
						bind:value={searchQuery}
						placeholder="Cari merek, model, atau tahun (contoh: Avanza, CR-V 2021)..."
						class="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-gray-50 text-gray-900 placeholder-gray-400 rounded-xl border border-gray-200 focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-sm sm:text-base outline-none transition"
					/>
				</div>
				<button
					type="submit"
					class="hidden sm:inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-base shadow-sm transition cursor-pointer shrink-0"
				>
					Cari Mobil
				</button>
			</form>

			<!-- Mobile Quick Action Shortcuts (Carsome-style Beli Mobil / Jual & Tukar) -->
			<div class="grid grid-cols-2 gap-2.5 sm:hidden">
				<a
					href="/cars"
					class="inline-flex items-center justify-center px-4 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-xs transition text-center"
				>
					Beli Mobil
				</a>
				<a
					href="/trade-in"
					class="inline-flex items-center justify-center px-4 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 font-bold text-sm transition text-center"
				>
					Jual / Tukar
				</a>
			</div>

			<!-- Quick Discovery Shortcuts (Desktop only) -->
			<div class="hidden sm:block space-y-3 pt-1">
				{#if availableMakes.length > 0}
					<div class="flex items-start sm:items-center gap-2.5 flex-wrap">
						<span class="text-xs font-bold uppercase tracking-wider text-gray-400 w-24 shrink-0">
							Merek
						</span>
						<div class="flex items-center gap-1.5 flex-wrap flex-1">
							{#each availableMakes as make (make)}
								<a
									href={`/cars?make=${encodeURIComponent(make)}`}
									class="px-3 py-1 rounded-full bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 border border-transparent hover:border-red-200 text-xs font-semibold transition"
								>
									{make}
								</a>
							{/each}
						</div>
					</div>
				{/if}

				<div class="flex items-start sm:items-center gap-2.5 flex-wrap">
					<span class="text-xs font-bold uppercase tracking-wider text-gray-400 w-24 shrink-0">
						Tipe Bodi
					</span>
					<div class="flex items-center gap-1.5 flex-wrap flex-1">
						{#each bodyTypes as bt (bt)}
							<a
								href={`/cars?bodyType=${encodeURIComponent(bt)}`}
								class="px-3 py-1 rounded-full bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 border border-transparent hover:border-red-200 text-xs font-semibold transition"
							>
								{bt}
							</a>
						{/each}
					</div>
				</div>

				<div class="flex items-start sm:items-center gap-2.5 flex-wrap">
					<span class="text-xs font-bold uppercase tracking-wider text-gray-400 w-24 shrink-0">
						Harga
					</span>
					<div class="flex items-center gap-1.5 flex-wrap flex-1">
						{#each priceShortcuts as preset (preset.value)}
							<a
								href={`/cars?price=${encodeURIComponent(preset.value)}`}
								class="px-3 py-1 rounded-full bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 border border-transparent hover:border-red-200 text-xs font-semibold transition"
							>
								{preset.label}
							</a>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Sell / Trade-In Quick Tab -->
		<div class="p-5 sm:p-6 lg:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
			<div class="space-y-1.5 max-w-xl">
				<h2 class="text-lg sm:text-xl font-bold text-gray-900 font-header">
					Jual atau Tukar Tambah Mobil Anda dengan Mudah
				</h2>
				<p class="text-sm text-gray-600 leading-relaxed">
					Dapatkan estimasi harga transparan, inspeksi profesional, dan proses pembayaran cepat
					bersama tim Harka Autocar.
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-3 shrink-0">
				<a
					href="/trade-in?type=sell"
					class="px-5 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 text-sm font-bold transition"
				>
					Jual Mobil
				</a>
				<a
					href="/trade-in?type=trade_in"
					class="px-5 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-bold shadow-sm transition"
				>
					Tukar Tambah
				</a>
			</div>
		</div>
	{/if}
</div>
