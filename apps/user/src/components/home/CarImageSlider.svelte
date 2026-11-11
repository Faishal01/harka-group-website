<script lang="ts">
	import { SvelteSet } from "svelte/reactivity";

	interface Props {
		gallery: { image: string; alt?: string }[] | null;
		title: string;
		isSold: boolean;
		carId?: string;
	}

	let { gallery, title, isSold }: Props = $props();

	let currentIndex = $state(0);
	let outgoingIndex = $state<number | null>(null);
	let isSliding = $state(false);
	let slideDirection = $state<"next" | "prev">("next");

	let isPending = $state(false);
	let showSpinner = $state(false);

	const images = $derived(gallery && gallery.length > 0 ? gallery : []);
	const total = $derived(images.length);
	const hasMultiple = $derived(total > 1);

	// In-memory set of URLs already downloaded
	const prefetchedUrls = new SvelteSet<string>();

	// Seed with the initial image once available
	$effect(() => {
		if (images[0]?.image && !prefetchedUrls.has(images[0].image)) {
			prefetchedUrls.add(images[0].image);
		}
	});

	let spinnerTimer: ReturnType<typeof setTimeout> | null = null;
	let slideSafetyTimer: ReturnType<typeof setTimeout> | null = null;

	function prefetch(url?: string) {
		if (!url || prefetchedUrls.has(url)) return;
		prefetchedUrls.add(url);
		const img = new Image();
		img.src = url;
	}

	function prefetchAdjacent(index: number) {
		if (!hasMultiple) return;
		const nextIdx = (index + 1) % total;
		const prevIdx = (index - 1 + total) % total;
		if (images[nextIdx]?.image) prefetch(images[nextIdx].image);
		if (images[prevIdx]?.image) prefetch(images[prevIdx].image);
	}

	function startSlide(newIndex: number, direction: "next" | "prev") {
		outgoingIndex = currentIndex;
		slideDirection = direction;
		currentIndex = newIndex;
		isSliding = true;

		// Failsafe timer: ensure isSliding is cleared even if browser minimizes or drops animationend
		if (slideSafetyTimer) clearTimeout(slideSafetyTimer);
		slideSafetyTimer = setTimeout(() => {
			if (isSliding) {
				outgoingIndex = null;
				isSliding = false;
			}
		}, 400);
	}

	function finishSlide(e: AnimationEvent) {
		if (e.target !== e.currentTarget) return;
		if (slideSafetyTimer) clearTimeout(slideSafetyTimer);
		outgoingIndex = null;
		isSliding = false;
	}

	function switchImage(newIndex: number, direction?: "next" | "prev") {
		if (isSliding || newIndex === currentIndex || newIndex < 0 || newIndex >= total) return;

		const dir = direction ?? (newIndex > currentIndex ? "next" : "prev");
		const targetUrl = images[newIndex]?.image;
		if (!targetUrl) return;

		if (prefetchedUrls.has(targetUrl)) {
			isPending = false;
			showSpinner = false;
			if (spinnerTimer) clearTimeout(spinnerTimer);
			startSlide(newIndex, dir);
			prefetchAdjacent(newIndex);
			return;
		}

		isPending = true;
		if (spinnerTimer) clearTimeout(spinnerTimer);
		spinnerTimer = setTimeout(() => {
			if (isPending) showSpinner = true;
		}, 150);

		const img = new Image();
		img.src = targetUrl;
		img.onload = () => {
			prefetchedUrls.add(targetUrl);
			isPending = false;
			showSpinner = false;
			if (spinnerTimer) clearTimeout(spinnerTimer);
			startSlide(newIndex, dir);
			prefetchAdjacent(newIndex);
		};
		img.onerror = () => {
			isPending = false;
			showSpinner = false;
			if (spinnerTimer) clearTimeout(spinnerTimer);
			startSlide(newIndex, dir);
		};
	}

	function handlePrev(e: MouseEvent | TouchEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (isSliding) return;
		const newIdx = (currentIndex - 1 + total) % total;
		switchImage(newIdx, "prev");
	}

	function handleNext(e: MouseEvent | TouchEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (isSliding) return;
		const newIdx = (currentIndex + 1) % total;
		switchImage(newIdx, "next");
	}

	function handleGoTo(index: number, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (isSliding || index === currentIndex) return;
		const dir = index > currentIndex ? "next" : "prev";
		switchImage(index, dir);
	}

	// Touch swipe detection for mobile
	let touchStartX = 0;
	let touchStartY = 0;

	function handleTouchStart(e: TouchEvent) {
		if (!hasMultiple || isSliding) return;
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
		prefetchAdjacent(currentIndex);
	}

	function handleTouchEnd(e: TouchEvent) {
		if (!hasMultiple || isSliding) return;
		const diffX = touchStartX - e.changedTouches[0].clientX;
		const diffY = touchStartY - e.changedTouches[0].clientY;

		// Horizontal swipe check (>35px threshold and dominant horizontal direction)
		if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
			if (diffX > 0) {
				handleNext(e);
			} else {
				handlePrev(e);
			}
		}
	}

	function handleMouseEnter() {
		prefetchAdjacent(currentIndex);
	}
</script>

<div
	class="relative aspect-[4/3] bg-gray-100 overflow-hidden shrink-0 select-none group/slider"
	onmouseenter={handleMouseEnter}
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
	role="region"
	aria-label={`Galeri foto ${title}`}
