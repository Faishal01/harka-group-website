import { Context, Effect, Layer, Option } from "effect";
import { R2Error } from "../errors";

export { R2Error };

export class R2Client extends Context.Tag("harka/R2Client")<
	R2Client,
	{
		readonly get: (key: string) => Effect.Effect<Option.Option<R2ObjectBody>, R2Error>;
		readonly put: (
			key: string,
			value: ArrayBuffer | ArrayBufferView | ReadableStream | string | Blob,
			options?: R2PutOptions,
		) => Effect.Effect<R2Object, R2Error>;
		readonly delete: (key: string | string[]) => Effect.Effect<void, R2Error>;
	}
>() {}

export const makeR2Layer = (bucket: R2Bucket) =>
	Layer.succeed(
		R2Client,
		R2Client.of({
			get: (key) =>
				Effect.tryPromise({
					try: () => bucket.get(key),
					catch: (cause) => new R2Error({ cause }),
				}).pipe(Effect.map(Option.fromNullable)),
			put: (key, value, options) =>
				Effect.tryPromise({
					try: () => bucket.put(key, value, options),
					catch: (cause) => new R2Error({ cause }),
				}),
			delete: (key) =>
				Effect.tryPromise({
					try: () => bucket.delete(key),
					catch: (cause) => new R2Error({ cause }),
				}),
		}),
	);
