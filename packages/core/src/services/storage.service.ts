import { Effect, Option } from "effect";
import { R2Client } from "../clients/r2";
import { StorageFileNotFoundError, ValidationError } from "../errors";

export interface StreamedImageResponse {
	readonly body: ReadableStream | ArrayBuffer;
	readonly headers: Headers;
}

export interface UploadedFileUrl {
	readonly url: string;
}

export interface UploadedTradeInPhoto {
	readonly slot: string;
	readonly label: string;
	readonly url: string;
}

export interface UploadedTradeInDocument {
	readonly type: string;
	readonly label: string;
	readonly url: string;
	readonly filename: string;
	readonly size: number;
}

export const streamImage = (id: string) =>
	Effect.gen(function* () {
		if (!id) {
			return yield* Effect.fail(new ValidationError({ message: "Image id is required" }));
		}

		// Normalize id to strip any leading slashes or redundant api/images/ prefix
		const cleanId = id.replace(/^\/?(api\/images\/)+/, "").replace(/^\/+/, "");

		const r2 = yield* R2Client;
		const maybeObject = yield* r2.get(cleanId);

		if (Option.isNone(maybeObject)) {
			return yield* Effect.fail(new StorageFileNotFoundError({ id: cleanId }));
		}

		const object = maybeObject.value;
		const headers = new Headers();
		object.writeHttpMetadata(headers);
		headers.set("etag", object.httpEtag);
		headers.set("cache-control", "public, max-age=31536000, immutable");

		return {
			body: object.body as unknown as ReadableStream,
			headers,
		};
	});

export const uploadGalleryImages = (files: File[]) =>
	Effect.gen(function* () {
		if (!files || files.length === 0) {
			return yield* Effect.fail(new ValidationError({ message: "No files uploaded" }));
		}

		const r2 = yield* R2Client;
		const urls: string[] = [];

		for (const file of files) {
			if (file.size > 0) {
				const arrayBuffer = yield* Effect.tryPromise({
					try: () => file.arrayBuffer(),
					catch: (cause) =>
						new ValidationError({
							message: `Failed to read file ${file.name}`,
							details: cause,
						}),
				});

				const ext = file.name.split(".").pop() || "jpg";
				const uniqueId = Math.random().toString(36).substring(2, 15);
				const filename = `gallery-${Date.now()}-${uniqueId}.${ext}`;

				yield* r2.put(filename, arrayBuffer, {
					httpMetadata: { contentType: file.type || "image/jpeg" },
				});

				urls.push(`/api/images/${filename}`);
			}
		}

		return urls;
	});

export const uploadTradeInPhoto = (file: File, tradeInId: string, slot: string, label: string) =>
	Effect.gen(function* () {
		if (!file || file.size === 0) {
			return yield* Effect.fail(
				new ValidationError({
					message: `Foto untuk '${label}' tidak ditemukan atau kosong.`,
				}),
			);
		}

		const r2 = yield* R2Client;
		const buffer = yield* Effect.tryPromise({
			try: () => file.arrayBuffer(),
			catch: (cause) =>
				new ValidationError({
					message: `Gagal membaca berkas ${label}`,
					details: cause,
				}),
		});

		const timestamp = Date.now();
		const r2Key = `trade-in/tradein-${tradeInId}-${slot}-${timestamp}.jpg`;

		yield* r2.put(r2Key, buffer, {
			httpMetadata: { contentType: "image/jpeg" },
		});

		return {
			slot,
			label,
			url: `/api/images/${r2Key}`,
		} satisfies UploadedTradeInPhoto;
	});

export const uploadSPHDocument = (file: File, tradeInId: string) =>
	Effect.gen(function* () {
		if (!file || file.size === 0) {
			return yield* Effect.fail(
				new ValidationError({
					message: "Surat Pelepasan Hak (SPH) wajib diunggah untuk mobil atas nama perusahaan.",
				}),
			);
		}

		const maxSizeBytes = 4 * 1024 * 1024;
		if (file.size > maxSizeBytes) {
			return yield* Effect.fail(
				new ValidationError({
					message: "Ukuran berkas SPH melebihi batas maksimal 4 MB.",
				}),
			);
		}

		const origName = file.name || "dokumen-sph.pdf";
		const ext = origName.split(".").pop()?.toLowerCase() || "";
		const allowedMimeTypes: Record<string, string> = {
			pdf: "application/pdf",
			doc: "application/msword",
			docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		};

		if (!allowedMimeTypes[ext]) {
			return yield* Effect.fail(
				new ValidationError({
					message: "Format berkas SPH harus berupa PDF, DOC, atau DOCX.",
				}),
			);
		}

		const contentType =
			file.type && file.type !== "application/octet-stream" ? file.type : allowedMimeTypes[ext];

		const r2 = yield* R2Client;
		const buffer = yield* Effect.tryPromise({
			try: () => file.arrayBuffer(),
			catch: (cause) =>
				new ValidationError({
					message: "Gagal membaca berkas SPH",
					details: cause,
				}),
		});

		const timestamp = Date.now();
		const r2Key = `documents/tradein-${tradeInId}-sph-${timestamp}.${ext}`;

		yield* r2.put(r2Key, buffer, {
			httpMetadata: { contentType },
		});

		return {
			type: "sph",
			label: "Surat Pelepasan Hak (SPH)",
			url: `/api/images/${r2Key}`,
			filename: origName,
			size: file.size,
		} satisfies UploadedTradeInDocument;
	});

export const uploadTeamMemberPhoto = (file: File, memberId: string) =>
	Effect.gen(function* () {
		if (!file || file.size === 0) {
			return yield* Effect.fail(
				new ValidationError({ message: "Foto anggota tim tidak boleh kosong." }),
			);
		}

		const origName = file.name || "photo.jpg";
		const ext = origName.split(".").pop()?.toLowerCase() || "jpg";
		const allowedExts = ["jpg", "jpeg", "png", "webp"];
		if (!allowedExts.includes(ext)) {
			return yield* Effect.fail(
				new ValidationError({ message: "Format foto harus berupa JPG, PNG, atau WEBP." }),
			);
		}

		const r2 = yield* R2Client;
		const buffer = yield* Effect.tryPromise({
			try: () => file.arrayBuffer(),
			catch: (cause) =>
				new ValidationError({
					message: "Gagal membaca berkas foto",
					details: cause,
				}),
		});

		const timestamp = Date.now();
		const r2Key = `team/member-${memberId}-${timestamp}.${ext}`;
		const contentType = file.type || `image/${ext === "jpg" ? "jpeg" : ext}`;

		yield* r2.put(r2Key, buffer, {
			httpMetadata: { contentType },
		});

		return `/api/images/${r2Key}`;
	});

export const deleteStorageFile = (urlOrKey: string) =>
	Effect.gen(function* () {
		if (!urlOrKey) return;
		const cleanKey = urlOrKey.replace(/^\/?(api\/images\/)+/, "").replace(/^\/+/, "");
		const r2 = yield* R2Client;
		yield* r2.delete(cleanKey);
	});
