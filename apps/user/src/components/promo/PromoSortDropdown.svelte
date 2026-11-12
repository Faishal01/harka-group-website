<script lang="ts">
	import CustomDropdown, { type DropdownOption } from "~/components/CustomDropdown.svelte";

	interface Props {
		currentSort: string;
		options: DropdownOption[];
	}

	let { currentSort, options }: Props = $props();

	function handleSortChange(newVal: string | number) {
		if (typeof window === "undefined") return;
		const url = new URL(window.location.href);
		url.searchParams.set("sort", String(newVal));
		window.location.href = url.toString();
	}
</script>

<div class="flex items-center gap-2 self-start sm:self-auto min-w-[200px]">
	<span class="text-xs font-semibold text-gray-500 shrink-0">Urutkan:</span>
	<div class="w-full">
		<CustomDropdown
			{options}
			value={currentSort}
			onChange={handleSortChange}
			placeholder="Pilih Urutan"
		/>
	</div>
</div>
