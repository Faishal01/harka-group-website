<script lang="ts">
	import { onMount } from "svelte";
	import { authClient } from "~/lib/auth-client";

	let isOpen = $state(false);
	let isChecking = $state(false);
	let checkMessage = $state<string | null>(null);
	let isSuccess = $state(false);

	onMount(() => {
		const handleSessionExpired = () => {
			if (window.location.pathname === "/login") return;
			isOpen = true;
			checkMessage = null;
			isSuccess = false;
		};

		window.addEventListener("auth:session-expired", handleSessionExpired);
		return () => {
			window.removeEventListener("auth:session-expired", handleSessionExpired);
		};
	});

	function openLoginTab() {
		checkMessage =
			"Tab login telah dibuka. Setelah login selesai, klik 'Cek Status Sesi' di bawah.";
		isSuccess = false;
		window.open("/login", "_blank");
	}

	async function checkSession() {
		isChecking = true;
		checkMessage = null;
		try {
			const res = await authClient.getSession();
			if (res.data?.session) {
				isSuccess = true;
				checkMessage = "Sesi aktif kembali! Anda dapat melanjutkan menyimpan perubahan.";
				setTimeout(() => {
					isOpen = false;
					checkMessage = null;
				}, 1500);
			} else {
				isSuccess = false;
				checkMessage =
					"Sesi belum terdeteksi aktif. Pastikan Anda telah berhasil login di tab baru.";
			}
		} catch {
			isSuccess = false;
			checkMessage = "Gagal memverifikasi sesi. Silakan coba beberapa saat lagi.";
		} finally {
			isChecking = false;
		}
	}

	function closeModal() {
		isOpen = false;
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
		role="dialog"
		aria-modal="true"
		aria-labelledby="session-expired-title"
	>
		<div
			class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-200"
		>
			<!-- Icon & Title -->
			<div class="flex items-start gap-3.5">
				<div
					class="size-11 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600"
				>
					<svg
						class="size-6"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
						/>
					</svg>
				</div>
				<div>
					<h3 id="session-expired-title" class="text-base font-bold text-gray-900 leading-snug">
						Sesi Login Anda Telah Berakhir
					</h3>
					<p class="text-xs text-gray-500 mt-1">
						Demi keamanan, sesi admin otomatis berakhir setelah periode tertentu.
					</p>
				</div>
			</div>

			<!-- Notice box -->
			<div
				class="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 leading-relaxed"
			>
				<p class="font-semibold mb-1 flex items-center gap-1.5 text-amber-950">
					<span>🛡️</span> Data Anda Tidak Hilang!
				</p>
				<p>
					Formulir yang sedang Anda isi tetap tersimpan di halaman ini. Buka tab baru untuk login
					kembali, lalu lanjutkan pekerjaan Anda tanpa harus mengulang dari awal.
				</p>
			</div>

			<!-- Feedback status message -->
			{#if checkMessage}
				<div
					class={`p-3 rounded-xl text-xs flex items-center gap-2 ${
						isSuccess
							? "bg-emerald-50 border border-emerald-200 text-emerald-800"
							: "bg-red-50 border border-red-200 text-red-800"
					}`}
				>
					<svg class="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
						{#if isSuccess}
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						{:else}
							<path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						{/if}
					</svg>
					<span>{checkMessage}</span>
				</div>
			{/if}

			<!-- Action buttons -->
			<div class="space-y-2 pt-2">
				<button
					type="button"
					onclick={openLoginTab}
					class="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
				>
					<span>Buka Halaman Login (Tab Baru)</span>
					<svg
						class="size-3.5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
						/>
					</svg>
				</button>

				<button
					type="button"
					onclick={checkSession}
					disabled={isChecking}
					class="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
				>
					{#if isChecking}
						<svg class="animate-spin size-3.5 text-gray-600" viewBox="0 0 24 24" fill="none">
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
						<span>Memeriksa Sesi...</span>
					{:else}
						<span>Saya Sudah Login (Cek Status Sesi)</span>
					{/if}
				</button>

				<button
					type="button"
					onclick={closeModal}
					class="w-full py-2 px-4 text-gray-500 hover:text-gray-700 text-xs font-medium text-center transition cursor-pointer"
				>
					Tutup Sementara
				</button>
			</div>
		</div>
	</div>
{/if}
