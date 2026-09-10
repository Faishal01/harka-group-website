import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const cars = sqliteTable("cars", {
	id: text("id").primaryKey(), // The slug
	title: text("title").notNull(),
	image: text("image"),
	imageAlt: text("image_alt").default(""),
	gallery: text("gallery", { mode: "json" }).$type<{ image: string; alt: string }[]>(),
	videoTourUrl: text("video_tour_url"),
	excerpt: text("excerpt"),
	publishDate: integer("publish_date", { mode: "timestamp" }).notNull(),
	deletedAt: integer("deleted_at", { mode: "timestamp" }),
	archiveReason: text("archive_reason", { enum: ["sold", "removed"] }),

	general: text("general", { mode: "json" })
		.$type<{
			make: string;
			model: string;
			type?: string;
			price: number;
			bodyType: "SUV" | "Sedan" | "Hatchback" | "Coupe" | "Convertible" | "Pickup";
			drivetrain?:
				"Front-Wheel Drive" | "Rear-Wheel Drive" | "All-Wheel Drive" | "Four-Wheel Drive";
			doors: number;
			seatingCapacity: number;
			condition?: "New" | "Used" | "Certified Pre-Owned";
		}>()
		.notNull(),

	history: text("history", { mode: "json" })
		.$type<{
			mileage: number;
			year: number;
			previousOwners?: number;
			accidentHistory?: "No" | "Yes - Minor Damage" | "Yes - Major Repair";
		}>()
		.notNull(),

	technical: text("technical", { mode: "json" })
		.$type<{
			horsePower: number;
			transmission: "Automatic" | "Manual" | "CVT" | "Dual-Clutch";
			engineSizeCC: number;
			gears?: number;
			cylinders?: number;
			weight?: number;
		}>()
		.notNull(),

	efficiency: text("efficiency", { mode: "json" })
		.$type<{
			fuelType: "Petrol" | "Diesel" | "Hybrid" | "Electric" | "CNG";
			fuelEfficiencyMPG?: number;
			fuelEfficiencyLPer100KM?: number;
			emissionsCO2?: string;
			emissionsRating?: string;
		}>()
		.notNull(),

	options: text("options", { mode: "json" }).$type<string[]>(),

	security: text("security", { mode: "json" }).$type<{
		alarm?: boolean;
		immobilizer?: boolean;
		airbags?: number;
		abs?: boolean;
		esp?: boolean;
		tireCondition?: "New" | "Good" | "Needs Replacement";
		safetyRating?: string;
	}>(),

	exterior: text("exterior", { mode: "json" })
		.$type<{
			color: string;
			paintType?: "Metallic" | "Pearl" | "Matte";
			wheelSize?: number;
			wheelType?: "Alloy" | "Steel" | "Carbon Fiber";
		}>()
		.notNull(),

	interior: text("interior", { mode: "json" }).$type<{
		materialSeats?: string;
		heatedSeats?: boolean;
		ventilatedSeats?: boolean;
	}>(),

	misc: text("misc", { mode: "json" }).$type<{
		vin?: string;
		registrationStatus?: "Registered" | "Unregistered" | "Registration Pending";
		warranty?: string;
		dealerNotes?: string;
		hidden?: boolean;
		featured?: boolean;
	}>(),
});

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
	image: text("image"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId").notNull().references(() => user.id)
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId").notNull().references(() => user.id),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
	refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
	scope: text("scope"),
	password: text("password"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	createdAt: integer("createdAt", { mode: "timestamp" }),
	updatedAt: integer("updatedAt", { mode: "timestamp" })
});

export const adminWhitelist = sqliteTable("admin_whitelist", {
	email: text("email").primaryKey(),
	createdAt: integer("created_at", { mode: "timestamp" }),
});
