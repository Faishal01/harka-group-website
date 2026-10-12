export interface ImageSlotItem {
	slot: string;
	label: string;
	file: File;
}

export interface CompressedImageItem {
	slot: string;
	label: string;
	file: File;
	size: number;
}

const MAX_TOTAL_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Loads a File into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const objectUrl = URL.createObjectURL(file);
		img.onload = () => {
			URL.revokeObjectURL(objectUrl);
			resolve(img);
		};
		img.onerror = (err) => {
			URL.revokeObjectURL(objectUrl);
			reject(err);
		};
		img.src = objectUrl;
	});
}

/**
 * Compresses a single image via Canvas with specified max dimension and quality
 */
async function compressSingleImage(
	img: HTMLImageElement,
	originalName: string,
	maxDimension: number,
	quality: number,
): Promise<{ blob: Blob; size: number }> {
	let { width, height } = img;

	if (width > maxDimension || height > maxDimension) {
		if (width > height) {
			height = Math.round((height * maxDimension) / width);
			width = maxDimension;
		} else {
			width = Math.round((width * maxDimension) / height);
			height = maxDimension;
		}
	}

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Unable to create canvas 2d context for image compression");
	}

	// Draw white background in case of transparent png
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, width, height);
	ctx.drawImage(img, 0, 0, width, height);

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error(`Failed to compress image: ${originalName}`));
					return;
				}
				resolve({ blob, size: blob.size });
			},
			"image/jpeg",
			quality,
		);
	});
}

export interface CompressionProgress {
	phase: "loading" | "compressing" | "uploading";
	current: number;
	total: number;
	percent: number;
	message: string;
}

/**
 * Adaptively compresses all provided images so that the combined total size
 * does NOT exceed the 5 MB limit.
 */
export async function compressImagesBatch(
	items: ImageSlotItem[],
	onProgress?: (progress: CompressionProgress) => void,
): Promise<{ compressed: CompressedImageItem[]; totalBytes: number }> {
	if (items.length === 0) {
		return { compressed: [], totalBytes: 0 };
	}

	// 1. Preload all images (Phase: Loading, 0% - 30%)
	const loadedImages: { item: ImageSlotItem; img: HTMLImageElement }[] = [];
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		const img = await loadImage(item.file);
		loadedImages.push({ item, img });
		if (onProgress) {
			const percent = Math.round(((i + 1) / items.length) * 30);
			onProgress({
				phase: "loading",
				current: i + 1,
				total: items.length,
				percent,
				message: `Membaca foto ${i + 1} dari ${items.length}...`,
			});
		}
	}

	// 2. Multi-tier compression parameters to guarantee < 5 MB (Phase: Compressing, 30% - 85%)
	const attempts = [
		{ maxDimension: 1600, quality: 0.8 },
		{ maxDimension: 1400, quality: 0.75 },
		{ maxDimension: 1280, quality: 0.7 },
		{ maxDimension: 1024, quality: 0.65 },
		{ maxDimension: 900, quality: 0.6 },
		{ maxDimension: 800, quality: 0.5 },
	];

	for (let attemptIdx = 0; attemptIdx < attempts.length; attemptIdx++) {
		const { maxDimension, quality } = attempts[attemptIdx];
		const results: CompressedImageItem[] = [];
		let totalBytes = 0;

		for (let imgIdx = 0; imgIdx < loadedImages.length; imgIdx++) {
			const { item, img } = loadedImages[imgIdx];
			const { blob, size } = await compressSingleImage(img, item.file.name, maxDimension, quality);
			const cleanName = item.file.name.replace(/\.[^/.]+$/, "") + ".jpg";
			const file = new File([blob], cleanName, { type: "image/jpeg" });
			results.push({
				slot: item.slot,
				label: item.label,
				file,
				size,
			});
			totalBytes += size;

			if (onProgress) {
				const percent = 30 + Math.round(((imgIdx + 1) / loadedImages.length) * 55);
				onProgress({
					phase: "compressing",
					current: imgIdx + 1,
					total: loadedImages.length,
					percent,
					message: `Mengompresi foto ${imgIdx + 1} dari ${loadedImages.length}...`,
				});
			}
		}

		// If totalBytes satisfies constraint or this is our most aggressive attempt, return
		if (totalBytes <= MAX_TOTAL_BYTES || attemptIdx === attempts.length - 1) {
			return { compressed: results, totalBytes };
		}
	}

	return { compressed: [], totalBytes: 0 };
}
