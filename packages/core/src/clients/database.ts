import { Context, Layer } from "effect";
import { getDb, type Database } from "@harka/db";

export class DatabaseClient extends Context.Tag("harka/DatabaseClient")<
	DatabaseClient,
	Database
>() {}

export const makeDatabaseLayer = (db: Parameters<typeof getDb>[0]) =>
	Layer.succeed(DatabaseClient, getDb(db));
