import { Layer } from "effect";
import { makeDatabaseLayer } from "./clients/database";
import { makeR2Layer } from "./clients/r2";
import type { getDb } from "@harka/db";

export interface CoreEnv {
	DB: Parameters<typeof getDb>[0];
	IMAGES_BUCKET: R2Bucket;
}

export const makeCoreLayer = (env: CoreEnv) =>
	Layer.mergeAll(
		makeDatabaseLayer(env.DB),
		makeR2Layer(env.IMAGES_BUCKET),
	);
