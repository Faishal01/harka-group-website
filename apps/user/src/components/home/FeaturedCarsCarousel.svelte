<script lang="ts">
	import EmblaCarousel, { type EmblaCarouselType } from "embla-carousel";
	import type { Car } from "~/types";
	import { getPrice, getMileage, getMileageUnit } from "~/utils/helpers";
	import { transmissionMap, fuelTypeMap } from "~/data/constants";

	interface Props {
		cars?: Car[];
		onViewMore?: () => void;
		viewMoreHref?: string;
	}

	let { cars = [], onViewMore, viewMoreHref = "/cars" }: Props = $props();

	let emblaNode = $state<HTMLElement | null>(null);
	let emblaApi: EmblaCarouselType | null = null;
	let canScrollPrev = $state(false);
	let canScrollNext = $state(false);

	const mileageUnit = getMileageUnit();

	const trustHighlights = [
		"Bebas Banjir & Tabrak",
		"Inspeksi Menyeluruh",
		"Dokumen Terjamin",
		"Harga Transparan",
	];

	$effect(() => {
		if (!emblaNode || cars.length === 0) {
			canScrollPrev = false;
			canScrollNext = false;
			return;
		}

		const api = EmblaCarousel(emblaNode, {
			align: "start",
			containScroll: "trimSnaps",
			dragFree: true,
		});
		emblaApi = api;

		const updateButtons = () => {
			canScrollPrev = api.canScrollPrev();
			canScrollNext = api.canScrollNext();
		};

		api.on("select", updateButtons);
		api.on("reInit", updateButtons);
		updateButtons();

		let lastWheelAt = 0;
		const handleWheel = (e: WheelEvent) => {
			const absX = Math.abs(e.deltaX);
			const absY = Math.abs(e.deltaY);
			const isHorizontal = absX > absY && absX > 2;
			const isShiftScroll = e.shiftKey && absY > 2;
			if (!isHorizontal && !isShiftScroll) return;

			e.preventDefault();
			const now = Date.now();
			if (now - lastWheelAt < 220) return;
			lastWheelAt = now;

			const delta = isHorizontal ? e.deltaX : e.deltaY;
			if (delta > 0) {
				api.scrollNext();
			} else {
				api.scrollPrev();
			}
		};

		const node = emblaNode;
		node.addEventListener("wheel", handleWheel, { passive: false });

		return () => {
			node.removeEventListener("wheel", handleWheel);
			api.destroy();
			if (emblaApi === api) {
				emblaApi = null;
			}
		};
	});

	function scrollPrev() {
		emblaApi?.scrollPrev();
	}

	function scrollNext() {
		emblaApi?.scrollNext();
	}
</script>

