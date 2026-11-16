<script lang="ts">
	import type { FaqItem } from "~/data/faq";

	interface Props {
		items?: FaqItem[];
	}

	let { items = [] }: Props = $props();

	let openIndex = $state<number | null>(null);

	function toggle(index: number) {
		openIndex = openIndex === index ? null : index;
	}
</script>

{#if items.length > 0}
	<section
		aria-label="Pertanyaan yang Sering Diajukan"
		class="bg-white border-t border-gray-200 py-12 lg:py-16"
	>
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-8 sm:mb-10">
				<span class="text-xs font-bold uppercase tracking-wider text-red-700">
					Informasi Pembeli
				</span>
				<h2 class="text-2xl sm:text-3xl font-bold text-gray-900 font-header mt-1.5">
					FAQ
				</h2>
				<p class="text-sm sm:text-base text-gray-600 mt-2">
					Jawaban singkat seputar unit, inspeksi, dan proses pembelian di Harka Group.
				</p>
			</div>

			<div class="space-y-3">
				{#each items as item, idx (item.question)}
					{@const isOpen = openIndex === idx}
					<div
						class={`rounded-2xl border transition-colors ${
							isOpen
								? "border-red-200 bg-red-50/20 shadow-xs"
								: "border-gray-200/90 bg-white hover:border-gray-300"
						}`}
					>
						<h3>
							<button
								type="button"
								onclick={() => toggle(idx)}
								aria-expanded={isOpen}
								aria-controls={`faq-panel-${idx}`}
								id={`faq-trigger-${idx}`}
								class="w-full px-5 py-4 sm:px-6 sm:py-5 text-left flex items-center justify-between gap-4 cursor-pointer"
							>
								<span class="text-sm sm:text-base font-bold text-gray-900 leading-snug">
									{item.question}
								</span>
								<span
									class={`size-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
										isOpen ? "bg-red-600 text-white rotate-180" : "bg-gray-100 text-gray-600"
									}`}
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
								</span>
							</button>
						</h3>

						{#if isOpen}
							<div
								id={`faq-panel-${idx}`}
								role="region"
								aria-labelledby={`faq-trigger-${idx}`}
								class="px-5 pb-5 sm:px-6 sm:pb-5 pt-0"
							>
								<p
									class="text-sm text-gray-600 leading-relaxed whitespace-pre-line border-t border-gray-100 pt-3"
								>
									{item.answer}
								</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>
{/if}
