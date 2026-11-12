<script lang="ts">
	import { onMount } from "svelte";

	export interface DropdownOption {
		value: string | number;
		label: string;
	}

	interface Props {
		value: string | number | null | undefined;
		options: DropdownOption[];
		placeholder?: string;
		label?: string;
		theme?: "light" | "dark";
		class?: string;
		onChange: (value: string | number) => void;
	}

	let {
		value,
		options = [],
		placeholder = "Pilih...",
		label,
		theme = "light",
		class: customClass = "",
		onChange,
	}: Props = $props();

	let isOpen = $state(false);
	let dropdownRef = $state<HTMLElement | null>(null);

	const selectedOption = $derived(
		options.find((opt) => opt.value === value || (opt.value === "" && !value)),
	);
	const displayLabel = $derived(selectedOption ? selectedOption.label : placeholder);

	function handleSelect(val: string | number) {
		onChange(val);
		isOpen = false;
	}

	onMount(() => {
		function handleClickOutside(e: MouseEvent) {
			if (dropdownRef && !dropdownRef.contains(e.target as Node)) {
				isOpen = false;
			}
		}

		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape" && isOpen) {
				isOpen = false;
			}
		}

		window.addEventListener("click", handleClickOutside);
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("click", handleClickOutside);
			window.removeEventListener("keydown", handleKeyDown);
		};
	});
</script>

<div bind:this={dropdownRef} class="relative w-full {customClass}">
	{#if label}
		<label
			class="block text-sm font-semibold mb-1.5 {theme === 'dark'
				? 'text-gray-300'
				: 'text-gray-700'}"
		>
			{label}
		</label>
	{/if}

	<button
		type="button"
		onclick={() => (isOpen = !isOpen)}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		class="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm text-left focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition cursor-pointer {theme ===
		'dark'
			? 'bg-gray-900 border border-gray-700 hover:border-gray-600 text-white shadow-inner'
			: 'bg-white border border-gray-300 hover:border-gray-400 text-gray-900 shadow-xs'}"
	>
		<span
			class="truncate {value !== '' && value !== null && value !== undefined
				? theme === 'dark'
					? 'text-white font-medium'
					: 'text-gray-900 font-medium'
				: 'text-gray-400'}"
		>
			{displayLabel}
		</span>

		<!-- Chevron icon -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class={`size-4 transition-transform duration-200 shrink-0 ml-2 ${
				isOpen ? "rotate-180 text-red-600" : theme === "dark" ? "text-gray-400" : "text-gray-400"
			}`}
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

	<!-- Popover -->
	{#if isOpen}
		<div
			role="listbox"
			class="absolute left-0 top-full mt-1.5 w-full rounded-xl shadow-xl p-1 z-50 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150 {theme ===
			'dark'
				? 'bg-gray-900 border border-gray-800'
				: 'bg-white border border-gray-200'}"
		>
			{#each options as opt (opt.value)}
				{@const isSelected = opt.value === value || (opt.value === "" && !value)}
				<button
					type="button"
					role="option"
					aria-selected={isSelected}
					onclick={() => handleSelect(opt.value)}
					class={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
						isSelected
							? theme === "dark"
								? "bg-red-950/60 text-red-400 font-bold"
								: "bg-red-50 text-red-700 font-bold"
							: theme === "dark"
								? "text-gray-300 hover:bg-gray-800 hover:text-white"
								: "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
					}`}
				>
					<span class="truncate">{opt.label}</span>
					{#if isSelected}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="size-3.5 text-red-600 shrink-0 ml-2"
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
