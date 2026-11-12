<script lang="ts">
	import { onMount } from "svelte";
	import EmblaCarousel, { type EmblaCarouselType } from "embla-carousel";
	import Autoplay from "embla-carousel-autoplay";
	import type { Promo } from "@harka/db";

	interface Props {
		promos?: Promo[];
	}

	let { promos = [] }: Props = $props();

	let emblaNode = $state<HTMLElement | null>(null);
	let emblaApi: EmblaCarouselType | null = null;
	let canScrollPrev = $state(false);
	let canScrollNext = $state(false);

	onMount(() => {
		if (!emblaNode || promos.length <= 1) return;

		emblaApi = EmblaCarousel(
			emblaNode,
			{
				align: "start",
				containScroll: "trimSnaps",
				dragFree: false,
			},
			promos.length > 2 ? [Autoplay({ delay: 5000, stopOnInteraction: true })] : [],
		);

		const updateButtons = () => {
			if (!emblaApi) return;
			canScrollPrev = emblaApi.canScrollPrev();
			canScrollNext = emblaApi.canScrollNext();
		};

		emblaApi.on("select", updateButtons);
		emblaApi.on("reInit", updateButtons);
		updateButtons();

		return () => {
			if (emblaApi) {
				emblaApi.destroy();
			}
		};
	});

	function scrollPrev() {
		if (emblaApi) emblaApi.scrollPrev();
	}

	function scrollNext() {
		if (emblaApi) emblaApi.scrollNext();
	}
</script>

{#if promos && promos.length > 0}
	<div class="w-full mb-6 relative">
		<!-- Section Label / Subtitle & Controls -->
		<div class="flex items-center justify-between mb-2.5">
			<div class="flex items-center gap-2">
				<span class="inline-block size-2 rounded-full bg-red-500 animate-pulse"></span>
				<span class="text-xs font-bold uppercase tracking-wider text-gray-400">
					Promo & Program Spesial
				</span>
			</div>

			<!-- Navigation controls (visible if scrollable) -->
			{#if promos.length > 1 && (canScrollPrev || canScrollNext)}
				<div class="hidden sm:flex items-center gap-1.5">
					<button
						type="button"
						onclick={scrollPrev}
						disabled={!canScrollPrev}
						aria-label="Promo sebelumnya"
						class="size-7 rounded-lg border border-gray-800 bg-gray-900/80 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-gray-300 hover:text-white transition shadow-xs cursor-pointer"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="size-3.5"
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
					<button
						type="button"
						onclick={scrollNext}
						disabled={!canScrollNext}
						aria-label="Promo berikutnya"
						class="size-7 rounded-lg border border-gray-800 bg-gray-900/80 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-gray-300 hover:text-white transition shadow-xs cursor-pointer"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="size-3.5"
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
			{/if}
		</div>

		<!-- Single promo display -->
		{#if promos.length === 1}
			<div class="flex items-center">
				<a
					href={`/promo/${promos[0].slug}`}
					class="block relative rounded-xl overflow-hidden border border-gray-800 hover:border-red-600/60 shadow-lg group w-[280px] sm:w-[320px] aspect-[2.5/1] bg-gray-900 transition-all duration-300 hover:scale-[1.01]"
				>
					<img
						src={promos[0].bannerImage}
						alt={promos[0].title}
						class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
					/>
					<div
						class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
					></div>
				</a>
			</div>
		{:else}
			<!-- Multi-card carousel (Carsome style strip) -->
			<div bind:this={emblaNode} class="overflow-hidden">
				<div class="flex gap-3 touch-pan-y">
					{#each promos as promo (promo.id)}
						<div class="min-w-0 flex-[0_0_260px] sm:flex-[0_0_280px]">
							<a
								href={`/promo/${promo.slug}`}
								class="block relative rounded-xl overflow-hidden border border-gray-800 hover:border-red-600/60 shadow-lg group aspect-[2.5/1] bg-gray-900 transition-all duration-300 hover:scale-[1.02]"
							>
								<img
									src={promo.bannerImage}
									alt={promo.title}
									class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
								/>
								<div
									class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
								></div>
							</a>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
