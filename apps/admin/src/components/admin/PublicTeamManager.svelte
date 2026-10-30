<script lang="ts">
	import type { TeamMember } from "@harka/db";

	let { initialMembers = [] } = $props<{
		initialMembers: TeamMember[];
	}>();

	let members = $state<TeamMember[]>([...initialMembers]);
	let isModalOpen = $state(false);
	let editingMember = $state<TeamMember | null>(null);

	// Form inputs
	let name = $state("");
	let role = $state("");
	let phone = $state("");
	let email = $state("");
	let isActive = $state(true);
	let photoFile = $state<File | null>(null);
	let photoPreviewUrl = $state<string | null>(null);
	let removePhoto = $state(false);

	let isSaving = $state(false);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	let confirmDeleteId = $state<string | null>(null);
	let isDeleting = $state(false);

	function openCreateModal() {
		editingMember = null;
		name = "";
		role = "";
		phone = "";
		email = "";
		isActive = true;
		photoFile = null;
		photoPreviewUrl = null;
		removePhoto = false;
		errorMessage = null;
		isModalOpen = true;
	}

	function openEditModal(member: TeamMember) {
		editingMember = member;
		name = member.name;
		role = member.role || "";
		phone = member.phone || "";
		email = member.email || "";
		isActive = member.isActive;
		photoFile = null;
		photoPreviewUrl = member.photoUrl;
		removePhoto = false;
		errorMessage = null;
		isModalOpen = true;
	}

	function closeModal() {
		if (isSaving) return;
		isModalOpen = false;
		editingMember = null;
		photoFile = null;
		photoPreviewUrl = null;
		errorMessage = null;
	}

	function handlePhotoSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			photoFile = file;
			removePhoto = false;
			photoPreviewUrl = URL.createObjectURL(file);
		}
	}

	function handleRemovePhoto() {
		photoFile = null;
		photoPreviewUrl = null;
		removePhoto = true;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errorMessage = null;
		successMessage = null;

		const trimmedName = name.trim();
		if (!trimmedName) {
			errorMessage = "Nama lengkap anggota tim wajib diisi.";
			return;
		}

		isSaving = true;

		try {
			const formData = new FormData();
			formData.append("name", trimmedName);
			formData.append("role", role.trim());
			formData.append("phone", phone.trim());
			formData.append("email", email.trim());
			formData.append("isActive", isActive ? "true" : "false");

			if (photoFile) {
				formData.append("photo", photoFile);
			}

			if (editingMember) {
				if (removePhoto) {
					formData.append("removePhoto", "true");
				}
				const res = await fetch(`/api/team/members/${editingMember.id}`, {
					method: "PUT",
					body: formData,
				});
				const data = (await res.json()) as any;
				if (!res.ok) {
					throw new Error(data.error || "Gagal memperbarui data anggota tim");
				}

				// Refresh member list
				await reloadMembers();
				successMessage = `Profil "${trimmedName}" berhasil diperbarui.`;
			} else {
				formData.append("order", String(members.length));
				const res = await fetch("/api/team/members", {
					method: "POST",
					body: formData,
				});
				const data = (await res.json()) as any;
				if (!res.ok) {
					throw new Error(data.error || "Gagal menambahkan anggota tim");
				}

				// Refresh member list
				await reloadMembers();
				successMessage = `Anggota tim "${trimmedName}" berhasil ditambahkan.`;
			}

			isModalOpen = false;
		} catch (err: any) {
			errorMessage = err.message || "Terjadi kesalahan.";
		} finally {
			isSaving = false;
		}
	}

	async function reloadMembers() {
		try {
			const res = await fetch("/api/team/members");
			if (res.ok) {
				const data = (await res.json()) as any;
				if (Array.isArray(data.members)) {
					members = data.members;
				}
			}
		} catch {
			// ignore
		}
	}

	async function toggleActive(member: TeamMember) {
		const newStatus = !member.isActive;
		try {
			const formData = new FormData();
			formData.append("isActive", newStatus ? "true" : "false");

			const res = await fetch(`/api/team/members/${member.id}`, {
				method: "PUT",
				body: formData,
			});
			if (res.ok) {
				members = members.map((m) => (m.id === member.id ? { ...m, isActive: newStatus } : m));
			}
		} catch (err: any) {
			alert("Gagal mengubah status visibilitas: " + err.message);
		}
	}

	async function moveMember(index: number, direction: "up" | "down") {
		const targetIndex = direction === "up" ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= members.length) return;

		const reordered = [...members];
		const temp = reordered[index];
		reordered[index] = reordered[targetIndex];
		reordered[targetIndex] = temp;

		members = reordered;

		try {
			await fetch("/api/team/members/reorder", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderedIds: reordered.map((m) => m.id) }),
			});
		} catch {
			// ignore error
		}
	}

	async function handleDelete(id: string) {
		isDeleting = true;
		errorMessage = null;
		try {
			const res = await fetch(`/api/team/members/${id}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				const data = (await res.json()) as any;
				throw new Error(data.error || "Gagal menghapus anggota tim");
			}

			members = members.filter((m) => m.id !== id);
			confirmDeleteId = null;
			successMessage = "Anggota tim berhasil dihapus.";
		} catch (err: any) {
			errorMessage = err.message || "Gagal menghapus";
		} finally {
			isDeleting = false;
		}
	}

	function getInitials(fullName: string): string {
		return fullName
			.split(" ")
			.filter(Boolean)
			.slice(0, 2)
			.map((n) => n[0].toUpperCase())
			.join("");
	}
</script>

<div class="space-y-6">
	<!-- Actions Bar -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h2 class="text-lg font-bold text-gray-900">Profil Anggota Tim Showroom</h2>
			<p class="text-xs sm:text-sm text-gray-500 mt-0.5">
				Daftar staf dan personel yang ditampilkan pada halaman publik website.
			</p>
		</div>

		<button
			type="button"
			onclick={openCreateModal}
			class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-700 text-white font-semibold text-sm hover:bg-red-800 transition shadow-sm shrink-0"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="size-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			<span>Tambah Anggota Tim</span>
		</button>
	</div>

	<!-- Alert Messages -->
	{#if successMessage}
		<div
			class="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center justify-between"
		>
			<div class="flex items-center gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="size-5 text-green-600 shrink-0"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
						clip-rule="evenodd"
					/>
				</svg>
				<span>{successMessage}</span>
			</div>
			<button
				type="button"
				onclick={() => (successMessage = null)}
				class="text-green-600 hover:text-green-800 text-xs font-bold"
			>
				Tutup
			</button>
		</div>
	{/if}

	{#if errorMessage}
		<div
			class="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between"
		>
			<div class="flex items-center gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="size-5 text-red-600 shrink-0"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
						clip-rule="evenodd"
					/>
				</svg>
				<span>{errorMessage}</span>
			</div>
			<button
				type="button"
				onclick={() => (errorMessage = null)}
				class="text-red-600 hover:text-red-800 text-xs font-bold"
			>
				Tutup
			</button>
		</div>
	{/if}

	<!-- Member List -->
	{#if members.length === 0}
		<div class="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs">
			<div
				class="size-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-4"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="size-8"
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
			</div>
			<h3 class="text-base font-bold text-gray-900 mb-1">Belum Ada Anggota Tim</h3>
			<p class="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6">
				Tambahkan profil anggota tim atau staf showroom Anda untuk ditampilkan pada halaman publik
				website.
			</p>
			<button
				type="button"
				onclick={openCreateModal}
				class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-700 text-white font-semibold text-xs hover:bg-red-800 transition shadow-sm"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="size-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				<span>Tambah Profil Pertama</span>
			</button>
		</div>
	{:else}
		<div class="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
			<ul class="divide-y divide-gray-200">
				{#each members as member, idx (member.id)}
					<li
						class="p-4 sm:p-5 hover:bg-gray-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
					>
						<!-- Member info -->
						<div class="flex items-center gap-4 min-w-0">
							<!-- Reorder buttons -->
							<div class="flex flex-col gap-1 shrink-0 text-gray-400">
								<button
									type="button"
									onclick={() => moveMember(idx, "up")}
									disabled={idx === 0}
									class="p-1 rounded hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed transition"
									title="Pindah ke atas"
								>
									<svg class="size-3.5 fill-current" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
											clip-rule="evenodd"
										/>
									</svg>
								</button>
								<button
									type="button"
									onclick={() => moveMember(idx, "down")}
									disabled={idx === members.length - 1}
									class="p-1 rounded hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed transition"
									title="Pindah ke bawah"
								>
									<svg class="size-3.5 fill-current" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
											clip-rule="evenodd"
										/>
									</svg>
								</button>
							</div>

							<!-- Avatar / Photo -->
							<div
								class="size-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center font-bold text-gray-500 text-sm shadow-inner"
							>
								{#if member.photoUrl}
									<img src={member.photoUrl} alt={member.name} class="w-full h-full object-cover" />
								{:else}
									<span>{getInitials(member.name)}</span>
								{/if}
							</div>

							<!-- Names & Details -->
							<div class="min-w-0">
								<div class="flex items-center gap-2 flex-wrap">
									<h4 class="font-bold text-gray-900 text-sm sm:text-base truncate">
										{member.name}
									</h4>
									{#if member.role}
										<span
											class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200"
										>
											{member.role}
										</span>
									{/if}
									{#if !member.isActive}
										<span
											class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
										>
											Disembunyikan
										</span>
									{/if}
								</div>

								<div class="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
									{#if member.phone}
										<span class="inline-flex items-center gap-1">
											<svg class="size-3 text-emerald-600 fill-current" viewBox="0 0 24 24">
												<path
													d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.2.301-.778.98-.954 1.18-.175.201-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.784-1.676-2.085-.175-.301-.019-.464.132-.614.136-.135.301-.351.451-.527.15-.175.2-.301.301-.502.1-.201.05-.376-.025-.527-.075-.15-.678-1.634-.929-2.237-.245-.588-.493-.508-.678-.517-.175-.01-.376-.01-.577-.01s-.527.075-.803.376c-.276.301-1.054 1.03-1.054 2.512s1.079 2.914 1.23 3.115c.15.201 2.124 3.243 5.145 4.549.719.311 1.281.497 1.719.636.723.23 1.381.197 1.901.12.579-.087 1.78-.728 2.031-1.431.251-.703.251-1.306.175-1.431-.075-.125-.276-.2-.577-.35zM12.042 21.908h-.008C10.288 21.907 8.57 21.436 7.07 20.543l-.507-.301-3.754.985 1.002-3.66-.33-.526C2.518 15.485 2 13.805 2 12.046c0-5.541 4.508-10.048 10.051-10.048 2.686 0 5.21 1.047 7.108 2.946 1.899 1.899 2.945 4.423 2.945 7.109 0 5.542-4.509 10.055-10.062 10.055z"
												/>
											</svg>
											<span>{member.phone}</span>
										</span>
									{/if}
									{#if member.email}
										<span class="inline-flex items-center gap-1">
											<svg
												class="size-3 text-gray-400"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
												/>
											</svg>
											<span>{member.email}</span>
										</span>
									{/if}
								</div>
							</div>
						</div>

						<!-- Action Buttons -->
						<div class="flex items-center gap-2 self-end sm:self-center shrink-0">
							<!-- Visibility toggle button -->
							<button
								type="button"
								onclick={() => toggleActive(member)}
								class="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition {member.isActive
									? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
									: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}"
								title="Klik untuk ubah visibilitas publik"
							>
								{member.isActive ? "Aktif" : "Non-aktif"}
							</button>

							<!-- Edit Button -->
							<button
								type="button"
								onclick={() => openEditModal(member)}
								class="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
								title="Edit Profil"
							>
								<svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
							</button>

							<!-- Delete Button -->
							{#if confirmDeleteId === member.id}
								<div class="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
									<button
										type="button"
										onclick={() => handleDelete(member.id)}
										disabled={isDeleting}
										class="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 transition"
									>
										{isDeleting ? "..." : "Ya, Hapus"}
									</button>
									<button
										type="button"
										onclick={() => (confirmDeleteId = null)}
										class="px-2 py-1 text-gray-600 hover:text-gray-800 text-xs"
									>
										Batal
									</button>
								</div>
							{:else}
								<button
									type="button"
									onclick={() => (confirmDeleteId = member.id)}
									class="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
									title="Hapus Profil"
								>
									<svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<!-- Modal Form -->
{#if isModalOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
		>
			<div class="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
				<div>
					<h3 class="text-lg font-bold text-gray-900">
						{editingMember ? "Edit Profil Anggota Tim" : "Tambah Anggota Tim Baru"}
					</h3>
					<p class="text-xs text-gray-500 mt-0.5">
						Informasi ini akan ditampilkan pada halaman publik website.
					</p>
				</div>
				<button
					type="button"
					onclick={closeModal}
					class="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
				>
					<svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				<!-- Photo Upload & Preview -->
				<div>
					<label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
						Foto Profil (Opsional)
					</label>
					<div class="flex items-center gap-4">
						<div
							class="size-20 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center font-bold text-gray-400 text-lg shadow-inner relative group"
						>
							{#if photoPreviewUrl}
								<img src={photoPreviewUrl} alt="Preview" class="w-full h-full object-cover" />
								<button
									type="button"
									onclick={handleRemovePhoto}
									class="absolute inset-0 bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center font-medium"
									title="Hapus Foto"
								>
									Hapus
								</button>
							{:else}
								<span>{name ? getInitials(name) : "?"}</span>
							{/if}
						</div>

						<div class="flex-1">
							<label
								class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold cursor-pointer transition shadow-xs"
							>
								<svg
									class="size-4 text-gray-500"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								<span>{photoPreviewUrl ? "Ganti Foto" : "Unggah Foto"}</span>
								<input
									type="file"
									accept="image/png, image/jpeg, image/webp"
									class="hidden"
									onchange={handlePhotoSelect}
								/>
							</label>
							<p class="text-[11px] text-gray-400 mt-1.5">
								Format: JPG, PNG, atau WEBP. Disarankan rasio potret / 1:1.
							</p>
						</div>
					</div>
				</div>

				<!-- Name -->
				<div>
					<label
						for="memberName"
						class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
					>
						Nama Lengkap <span class="text-red-600">*</span>
					</label>
					<input
						type="text"
						id="memberName"
						bind:value={name}
						placeholder="mis. Hendra Setiawan"
						class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 transition"
						required
					/>
				</div>

				<!-- Role (Optional) -->
				<div>
					<div class="flex items-center justify-between mb-1">
						<label
							for="memberRole"
							class="block text-xs font-bold text-gray-700 uppercase tracking-wider"
						>
							Jabatan / Peran
						</label>
						<span class="text-[11px] text-gray-400 font-medium">Opsional</span>
					</div>
					<input
						type="text"
						id="memberRole"
						bind:value={role}
						placeholder="mis. Showroom Manager, Sales Executive, Appraiser"
						class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 transition"
					/>
					<p class="text-[11px] text-gray-400 mt-1">
						Kosongkan jika tidak ingin menampilkan jabatan pada kartu anggota.
					</p>
				</div>

				<!-- Phone / WhatsApp -->
				<div>
					<div class="flex items-center justify-between mb-1">
						<label
							for="memberPhone"
							class="block text-xs font-bold text-gray-700 uppercase tracking-wider"
						>
							Nomor WhatsApp / Telepon
						</label>
						<span class="text-[11px] text-gray-400 font-medium">Opsional</span>
					</div>
					<input
						type="tel"
						id="memberPhone"
						bind:value={phone}
						placeholder="mis. 081234567890"
						class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 transition"
					/>
				</div>

				<!-- Email -->
				<div>
					<div class="flex items-center justify-between mb-1">
						<label
							for="memberEmail"
							class="block text-xs font-bold text-gray-700 uppercase tracking-wider"
						>
							Email
						</label>
						<span class="text-[11px] text-gray-400 font-medium">Opsional</span>
					</div>
					<input
						type="email"
						id="memberEmail"
						bind:value={email}
						placeholder="mis. hendra@harkagroup.id"
						class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 transition"
					/>
				</div>

				<!-- Active Toggle -->
				<div class="pt-2">
					<label
						class="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-50 transition"
					>
						<input
							type="checkbox"
							bind:checked={isActive}
							class="size-4 rounded text-red-600 accent-red-600"
						/>
						<div class="text-xs">
							<span class="font-bold text-gray-900 block">Tampilkan di Halaman Website</span>
							<span class="text-gray-500 block text-[11px]">
								Jika dinonaktifkan, profil ini akan disembunyikan dari halaman publik.
							</span>
						</div>
					</label>
				</div>

				{#if errorMessage}
					<p class="text-xs text-red-600 font-medium">{errorMessage}</p>
				{/if}

				<!-- Modal Actions -->
				<div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
					<button
						type="button"
						onclick={closeModal}
						disabled={isSaving}
						class="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isSaving}
						class="px-6 py-2.5 rounded-xl bg-red-700 text-white font-semibold text-xs hover:bg-red-800 disabled:opacity-50 transition shadow-sm flex items-center gap-2"
					>
						{#if isSaving}
							<svg class="animate-spin size-3.5" viewBox="0 0 24 24" fill="none">
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
							<span>Menyimpan...</span>
						{:else}
							<span>{editingMember ? "Simpan Perubahan" : "Simpan Profil"}</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