>
	{#if images.length > 0 && images[currentIndex]?.image}
		<!-- Outgoing Slide during transition -->
		{#if outgoingIndex !== null && images[outgoingIndex]?.image}
			<div
				class="absolute inset-0 w-full h-full pointer-events-none z-10 {slideDirection === 'next'
					? 'slide-out-left'
					: 'slide-out-right'}"
			>
				<img
					src={images[outgoingIndex].image}
					alt={images[outgoingIndex].alt || title}
					class="w-full h-full object-cover"
				/>
			</div>
		{/if}

		<!-- Active / Incoming Slide -->
		<div
			class="absolute inset-0 w-full h-full {isSliding
				? (slideDirection === 'next' ? 'slide-in-right' : 'slide-in-left') + ' z-10'
				: 'z-0'}"
			onanimationend={finishSlide}
		>
			<img
				src={images[currentIndex].image}
				alt={images[currentIndex].alt || title}
				loading="lazy"
				class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
			/>
		</div>

		<!-- Loading Spinner Overlay (only shown if loading exceeds 150ms) -->
		{#if showSpinner}
			<div
				class="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-20 transition-opacity"
			>
				<div class="size-6 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
			</div>
		{/if}

		<!-- Counter Badge in Top-Right Corner -->
		{#if hasMultiple}
			<div
				class="absolute top-2.5 right-2.5 z-25 px-2 py-0.5 rounded-md bg-gray-950/70 backdrop-blur-xs text-white text-[11px] font-semibold tracking-wide pointer-events-none opacity-0 group-hover/slider:opacity-100 max-sm:opacity-80 transition-opacity"
			>
				{currentIndex + 1}/{total}
			</div>
		{/if}

		<!-- Chevron Navigation Buttons (Visible on desktop hover, always touchable on mobile) -->
		{#if hasMultiple}
			<!-- Prev Button -->
			<button
				type="button"
				onclick={handlePrev}
				aria-label="Foto sebelumnya"
				class="absolute left-2 top-1/2 -translate-y-1/2 z-30 size-8 rounded-full bg-gray-950/70 hover:bg-black text-white backdrop-blur-xs flex items-center justify-center opacity-0 group-hover/slider:opacity-100 max-sm:opacity-75 transition hover:scale-110 active:scale-95 cursor-pointer shadow-md"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="size-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
				</svg>
			</button>

			<!-- Next Button -->
			<button
				type="button"
				onclick={handleNext}
				aria-label="Foto selanjutnya"
				class="absolute right-2 top-1/2 -translate-y-1/2 z-30 size-8 rounded-full bg-gray-950/70 hover:bg-black text-white backdrop-blur-xs flex items-center justify-center opacity-0 group-hover/slider:opacity-100 max-sm:opacity-75 transition hover:scale-110 active:scale-95 cursor-pointer shadow-md"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="size-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
				</svg>
			</button>

			<!-- Pagination Dots -->
			<div
				class="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 max-w-[85%] flex items-center gap-1 px-2 py-1 rounded-full bg-gray-950/50 backdrop-blur-xs pointer-events-auto"
			>
				{#each images as _, i (i)}
					<button
						type="button"
						onclick={(e) => handleGoTo(i, e)}
						aria-label={`Lihat foto ${i + 1}`}
						class={`rounded-full transition-all duration-200 cursor-pointer ${
							i === currentIndex
								? "w-3.5 h-1.5 bg-white shadow-xs"
								: "size-1.5 bg-white/50 hover:bg-white/80"
						}`}
					></button>
				{/each}
			</div>
		{/if}
	{:else}
		<!-- Fallback Empty State (Segera Hadir) -->
		<div class="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="size-16 opacity-30"
				viewBox="0 0 24 24"
				fill="currentColor"
			>
				<path
					d="M19 6H5a3 3 0 00-3 3v8a3 3 0 003 3h14a3 3 0 003-3V9a3 3 0 00-3-3zm-7 8a2 2 0 112-2 2 2 0 01-2 2z"
				/>
			</svg>
			<span class="text-xs font-bold uppercase tracking-wider text-gray-400">Segera Hadir</span>
		</div>
	{/if}

	<!-- SOLD Badge Overlay -->
	{#if isSold}
		<div
			class="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-35 pointer-events-none"
		>
			<span
				class="inline-block bg-red-600 text-white font-black text-xl lg:text-2xl px-5 py-1.5 uppercase tracking-widest rounded shadow-lg transform -skew-x-6 border-2 border-white/90"
			>
				SOLD
			</span>
		</div>
	{/if}
</div>

<style>
	@keyframes slideInFromRight {
		from {
			transform: translate3d(100%, 0, 0);
		}
		to {
			transform: translate3d(0, 0, 0);
		}
	}
	@keyframes slideOutToLeft {
		from {
			transform: translate3d(0, 0, 0);
		}
		to {
			transform: translate3d(-100%, 0, 0);
		}
	}
	@keyframes slideInFromLeft {
		from {
			transform: translate3d(-100%, 0, 0);
		}
		to {
			transform: translate3d(0, 0, 0);
		}
	}
	@keyframes slideOutToRight {
		from {
			transform: translate3d(0, 0, 0);
		}
		to {
			transform: translate3d(100%, 0, 0);
		}
	}

	.slide-in-right {
		animation: slideInFromRight 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
		will-change: transform;
	}
	.slide-out-left {
		animation: slideOutToLeft 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
		will-change: transform;
	}
	.slide-in-left {
		animation: slideInFromLeft 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
		will-change: transform;
	}
	.slide-out-right {
		animation: slideOutToRight 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
		will-change: transform;
	}
</style>
