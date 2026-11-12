import { Schema } from "effect";
import { BodyTypeSchema, TransmissionSchema, CropDataSchema, CoerceNumber } from "./car";

export const PromoModeSchema = Schema.Literal("filter", "custom");

export const PromoFilterParamsSchema = Schema.Struct({
	make: Schema.optional(Schema.NullOr(Schema.String)),
	bodyType: Schema.optional(Schema.NullOr(BodyTypeSchema)),
	transmission: Schema.optional(Schema.NullOr(TransmissionSchema)),
	maxPrice: Schema.optional(Schema.NullOr(CoerceNumber)),
	minYear: Schema.optional(Schema.NullOr(CoerceNumber)),
	maxMileage: Schema.optional(Schema.NullOr(CoerceNumber)),
});

export const CreatePromoInputSchema = Schema.Struct({
	title: Schema.NonEmptyTrimmedString,
	slug: Schema.optional(Schema.NonEmptyTrimmedString),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	bannerImage: Schema.NonEmptyTrimmedString,
	bannerOriginalImage: Schema.optional(Schema.NullOr(Schema.String)),
	bannerCropData: Schema.optional(Schema.NullOr(CropDataSchema)),
	mode: Schema.optionalWith(PromoModeSchema, { default: () => "filter" }),
	filterParams: Schema.optional(Schema.NullOr(PromoFilterParamsSchema)),
	customCarIds: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
	isActive: Schema.optionalWith(Schema.Boolean, { default: () => true }),
	startDate: Schema.optional(Schema.NullOr(Schema.Union(Schema.Date, Schema.String, Schema.Number))),
	endDate: Schema.optional(Schema.NullOr(Schema.Union(Schema.Date, Schema.String, Schema.Number))),
	order: Schema.optionalWith(CoerceNumber, { default: () => 0 }),
});

export const UpdatePromoInputSchema = Schema.Struct({
	title: Schema.optional(Schema.NonEmptyTrimmedString),
	slug: Schema.optional(Schema.NonEmptyTrimmedString),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	bannerImage: Schema.optional(Schema.NonEmptyTrimmedString),
	bannerOriginalImage: Schema.optional(Schema.NullOr(Schema.String)),
	bannerCropData: Schema.optional(Schema.NullOr(CropDataSchema)),
	mode: Schema.optional(PromoModeSchema),
	filterParams: Schema.optional(Schema.NullOr(PromoFilterParamsSchema)),
	customCarIds: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
	isActive: Schema.optional(Schema.Boolean),
	startDate: Schema.optional(Schema.NullOr(Schema.Union(Schema.Date, Schema.String, Schema.Number))),
	endDate: Schema.optional(Schema.NullOr(Schema.Union(Schema.Date, Schema.String, Schema.Number))),
	order: Schema.optional(CoerceNumber),
});

export type CreatePromoInput = Schema.Schema.Type<typeof CreatePromoInputSchema>;
export type UpdatePromoInput = Schema.Schema.Type<typeof UpdatePromoInputSchema>;