{#if cars.length > 0}
	<section
		aria-label="Unit Terbaru Harka"
		class="bg-gradient-to-br from-red-950 via-gray-900 to-gray-950 border-b border-red-900/40 py-8 sm:py-10 text-white"
	>
		<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
			<!-- Header -->
			<div class="flex items-end justify-between gap-4 mb-4">
				<div>
					<div class="flex items-center gap-2 mb-1">
						<span class="inline-block size-2 rounded-full bg-red-500"></span>
						<span class="text-xs font-bold uppercase tracking-wider text-red-300">
							Baru Masuk Showroom
						</span>
					</div>
					<h2 class="text-xl sm:text-2xl font-bold text-white font-header">Unit Terbaru Harka</h2>
				</div>
				{#if viewMoreHref}
					<a
						href={viewMoreHref}
						class="text-xs sm:text-sm font-bold text-red-300 hover:text-white transition shrink-0"
					>
						Lihat Semua Stok →
					</a>
				{/if}
			</div>

			<!-- Trust Highlights -->
			<div
				class="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6 text-xs sm:text-sm text-gray-200"
			>
				{#each trustHighlights as highlight (highlight)}
					<div class="inline-flex items-center gap-1.5 font-medium">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="size-4 text-emerald-400 shrink-0"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>{highlight}</span>
					</div>
				{/each}
			</div>

			<!-- Carousel Track with Side Arrows (Full-bleed on mobile) -->
			<div class="relative">
				{#if canScrollPrev}
					<button
						type="button"
						onclick={scrollPrev}
						aria-label="Unit sebelumnya"
						class="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full border border-white/25 bg-gray-950/85 hover:bg-red-700 hover:border-red-500 backdrop-blur-sm items-center justify-center text-white transition shadow-lg cursor-pointer"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="size-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				{/if}

				{#if canScrollNext}
					<button
						type="button"
						onclick={scrollNext}
						aria-label="Unit berikutnya"
						class="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full border border-white/25 bg-gray-950/85 hover:bg-red-700 hover:border-red-500 backdrop-blur-sm items-center justify-center text-white transition shadow-lg cursor-pointer"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="size-5"
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
				{/if}

				<div
					bind:this={emblaNode}
					class="-mx-4 sm:mx-0 overflow-hidden cursor-grab active:cursor-grabbing"
				>
					<div
						class="flex gap-4 touch-pan-y pl-4 sm:pl-0 after:content-[''] after:shrink-0 after:w-px sm:after:hidden"
					>
						{#each cars as car (car.id)}
							{@const coverImage = car.gallery?.[0]?.image}
							{@const coverAlt = car.gallery?.[0]?.alt || car.title}
							{@const formattedMileage = getMileage(car.mileage ?? 0)}
							{@const transmissionLabel =
								transmissionMap[car.transmission || ""] || car.transmission}
							{@const fuelLabel = fuelTypeMap[car.fuelType || ""] || car.fuelType}

							<article
								class="min-w-0 flex-[0_0_265px] sm:flex-[0_0_285px] bg-white rounded-2xl border border-gray-200/90 hover:border-red-600 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col"
							>
								<a href={`/view/${car.id}`} class="flex flex-col h-full">
									<!-- Single Cover Image -->
									<div class="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
										{#if coverImage}
											<img
												src={coverImage}
												alt={coverAlt}
												loading="lazy"
												decoding="async"
												class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
											/>
										{:else}
											<div
												class="size-full flex items-center justify-center text-gray-400 text-xs font-medium"
											>
												Foto Segera Hadir
											</div>
										{/if}

										{#if car.promoPrice && car.promoPrice < car.price}
											<span
												class="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wide shadow-sm"
											>
												Promo
											</span>
										{/if}
									</div>

									<!-- Card Body -->
									<div class="p-4 flex flex-col grow">
										<div class="h-11 flex items-start mb-1.5 overflow-hidden">
											<h3
												class="text-sm sm:text-base font-bold text-gray-900 group-hover:text-red-700 transition-colors line-clamp-2 leading-snug"
											>
												{car.title}
											</h3>
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

										<div class="mt-auto flex items-baseline gap-2 flex-wrap">
											{#if car.promoPrice && car.promoPrice < car.price}
												<span class="text-xs text-gray-400 line-through font-medium">
													{getPrice(car.price)}
												</span>
												<span
													class="text-base sm:text-lg font-bold text-red-700 tracking-tight font-inter"
												>
													{getPrice(car.promoPrice)}
												</span>
											{:else}
												<span
													class="text-base sm:text-lg font-bold text-gray-900 tracking-tight font-inter"
												>
													{getPrice(car.price)}
												</span>
											{/if}
										</div>
									</div>
								</a>
							</article>
						{/each}

						{#if onViewMore}
							<div class="min-w-0 flex-[0_0_265px] sm:flex-[0_0_285px] flex">
								<button
									type="button"
									onclick={onViewMore}
									class="w-full rounded-2xl border border-dashed border-white/25 bg-white/10 hover:bg-white/15 hover:border-red-400 transition-all duration-300 p-6 flex flex-col items-center justify-center text-center gap-3 group cursor-pointer shadow-xs hover:shadow-lg backdrop-blur-xs"
								>
									<span
										class="size-12 rounded-full bg-white/15 border border-white/20 group-hover:border-red-400 group-hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-xs"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="size-5"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
												clip-rule="evenodd"
											/>
										</svg>
									</span>
									<div>
										<p
											class="text-base font-bold text-white group-hover:text-red-300 transition-colors"
										>
											Lihat Semua Stok
										</p>
										<p class="text-xs text-gray-300 mt-1">
											Jelajahi seluruh unit tersedia di bawah
										</p>
									</div>
								</button>
							</div>
						{:else if viewMoreHref}
							<div class="min-w-0 flex-[0_0_265px] sm:flex-[0_0_285px] flex">
								<a
									href={viewMoreHref}
									class="w-full rounded-2xl border border-dashed border-white/25 bg-white/10 hover:bg-white/15 hover:border-red-400 transition-all duration-300 p-6 flex flex-col items-center justify-center text-center gap-3 group shadow-xs hover:shadow-lg backdrop-blur-xs"
								>
									<span
										class="size-12 rounded-full bg-white/15 border border-white/20 group-hover:border-red-400 group-hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-xs"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="size-5"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
												clip-rule="evenodd"
											/>
										</svg>
									</span>
									<div>
										<p
											class="text-base font-bold text-white group-hover:text-red-300 transition-colors"
										>
											Lihat Semua Stok
										</p>
										<p class="text-xs text-gray-300 mt-1">Jelajahi katalog lengkap dengan filter</p>
									</div>
								</a>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</section>
{/if}
