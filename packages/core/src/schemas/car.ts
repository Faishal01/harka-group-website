import { Schema } from "effect";

export const BodyTypeSchema = Schema.Literal(
	"SUV",
	"Sedan",
	"Hatchback",
	"Pickup",
	"MPV",
);

export const FuelTypeSchema = Schema.Literal(
	"Petrol",
	"Diesel",
	"Hybrid",
	"Electric",
);

export const TransmissionSchema = Schema.Literal(
	"Automatic",
	"Manual",
	"CVT",
	"Dual-Clutch",
);

export const OwnershipStatusSchema = Schema.Literal(
	"first_hand",
	"second_hand",
	"company_car",
	"leasing",
);

export const CarGalleryItemSchema = Schema.Struct({
	image: Schema.String,
	alt: Schema.optionalWith(Schema.String, { default: () => "" }),
});

export const CoerceNumber = Schema.Union(Schema.Number, Schema.NumberFromString);

export class CarFilterParamsSchema extends Schema.Class<CarFilterParamsSchema>(
	"CarFilterParams",
)({
	make: Schema.optional(Schema.String),
	model: Schema.optional(Schema.String),
	yearFrom: Schema.optional(Schema.String),
	yearTo: Schema.optional(Schema.String),
	price: Schema.optional(Schema.String),
	mileageFrom: Schema.optional(Schema.String),
	mileageTo: Schema.optional(Schema.String),
	fuelType: Schema.optional(Schema.String),
	bodyType: Schema.optional(Schema.String),
	transmission: Schema.optional(Schema.String),
	color: Schema.optional(Schema.String),
	ownershipStatus: Schema.optional(Schema.String),
	condition: Schema.optional(Schema.String),
	search: Schema.optional(Schema.String),
	sort: Schema.optional(
		Schema.Literal(
			"price-asc",
			"price-desc",
			"mileage-asc",
			"mileage-desc",
			"year-asc",
			"year-desc",
		),
	),
	page: Schema.optional(CoerceNumber),
	limit: Schema.optional(CoerceNumber),
}) {}

export class CreateCarInputSchema extends Schema.Class<CreateCarInputSchema>(
	"CreateCarInput",
)({
	title: Schema.optional(Schema.String),
	excerpt: Schema.optional(Schema.NullOr(Schema.String)),
	relatedUrl: Schema.optional(Schema.NullOr(Schema.String)),
	videoTourUrl: Schema.optional(Schema.NullOr(Schema.String)),
	make: Schema.NonEmptyTrimmedString,
	model: Schema.NonEmptyTrimmedString,
	price: CoerceNumber.pipe(Schema.clamp(0, 100_000_000_000)),
	year: CoerceNumber.pipe(Schema.clamp(1900, 2100)),
	mileage: CoerceNumber.pipe(Schema.clamp(0, 10_000_000)),
	bodyType: Schema.optionalWith(BodyTypeSchema, { default: () => "SUV" }),
	fuelType: Schema.optionalWith(FuelTypeSchema, { default: () => "Petrol" }),
	transmission: Schema.optionalWith(TransmissionSchema, {
		default: () => "Automatic",
	}),
	color: Schema.optionalWith(Schema.String, { default: () => "" }),
	horsePower: Schema.optional(Schema.NullOr(CoerceNumber)),
	engineSizeCC: Schema.optional(Schema.NullOr(CoerceNumber)),
	ownershipStatus: Schema.optional(Schema.NullOr(OwnershipStatusSchema)),
	isFloodFree: Schema.optionalWith(Schema.Boolean, { default: () => false }),
	isAccidentFree: Schema.optionalWith(Schema.Boolean, { default: () => false }),
	hasFloodDamage: Schema.optional(Schema.Boolean),
	hasAccidentDamage: Schema.optional(Schema.Boolean),
	taxExpirationDate: Schema.optional(Schema.NullOr(Schema.String)),
	seatingCapacity: Schema.optional(Schema.NullOr(CoerceNumber)),
	plateNumber: Schema.optional(Schema.NullOr(Schema.String)),
	gallery: Schema.optional(
		Schema.NullOr(Schema.Array(CarGalleryItemSchema)),
	),
	hidden: Schema.optionalWith(Schema.Boolean, { default: () => false }),
	fromTradeIn: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

export class UpdateCarInputSchema extends Schema.Class<UpdateCarInputSchema>(
	"UpdateCarInput",
)({
	title: Schema.optional(Schema.String),
	excerpt: Schema.optional(Schema.NullOr(Schema.String)),
	relatedUrl: Schema.optional(Schema.NullOr(Schema.String)),
	videoTourUrl: Schema.optional(Schema.NullOr(Schema.String)),
	make: Schema.NonEmptyTrimmedString,
	model: Schema.NonEmptyTrimmedString,
	price: CoerceNumber.pipe(Schema.clamp(0, 100_000_000_000)),
	year: CoerceNumber.pipe(Schema.clamp(1900, 2100)),
	mileage: CoerceNumber.pipe(Schema.clamp(0, 10_000_000)),
	bodyType: Schema.optionalWith(BodyTypeSchema, { default: () => "SUV" }),
	fuelType: Schema.optionalWith(FuelTypeSchema, { default: () => "Petrol" }),
	transmission: Schema.optionalWith(TransmissionSchema, {
		default: () => "Automatic",
	}),
	color: Schema.optionalWith(Schema.String, { default: () => "" }),
	horsePower: Schema.optional(Schema.NullOr(CoerceNumber)),
	engineSizeCC: Schema.optional(Schema.NullOr(CoerceNumber)),
	ownershipStatus: Schema.optional(Schema.NullOr(OwnershipStatusSchema)),
	isFloodFree: Schema.optionalWith(Schema.Boolean, { default: () => true }),
	isAccidentFree: Schema.optionalWith(Schema.Boolean, { default: () => true }),
	hasFloodDamage: Schema.optional(Schema.Boolean),
	hasAccidentDamage: Schema.optional(Schema.Boolean),
	taxExpirationDate: Schema.optional(Schema.NullOr(Schema.String)),
	seatingCapacity: Schema.optional(Schema.NullOr(CoerceNumber)),
	plateNumber: Schema.optional(Schema.NullOr(Schema.String)),
	gallery: Schema.optional(
		Schema.NullOr(Schema.Array(CarGalleryItemSchema)),
	),
	hidden: Schema.optionalWith(Schema.Boolean, { default: () => false }),
}) {}
