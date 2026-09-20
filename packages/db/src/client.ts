import { drizzle, type DrizzleD1Database, type AnyD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Database = DrizzleD1Database<typeof schema>;

export interface D1Env {
	DB: AnyD1Database;
}

export function getDb(env: D1Env | AnyD1Database): Database {
	const client = typeof env === "object" && env !== null && "DB" in env ? env.DB : env;
	return drizzle(client, { schema });
}
