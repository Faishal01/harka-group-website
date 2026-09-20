<script lang="ts">
	import { authClient } from "~/lib/auth-client";
	import { slide } from "svelte/transition";

	let { user, role } = $props<{
		user: {
			name: string;
			email: string;
			image?: string | null;
		};
		role?: "superadmin" | "admin" | null;
	}>();

	let isOpen = $state(false);

	const toggleDropdown = () => {
		isOpen = !isOpen;
	};

	const closeDropdown = (e: MouseEvent) => {
		if (isOpen && !(e.target as Element).closest(".user-profile-dropdown")) {
			isOpen = false;
		}
	};

	const handleLogout = async () => {
		await authClient.signOut();
		window.location.href = "/login";
	};

	// Fallback avatar URL if no image is provided
	const avatarUrl =
		user.image ||
		`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
</script>

<svelte:window onclick={closeDropdown} />

<div class="relative user-profile-dropdown hidden md:block">
	<button
		onclick={toggleDropdown}
		class="flex items-center gap-2 focus:outline-none hover:bg-red-800 p-1.5 rounded-lg transition-colors"
		aria-haspopup="true"
		aria-expanded={isOpen}
	>
		<img
			src={avatarUrl}
			alt={user.name}
			class="h-8 w-8 rounded-full border border-red-600 object-cover"
			referrerpolicy="no-referrer"
		/>
		<div class="flex items-center gap-2 hidden lg:flex">
			<span class="text-sm font-medium text-white leading-tight">{user.name}</span>
			{#if role}
				<span
					class={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
						role === "superadmin"
							? "bg-purple-900/90 text-purple-200 border border-purple-400/40"
							: "bg-red-900/90 text-red-100 border border-red-500/40"
					}`}
				>
					{role}
				</span>
			{/if}
		</div>
		<svg
			class={`h-4 w-4 text-red-200 transition-transform ${isOpen ? "rotate-180" : ""}`}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isOpen}
		<div
			transition:slide={{ duration: 200 }}
			class="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none z-50"
		>
			<div class="px-4 py-2 border-b border-gray-100 mb-1">
				<div class="flex items-center justify-between gap-2">
					<p class="text-sm text-gray-900 font-medium truncate">{user.name}</p>
					{#if role}
						<span
							class={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider ${
								role === "superadmin"
									? "bg-purple-100 text-purple-800 border border-purple-200"
									: "bg-gray-100 text-gray-700 border border-gray-200"
							}`}
						>
							{role}
						</span>
					{/if}
				</div>
				<p class="text-xs text-gray-500 truncate">{user.email}</p>
			</div>
			<button
				onclick={handleLogout}
				class="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 transition-colors"
			>
				Sign out
			</button>
		</div>
	{/if}
</div>
