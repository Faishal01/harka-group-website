<script lang="ts">
	import { untrack } from "svelte";
	import Cropper from "cropperjs";
	import "cropperjs/dist/cropper.css";

	interface Props {
		isOpen: boolean;
		imageSrc: string | null;
		fileName?: string;
		initialAspectRatio?: number | null;
		onApply: (croppedBlob: Blob, croppedUrl: string) => void;
		onCancel: () => void;
	}

	let { isOpen, imageSrc, initialAspectRatio = 4 / 3, onApply, onCancel }: Props = $props();

	let selectedRatio = $state<number | null>(initialAspectRatio);
	let isProcessing = $state(false);
	let isReady = $state(false);
	let imageElement = $state<HTMLImageElement | null>(null);

	// Keep Cropper instance non-reactive so mutating it never triggers $effect loops
	let cropper: Cropper | null = null;

	const ratioPresets: { id: string; label: string; value: number | null; desc: string }[] = [
		{
			id: "4:3",
			label: "4:3 (Katalog)",
			value: 4 / 3,
			desc: "Rekomendasi untuk tampilan kartu mobil",
		},
		{
			id: "16:9",
			label: "16:9 (Landscape)",
			value: 16 / 9,
			desc: "Format lebar / sinematik",
		},
		{
			id: "free",
			label: "Bebas",
			value: null,
			desc: "Atur ukuran secara fleksibel tanpa batasan",
		},
	];

	function isPresetActive(presetValue: number | null, current: number | null): boolean {
		if (presetValue === null && current === null) return true;
		if (presetValue === null || current === null) return false;
		return Math.abs(presetValue - current) < 0.001;
	}

	function destroyCropper() {
		if (cropper) {
			cropper.destroy();
			cropper = null;
		}
		isReady = false;
	}

	function initCropper() {
		if (!imageElement) return;
		destroyCropper();

		const ratioToUse = untrack(() => selectedRatio);

		cropper = new Cropper(imageElement, {
			aspectRatio: ratioToUse ?? NaN,
			viewMode: 1,
			dragMode: "move",
			autoCropArea: 0.95,
			restore: false,
			guides: true,
			center: true,
			highlight: false,
			cropBoxMovable: true,
			cropBoxResizable: true,
			toggleDragModeOnDblclick: false,
			checkCrossOrigin: false,
			checkOrientation: false,
			responsive: true,
			ready() {
				isReady = true;
			},
		});
	}

	function handleImageLoad() {
		if (!cropper) {
			initCropper();
		}
	}

	// Only react to modal open/close and imageSrc changes
	$effect(() => {
		if (isOpen && imageSrc) {
			const defaultRatio = untrack(() => initialAspectRatio);
			selectedRatio = defaultRatio;
			isReady = false;

			if (imageElement && imageElement.complete && imageElement.naturalWidth > 0) {
				initCropper();
			}
		} else {
			destroyCropper();
		}

		return () => {
			destroyCropper();
		};
	});

	function handleRatioChange(ratio: number | null) {
		selectedRatio = ratio;
		if (cropper) {
			cropper.setAspectRatio(ratio ?? NaN);
		}
	}

	function handleRotate(deg: number) {
		if (cropper && isReady) {
			cropper.rotate(deg);
		}
	}

	function handleZoom(ratio: number) {
		if (cropper && isReady) {
			cropper.zoom(ratio);
		}
	}

	function handleReset() {
		if (cropper && isReady) {
			cropper.reset();
			cropper.setAspectRatio(selectedRatio ?? NaN);
		}
	}

	async function handleApply() {
		if (!cropper || !isReady) return;
		isProcessing = true;

		try {
			const canvas = cropper.getCroppedCanvas({
				maxWidth: 2048,
				maxHeight: 2048,
				imageSmoothingEnabled: true,
				imageSmoothingQuality: "high",
			});

			if (!canvas) {
				throw new Error("Gagal mengambil area gambar yang dipotong.");
			}

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						isProcessing = false;
						return;
					}
					const croppedUrl = URL.createObjectURL(blob);
					isProcessing = false;
					onApply(blob, croppedUrl);
				},
				"image/jpeg",
				0.92,
			);
		} catch (err) {
			console.error("Error cropping image:", err);
			isProcessing = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape" && isOpen && !isProcessing) {
			onCancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && imageSrc}
	<!-- Modal Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fade-in"
		role="dialog"
		aria-modal="true"
		aria-labelledby="cropper-title"
	>
		<!-- Modal Window -->
		<div
			class="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-gray-200"
		>
			<!-- Header -->
			<div
				class="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80 shrink-0"
			>
				<div>
					<h3
						id="cropper-title"
						class="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="size-5 text-red-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						Sesuaikan & Potong Foto Mobil
					</h3>
					<p class="text-xs text-gray-500 mt-0.5">
						Atur posisi agar atap, roda, dan bodi mobil terlihat proporsional di katalog.
					</p>
				</div>
				<button
					type="button"
					onclick={onCancel}
					disabled={isProcessing}
					aria-label="Tutup modal"
					class="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition disabled:opacity-50 cursor-pointer"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="size-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Crop Stage Viewport (Block container with explicit height required by Cropper.js) -->
			<div
				class="relative w-full h-[50vh] sm:h-[55vh] min-h-[300px] max-h-[540px] bg-gray-950 overflow-hidden"
			>
				{#if !isReady}
					<div
						class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-gray-950 text-gray-400"
					>
						<div
							class="size-7 border-2 border-white/20 border-t-red-500 rounded-full animate-spin"
						></div>
						<span class="text-xs font-medium">Memuat gambar...</span>
					</div>
				{/if}
				<img
					bind:this={imageElement}
					src={imageSrc}
					alt="Pratinjau crop"
					onload={handleImageLoad}
					class="block max-w-full max-h-full opacity-0"
				/>
			</div>

			<!-- Control Toolbar -->
			<div class="p-4 sm:p-5 bg-white border-t border-gray-100 flex flex-col gap-4 shrink-0">
				<!-- Aspect Ratio Selector & Tools Row -->
				<div class="flex flex-wrap items-center justify-between gap-3">
					<!-- Ratio Buttons -->
					<div class="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
						{#each ratioPresets as preset (preset.id)}
							{@const active = isPresetActive(preset.value, selectedRatio)}
							<button
								type="button"
								onclick={() => handleRatioChange(preset.value)}
								class={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
									active
										? "bg-white text-red-700 shadow-xs ring-1 ring-gray-200"
										: "text-gray-600 hover:text-gray-900"
								}`}
								title={preset.desc}
							>
								{preset.label}
							</button>
						{/each}
					</div>

					<!-- Rotation & Zoom Action Buttons -->
					<div class="flex items-center gap-1 text-gray-600">
						<!-- Rotate CCW -->
						<button
							type="button"
							onclick={() => handleRotate(-90)}
							title="Putar 90° berlawanan jarum jam"
							class="p-2 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer border border-gray-200"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="size-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4"
								/>
							</svg>
						</button>

						<!-- Rotate CW -->
						<button
							type="button"
							onclick={() => handleRotate(90)}
							title="Putar 90° searah jarum jam"
							class="p-2 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer border border-gray-200"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="size-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4"
								/>
							</svg>
						</button>

						<div class="w-px h-6 bg-gray-200 mx-1"></div>

						<!-- Zoom Out -->
						<button
							type="button"
							onclick={() => handleZoom(-0.1)}
							title="Perkecil"
							class="p-2 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer border border-gray-200"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="size-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" />
							</svg>
						</button>

						<!-- Zoom In -->
						<button
							type="button"
							onclick={() => handleZoom(0.1)}
							title="Perbesar"
							class="p-2 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer border border-gray-200"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="size-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
							</svg>
						</button>

						<!-- Reset -->
						<button
							type="button"
							onclick={handleReset}
							title="Reset kembali ke semula"
							class="px-2.5 py-1.5 rounded-lg hover:bg-gray-100 hover:text-gray-900 text-xs font-medium transition cursor-pointer border border-gray-200 ml-1"
						>
							Reset
						</button>
					</div>
				</div>

				<!-- Helper Note & Bottom Action Buttons -->
				<div
					class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100"
				>
					<div class="text-xs text-gray-500 flex items-center gap-1.5">
						<span class="text-emerald-600 font-bold">💡 Tip:</span>
						Gunakan rasio <strong>4:3 (Katalog)</strong> agar bodi mobil dan atap terlihat utuh tanpa
						terpotong.
					</div>

					<div class="flex items-center gap-2 self-end sm:self-auto">
						<button
							type="button"
							onclick={onCancel}
							disabled={isProcessing}
							class="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition cursor-pointer disabled:opacity-50"
						>
							Batal
						</button>
						<button
							type="button"
							onclick={handleApply}
							disabled={isProcessing || !isReady}
							class="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm hover:shadow transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
						>
							{#if isProcessing}
								<div
									class="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
								></div>
								<span>Memproses...</span>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="size-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2.5"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
								<span>Terapkan Crop</span>
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
