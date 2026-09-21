import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { BodyType, FuelType, OwnershipStatus, Transmission } from "./constants";

export const cars = sqliteTable(
	"cars",
	{
		// Identification & Listing Meta
		id: text("id").primaryKey(), // 12-character NanoID
		title: text("title").notNull(),
		excerpt: text("excerpt"), // Description & highlights
		relatedUrl: text("related_url"),

		// Core Vehicle Specs (Searchable & Filtered)
		make: text("make").notNull(),
		model: text("model").notNull(),
		price: integer("price").notNull(), // IDR
		year: integer("year").notNull(),
		mileage: integer("mileage").notNull(), // km
		bodyType: text("body_type").$type<BodyType>().notNull(),
		fuelType: text("fuel_type").$type<FuelType>().notNull(),
		transmission: text("transmission").$type<Transmission>().notNull(),
		color: text("color").notNull(),

		// Performance
		horsePower: integer("horse_power"),
		engineSizeCC: integer("engine_size_cc"),

		// Provenance & Legalitas
		ownershipStatus: text("ownership_status").$type<OwnershipStatus>(),
		isFloodFree: integer("is_flood_free", { mode: "boolean" }).notNull().default(false),
		isAccidentFree: integer("is_accident_free", { mode: "boolean" }).notNull().default(false),
		taxExpirationDate: integer("tax_expiration_date", { mode: "timestamp" }),
		seatingCapacity: integer("seating_capacity"),

		// Admin-Only Internal Vehicle Data
		plateNumber: text("plate_number"),

		// Media (Single JSON Column)
		gallery: text("gallery", { mode: "json" }).$type<{ image: string; alt: string }[]>(),

		// Flags & Lifecycle
		hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
		archiveReason: text("archive_reason", { enum: ["sold", "removed"] }),

		// Timestamps
		publishDate: integer("publish_date", { mode: "timestamp" }).notNull(),
		deletedAt: integer("deleted_at", { mode: "timestamp" }),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
	},
	(table) => [
		index("cars_make_model_idx").on(table.make, table.model),
		index("cars_price_idx").on(table.price),
		index("cars_year_idx").on(table.year),
		index("cars_mileage_idx").on(table.mileage),
		index("cars_body_type_idx").on(table.bodyType),
		index("cars_fuel_type_idx").on(table.fuelType),
		index("cars_ownership_status_idx").on(table.ownershipStatus),
		index("cars_deleted_at_idx").on(table.deletedAt),
		index("cars_publish_date_idx").on(table.publishDate),
	],
);

export type Car = typeof cars.$inferSelect;
export type InsertCar = typeof cars.$inferInsert;

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
	image: text("image"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
		token: text("token").notNull().unique(),
		createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
		updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
		ipAddress: text("ipAddress"),
		userAgent: text("userAgent"),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = sqliteTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("accountId").notNull(),
		providerId: text("providerId").notNull(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("accessToken"),
		refreshToken: text("refreshToken"),
		idToken: text("idToken"),
		accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
		refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
		scope: text("scope"),
		password: text("password"),
		createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
		updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
	},
	(table) => [
		index("account_user_id_idx").on(table.userId),
		uniqueIndex("account_provider_account_idx").on(table.providerId, table.accountId),
	],
);

export const verification = sqliteTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
		createdAt: integer("createdAt", { mode: "timestamp" }),
		updatedAt: integer("updatedAt", { mode: "timestamp" }),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const adminWhitelistRoleEnum = ["superadmin", "admin"] as const;
export type AdminWhitelistRole = (typeof adminWhitelistRoleEnum)[number];

export const adminWhitelist = sqliteTable("admin_whitelist", {
	email: text("email").primaryKey(),
	role: text("role", { enum: adminWhitelistRoleEnum }).notNull().default("admin"),
	createdBy: text("created_by"),
	createdAt: integer("created_at", { mode: "timestamp" }),
});

export type AdminWhitelist = typeof adminWhitelist.$inferSelect;
export type InsertAdminWhitelist = typeof adminWhitelist.$inferInsert;

export interface TradeInPhoto {
	slot: string;
	label: string;
	url: string;
}

export const tradeInSubmissions = sqliteTable(
	"trade_in_submissions",
	{
		id: text("id").primaryKey(), // 12-character NanoID

		// Customer Contact
		customerName: text("customer_name").notNull(),
		customerPhone: text("customer_phone").notNull(),
		customerCity: text("customer_city").notNull(),
		customerEmail: text("customer_email"),

		// Vehicle Specs
		make: text("make").notNull(),
		model: text("model").notNull(),
		year: integer("year").notNull(),
		mileage: integer("mileage").notNull(), // km
		transmission: text("transmission").notNull(),
		fuelType: text("fuel_type"),
		sellingPrice: integer("selling_price").notNull(), // IDR

		// Administration & Legalitas
		plateNumber: text("plate_number"),
		ownershipStatus: text("ownership_status").$type<OwnershipStatus>().notNull(),
		stnkStatus: text("stnk_status", { enum: ["active", "expired"] }).notNull(),
		stnkTaxExpiry: text("stnk_tax_expiry"), // e.g. "10/2026"
		hasFaktur: integer("has_faktur", { mode: "boolean" }).notNull().default(false),
		hasServiceBook: integer("has_service_book", { mode: "boolean" }).notNull().default(false),
		hasSpareKey: integer("has_spare_key", { mode: "boolean" }).notNull().default(false),
		adminNotes: text("admin_notes"),

		// Condition & History
		isFloodFree: integer("is_flood_free", { mode: "boolean" }).notNull().default(false),
		isAccidentFree: integer("is_accident_free", { mode: "boolean" }).notNull().default(false),
		conditionNotes: text("condition_notes"),

		// Media
		photos: text("photos", { mode: "json" }).$type<TradeInPhoto[]>().notNull(),

		// Timestamps
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
	},
	(table) => [
		index("trade_in_created_at_idx").on(table.createdAt),
		index("trade_in_customer_phone_idx").on(table.customerPhone),
	],
);

export type TradeInSubmission = typeof tradeInSubmissions.$inferSelect;
export type InsertTradeInSubmission = typeof tradeInSubmissions.$inferInsert;

