export class DatabaseError extends Error {
	readonly _tag = "DatabaseError";
	readonly status = 500;
	readonly cause?: unknown;
	constructor(args: { cause: unknown; message?: string }) {
		super(args.message ?? "Terjadi kesalahan pada basis data");
		this.name = "DatabaseError";
		this.cause = args.cause;
	}
}

export class CarNotFoundError extends Error {
	readonly _tag = "CarNotFoundError";
	readonly status = 404;
	readonly id: string;
	constructor(args: { id: string; message?: string }) {
		super(args.message ?? `Mobil ID ${args.id} tidak ditemukan`);
		this.name = "CarNotFoundError";
		this.id = args.id;
	}
}

export class TradeInNotFoundError extends Error {
	readonly _tag = "TradeInNotFoundError";
	readonly status = 404;
	readonly id: string;
	constructor(args: { id: string; message?: string }) {
		super(args.message ?? `Pengajuan ID ${args.id} tidak ditemukan`);
		this.name = "TradeInNotFoundError";
		this.id = args.id;
	}
}

export class StorageFileNotFoundError extends Error {
	readonly _tag = "StorageFileNotFoundError";
	readonly status = 404;
	readonly id: string;
	constructor(args: { id: string; message?: string }) {
		super(args.message ?? `Berkas ${args.id} tidak ditemukan`);
		this.name = "StorageFileNotFoundError";
		this.id = args.id;
	}
}

export class ValidationError extends Error {
	readonly _tag = "ValidationError";
	readonly status = 400;
	readonly details?: unknown;
	constructor(args: { message: string; details?: unknown }) {
		super(args.message);
		this.name = "ValidationError";
		this.details = args.details;
	}
}

export class R2Error extends Error {
	readonly _tag = "R2Error";
	readonly status = 502;
	readonly cause?: unknown;
	constructor(args: { cause: unknown; message?: string }) {
		super(args.message ?? "Operasi penyimpanan Cloudflare R2 gagal");
		this.name = "R2Error";
		this.cause = args.cause;
	}
}
