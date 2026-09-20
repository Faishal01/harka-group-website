<script lang="ts">
	import { authClient } from "~/lib/auth-client";

	interface Member {
		email: string;
		role: "superadmin" | "admin";
		createdBy: string | null;
		createdAt: Date | string | number | null;
	}

	let {
		initialMembers = [],
		currentUserEmail,
		currentUserRole,
	} = $props<{
		initialMembers: Member[];
		currentUserEmail: string;
		currentUserRole: "superadmin" | "admin";
	}>();

	let members = $state<Member[]>([...initialMembers]);
	let newEmail = $state("");
	let isSubmitting = $state(false);
	let deletingEmail = $state<string | null>(null);
	let confirmDeleteEmail = $state<string | null>(null);

	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	const formatDate = (dateVal: Date | string | number | null) => {
		if (!dateVal) return "-";
		try {
			const d = new Date(dateVal);
			return d.toLocaleDateString("id-ID", {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch {
			return String(dateVal);
		}
	};

	const handleAddAdmin = async (e: SubmitEvent) => {
		e.preventDefault();
		errorMessage = null;
		successMessage = null;

		const trimmedEmail = newEmail.trim().toLowerCase();
		if (!trimmedEmail) {
			errorMessage = "Email tidak boleh kosong.";
			return;
		}

		if (trimmedEmail === currentUserEmail.toLowerCase()) {
			errorMessage = "Akun Anda saat ini sudah memiliki akses admin aktif.";
			return;
		}

		if (members.some((m) => m.email.toLowerCase() === trimmedEmail)) {
			errorMessage = "Email ini sudah terdaftar dalam daftar anggota tim.";
			return;
		}

		isSubmitting = true;

		try {
			const res = await fetch("/api/team", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: trimmedEmail }),
			});

			const data = (await res.json()) as {
				error?: string;
				entry?: Member;
				message?: string;
			};

			if (!res.ok) {
				errorMessage = data.error || "Gagal menambahkan admin.";
			} else if (data.entry) {
				members = [data.entry, ...members];
				newEmail = "";
				successMessage = data.message || `Admin ${trimmedEmail} berhasil ditambahkan.`;
			}
		} catch {
			errorMessage = "Terjadi kesalahan jaringan atau server saat menambahkan admin.";
		} finally {
			isSubmitting = false;
		}
	};

	const handleDelete = async () => {
		if (!confirmDeleteEmail) return;
		const targetEmail = confirmDeleteEmail;
		confirmDeleteEmail = null;
		errorMessage = null;
		successMessage = null;
		deletingEmail = targetEmail;

		const isSelf = targetEmail.toLowerCase() === currentUserEmail.toLowerCase();

		try {
			const res = await fetch("/api/team", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: targetEmail }),
			});

			const data = (await res.json()) as { error?: string; message?: string };

			if (!res.ok) {
				errorMessage = data.error || "Gagal menghapus admin.";
			} else {
				if (isSelf) {
					await authClient.signOut();
					window.location.href = "/login";
					return;
				}
				members = members.filter((m) => m.email !== targetEmail);
				successMessage = data.message || `Admin ${targetEmail} berhasil dihapus.`;
			}
		} catch {
			errorMessage = "Terjadi kesalahan jaringan saat menghapus admin.";
		} finally {
			deletingEmail = null;
		}
	};
</script>

