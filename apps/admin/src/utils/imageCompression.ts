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

	// Fill white background to prevent transparent png turning black
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

/**
 * Adaptively compresses an array of car photo Files so that the combined
 * total payload does NOT exceed the 5 MB limit (matching Trade-In).
 */
export async function compressCarImages(
	files: File[],
	onProgress?: (current: number, total: number) => void,
): Promise<{ compressed: File[]; totalBytes: number }> {
	if (files.length === 0) {
		return { compressed: [], totalBytes: 0 };
	}

	// 1. Preload all images
	const loadedImages: { file: File; img: HTMLImageElement }[] = [];
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const img = await loadImage(file);
		loadedImages.push({ file, img });
		if (onProgress) {
			onProgress(i + 1, files.length);
		}
	}

	// 2. Multi-tier compression parameters to guarantee < 5 MB
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
		const results: File[] = [];
		let totalBytes = 0;

		for (const { file, img } of loadedImages) {
			const { blob, size } = await compressSingleImage(img, file.name, maxDimension, quality);
			const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
			const compressedFile = new File([blob], cleanName, { type: "image/jpeg" });
			results.push(compressedFile);
			totalBytes += size;
		}

		// If totalBytes satisfies constraint or this is our most aggressive attempt, return
		if (totalBytes <= MAX_TOTAL_BYTES || attemptIdx === attempts.length - 1) {
			return { compressed: results, totalBytes };
		}
	}

	return { compressed: [], totalBytes: 0 };
}
