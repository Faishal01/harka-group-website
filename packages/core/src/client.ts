import { Effect } from "effect";
import { makeCoreLayer } from "./layer";
import * as CarService from "./services/car.service";
import * as StorageService from "./services/storage.service";
import * as TradeInService from "./services/trade-in.service";
import type {
	Car,
	QueryOptions,
	TradeInQueryParams,
	PaginatedTradeInSubmissions,
	TradeInSubmission,
} from "@harka/db";

export interface CoreClient {
	cars: {
		getFiltered: (params: unknown, options?: QueryOptions) => Promise<Car[]>;
		getById: (id: string, options?: { adminView?: boolean }) => Promise<Car>;
		getDistinctModels: (
			make: string,
			options?: { adminView?: boolean },
		) => Promise<string[]>;
		create: (
			input: unknown,
		) => Promise<{ success: boolean; id: string; title: string }>;
		update: (
			id: string,
			input: unknown,
		) => Promise<{ success: boolean; id: string; title: string }>;
		softDelete: (
			id: string,
			reason?: "sold" | "removed",
		) => Promise<{ success: boolean; id: string }>;
		restore: (id: string) => Promise<{ success: boolean; id: string }>;
		hardDelete: (id: string) => Promise<{ success: boolean; id: string }>;
	};
	storage: {
		streamImage: (id: string) => Promise<Response>;
		uploadGalleryImages: (files: File[]) => Promise<string[]>;
	};
	tradeIn: {
		submit: (
			formData: FormData,
			webhookUrl?: string,
		) => Promise<{ success: boolean; id: string }>;
		getSubmissions: (
			params?: TradeInQueryParams,
		) => Promise<PaginatedTradeInSubmissions>;
		getById: (id: string) => Promise<TradeInSubmission>;
		updateStatus: (
			id: string,
			input: unknown,
			reviewer?: string,
		) => Promise<{
			success: boolean;
			status: "pending" | "approved" | "rejected";
			reviewedAt: string | null;
			reviewedBy: string | null;
		}>;
	};
	respond: <T>(
		callback: () => Promise<T>,
		options?: { status?: number; eventName?: string },
	) => Promise<Response>;
}

export function createCore(env: unknown): CoreClient {
	const layer = makeCoreLayer(env as any);

	const run = <A, E, R>(effect: Effect.Effect<A, E, R>): Promise<A> =>
		Effect.runPromise(
			effect.pipe(Effect.provide(layer)) as unknown as Effect.Effect<
				A,
				E,
				never
			>,
		);

	return {
		cars: {
			getFiltered: (params, options) =>
				run(CarService.getFilteredCars(params, options)),
			getById: (id, options) => run(CarService.getCarById(id, options)),
			getDistinctModels: (make, options) =>
				run(CarService.getDistinctModelsByMake(make, options?.adminView)),
			create: (input) => run(CarService.createCar(input)),
			update: (id, input) => run(CarService.updateCar(id, input)),
			softDelete: (id, reason) =>
				run(CarService.softDeleteCar(id, reason)),
			restore: (id) => run(CarService.restoreCar(id)),
			hardDelete: (id) => run(CarService.hardDeleteCar(id)),
		},
		storage: {
			streamImage: async (id: string): Promise<Response> => {
				try {
					const res = await run(StorageService.streamImage(id));
					return new Response(res.body as unknown as BodyInit, {
						headers: res.headers,
					});
				} catch (err: any) {
					if (err?._tag === "StorageFileNotFoundError" || err?.status === 404) {
						return new Response("Image not found", { status: 404 });
					}
					if (err?._tag === "ValidationError" || err?.status === 400) {
						return new Response(err.message, { status: 400 });
					}
					return new Response("Storage Error", { status: 502 });
				}
			},
			uploadGalleryImages: (files) =>
				run(StorageService.uploadGalleryImages(files)),
		},
		tradeIn: {
			submit: (formData, webhookUrl) =>
				run(TradeInService.submitTradeIn(formData, webhookUrl)),
			getSubmissions: (params) =>
				run(TradeInService.getTradeInSubmissions(params)),
			getById: (id) => run(TradeInService.getTradeInById(id)),
			updateStatus: (id, input, reviewer = "Admin") =>
				run(TradeInService.updateTradeInStatus(id, input, reviewer)),
		},
		respond: async <T>(
			callback: () => Promise<T>,
			options?: { status?: number; eventName?: string },
		): Promise<Response> => {
			try {
				const result = await callback();
				if (result instanceof Response) return result;
				return Response.json(result, { status: options?.status ?? 200 });
			} catch (err: any) {
				if (err && typeof err.status === "number") {
					return Response.json({ error: err.message }, { status: err.status });
				}
				console.error(
					JSON.stringify({
						event: options?.eventName ?? "api_error",
						error: err instanceof Error ? err.message : String(err),
						cause: err?.cause,
					}),
				);
				return Response.json(
					{ error: "Internal Server Error" },
					{ status: 500 },
				);
			}
		},
	};
}
