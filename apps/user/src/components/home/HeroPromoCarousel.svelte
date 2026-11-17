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
	let selectedIndex = $state(0);

	onMount(() => {
		if (!emblaNode || promos.length <= 1) return;

		emblaApi = EmblaCarousel(
			emblaNode,
			{
				loop: true,
				align: "start",
			},
			[Autoplay({ delay: 5000, stopOnInteraction: true })],
		);

		const onSelect = () => {
			if (!emblaApi) return;
			selectedIndex = emblaApi.selectedScrollSnap();
		};

		emblaApi.on("select", onSelect);
		emblaApi.on("reInit", onSelect);
		onSelect();

		return () => {
			if (emblaApi) {
				emblaApi.destroy();
			}
		};
	});

	function scrollPrev() {
		emblaApi?.scrollPrev();
	}

	function scrollNext() {
		emblaApi?.scrollNext();
	}

	function scrollTo(idx: number) {
		emblaApi?.scrollTo(idx);
	}
</script>

{#if promos && promos.length > 0}
	<div class="relative w-full bg-gray-950 overflow-hidden">
		{#if promos.length === 1}
			<a
				href={`/promo/${promos[0].slug}`}
				class="block relative w-full aspect-[16/9] sm:aspect-[2.5/1] lg:aspect-[3/1] max-h-[460px] group"
			>
				<img
					src={promos[0].bannerImage}
					alt={promos[0].title}
					class="size-full object-cover transition-transform duration-700 group-hover:scale-[1.01]"
				/>
				<div
					class="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none"
				></div>
			</a>
		{:else}
			<div bind:this={emblaNode} class="overflow-hidden w-full">
				<div class="flex touch-pan-y">
					{#each promos as promo (promo.id)}
						<div class="min-w-0 flex-[0_0_100%]">
							<a
								href={`/promo/${promo.slug}`}
								class="block relative w-full aspect-[16/9] sm:aspect-[2.5/1] lg:aspect-[3/1] max-h-[460px] group"
							>
								<img
									src={promo.bannerImage}
									alt={promo.title}
									class="size-full object-cover transition-transform duration-700 group-hover:scale-[1.01]"
								/>
								<div
									class="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none"
								></div>
							</a>
						</div>
					{/each}
				</div>
			</div>

			<!-- Prev / Next Arrows (Desktop) -->
			<button
				type="button"
				onclick={scrollPrev}
				aria-label="Promo sebelumnya"
				class="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-black/45 hover:bg-black/70 text-white border border-white/20 items-center justify-center backdrop-blur-xs transition cursor-pointer"
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

			<button
				type="button"
				onclick={scrollNext}
				aria-label="Promo berikutnya"
				class="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-black/45 hover:bg-black/70 text-white border border-white/20 items-center justify-center backdrop-blur-xs transition cursor-pointer"
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

			<!-- Slide Dot Indicators -->
			<div
				class="absolute bottom-3 sm:bottom-14 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-xs"
			>
				{#each promos as promo, idx (promo.id)}
					<button
						type="button"
						onclick={() => scrollTo(idx)}
						aria-label={`Pilih promo ${idx + 1}`}
						class={`h-1.5 rounded-full transition-all cursor-pointer ${
							selectedIndex === idx ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
						}`}
					></button>
				{/each}
			</div>
		{/if}
	</div>
{/if}
