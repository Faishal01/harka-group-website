import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb(env: Cloudflare.Env) {
	return drizzle(env.DB, { schema });
}