<div class="space-y-6">
	<!-- Alerts -->
	{#if errorMessage}
		<div class="rounded-lg bg-red-50 p-4 border border-red-200 flex items-start gap-3">
			<svg
				class="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
					clip-rule="evenodd"
				/>
			</svg>
			<div class="flex-1 text-sm text-red-700">{errorMessage}</div>
			<button
				onclick={() => (errorMessage = null)}
				class="text-red-400 hover:text-red-600 text-sm font-medium"
				aria-label="Tutup"
			>
				&times;
			</button>
		</div>
	{/if}

	{#if successMessage}
		<div class="rounded-lg bg-emerald-50 p-4 border border-emerald-200 flex items-start gap-3">
			<svg
				class="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
					clip-rule="evenodd"
				/>
			</svg>
			<div class="flex-1 text-sm text-emerald-700">{successMessage}</div>
			<button
				onclick={() => (successMessage = null)}
				class="text-emerald-400 hover:text-emerald-600 text-sm font-medium"
				aria-label="Tutup"
			>
				&times;
			</button>
		</div>
	{/if}

	<!-- Add Admin Card -->
	<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
			<div>
				<h2 class="text-lg font-bold text-gray-900">Tambah Anggota Admin</h2>
				<p class="text-xs text-gray-500 mt-1">
					Masukkan alamat email Google akun yang ingin diberikan hak akses ke dasbor ini.
				</p>
			</div>
			<span
				class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 w-fit"
			>
				<svg
					class="h-3.5 w-3.5 text-amber-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				Akses Diberikan: Admin
			</span>
		</div>

		<form onsubmit={handleAddAdmin} class="flex flex-col sm:flex-row gap-3">
			<div class="relative flex-1">
				<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
						<path
							d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z"
						/>
						<path
							d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z"
						/>
					</svg>
				</div>
				<input
					type="email"
					required
					bind:value={newEmail}
					placeholder="contoh@gmail.com"
					disabled={isSubmitting}
					class="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 disabled:bg-gray-50"
				/>
			</div>
			<button
				type="submit"
				disabled={isSubmitting}
				class="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:opacity-50 transition"
			>
				{#if isSubmitting}
					<svg class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					Menyimpan...
				{:else}
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Tambah Admin
				{/if}
			</button>
		</form>
		<p class="mt-2 text-xs text-gray-400">
			* Akun Superadmin hanya dapat ditentukan langsung melalui database Cloudflare D1 untuk
			keamanan tingkat tinggi.
		</p>
	</div>

	<!-- Whitelist Table -->
	<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
		<div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<h3 class="font-bold text-gray-900">Admin</h3>
			</div>
			<span class="text-xs text-gray-500">
				Total {members.length} admin
			</span>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm text-gray-600">
				<thead
					class="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b border-gray-200"
				>
					<tr>
						<th class="px-6 py-3.5">Email Pengguna</th>
						<th class="px-6 py-3.5">Ditambahkan Oleh</th>
						<th class="px-6 py-3.5">Tanggal Didaftarkan</th>
						{#if currentUserRole === "superadmin"}
							<th class="px-6 py-3.5 text-right">Aksi</th>
						{/if}
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#if members.length === 0}
						<tr>
							<td
								colspan={currentUserRole === "superadmin" ? 4 : 3}
								class="px-6 py-12 text-center text-gray-400"
							>
								<svg
									class="mx-auto h-10 w-10 text-gray-300 mb-2"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
								Belum ada anggota tim dalam daftar whitelist.
							</td>
						</tr>
					{:else}
						{#each members as member (member.email)}
							{@const isSelf = member.email.toLowerCase() === currentUserEmail.toLowerCase()}
							{@const isSuperadmin = member.role === "superadmin"}

							<tr class="hover:bg-gray-50/75 transition">
								<td class="px-6 py-4">
									<div class="flex items-center gap-3">
										<div
											class="flex h-9 w-9 items-center justify-center rounded-full font-semibold text-xs uppercase border bg-gray-100 text-gray-700 border-gray-200"
										>
											{member.email.charAt(0)}
										</div>
										<div class="flex items-center gap-2 flex-wrap">
											<span class="font-medium text-gray-900">
												{member.email}
											</span>
											{#if isSelf}
												<span
													class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-200/90 text-gray-700 border border-gray-300"
												>
													Anda
												</span>
											{/if}
										</div>
									</div>
								</td>
								<td class="px-6 py-4 text-xs text-gray-500">
									{member.createdBy || "Sistem (Migrasi Awal)"}
								</td>
								<td class="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
									{formatDate(member.createdAt)}
								</td>
								{#if currentUserRole === "superadmin"}
									<td class="px-6 py-4 text-right">
										{#if isSuperadmin}
											<button
												type="button"
												disabled
												title="Akun superadmin tidak dapat dihapus melalui antarmuka"
												class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed opacity-60"
											>
												<svg
													class="h-3.5 w-3.5 text-gray-400"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/>
												</svg>
												Hapus
											</button>
										{:else}
											<button
												onclick={() => (confirmDeleteEmail = member.email)}
												disabled={deletingEmail === member.email}
												class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition disabled:opacity-50"
											>
												{#if deletingEmail === member.email}
													<svg
														class="animate-spin h-3 w-3 text-red-600"
														viewBox="0 0 24 24"
														fill="none"
													>
														<circle
															class="opacity-25"
															cx="12"
															cy="12"
															r="10"
															stroke="currentColor"
															stroke-width="4"
														></circle>
														<path
															class="opacity-75"
															fill="currentColor"
															d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
														></path>
													</svg>
													Menghapus...
												{:else}
													<svg
														class="h-3.5 w-3.5"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
													Hapus
												{/if}
											</button>
										{/if}
									</td>
								{/if}
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Confirmation Modal -->
{#if confirmDeleteEmail}
	{@const isDeletingSelf = confirmDeleteEmail.toLowerCase() === currentUserEmail.toLowerCase()}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
		<div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 flex-shrink-0"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<div>
					<h3 class="text-base font-bold text-gray-900">
						{isDeletingSelf ? "Hapus Akun Anda Sendiri" : "Hapus Akses Admin"}
					</h3>
					<p class="text-xs text-gray-500">Konfirmasi pencabutan akses</p>
				</div>
			</div>

			{#if isDeletingSelf}
				<div class="rounded-lg bg-red-50 p-3 border border-red-200 text-xs text-red-800 space-y-1">
					<p class="font-bold">Peringatan Kritis:</p>
					<p>
						Anda akan menghapus hak akses admin untuk akun Anda sendiri (<strong
							class="text-red-950">{confirmDeleteEmail}</strong
						>). Sesi login Anda akan langsung diakhiri dan Anda akan dialihkan ke halaman login.
					</p>
				</div>
			{:else}
				<p class="text-sm text-gray-600">
					Apakah Anda yakin ingin menghapus akses admin untuk <strong class="text-gray-900"
						>{confirmDeleteEmail}</strong
					>? Sesi login aktif akun ini akan langsung dibatalkan.
				</p>
			{/if}

			<div class="flex items-center justify-end gap-3 pt-2">
				<button
					type="button"
					onclick={() => (confirmDeleteEmail = null)}
					class="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
				>
					Batal
				</button>
				<button
					type="button"
					onclick={handleDelete}
					class="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition shadow-sm"
				>
					{isDeletingSelf ? "Ya, Hapus Akun Saya" : "Ya, Hapus Akses"}
				</button>
			</div>
		</div>
	</div>
{/if}
