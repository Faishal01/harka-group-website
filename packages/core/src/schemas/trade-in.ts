import { Schema } from "effect";
import { OwnershipStatusSchema } from "./car";

export const TradeInStatusSchema = Schema.Literal(
	"pending",
	"approved",
	"rejected",
);

export const STNKStatusSchema = Schema.Literal("active", "expired");

export const TradeInPhotoSchema = Schema.Struct({
	slot: Schema.String,
	label: Schema.String,
	url: Schema.String,
});

export const TradeInDocumentSchema = Schema.Struct({
	type: Schema.String,
	label: Schema.String,
	url: Schema.String,
	filename: Schema.optional(Schema.String),
	size: Schema.optional(Schema.Number),
});

export class UpdateTradeInStatusSchema extends Schema.Class<
	UpdateTradeInStatusSchema
>("UpdateTradeInStatus")({
	status: TradeInStatusSchema,
}) {}

export const PhotoMetaItemSchema = Schema.Struct({
	slot: Schema.String,
	label: Schema.String,
	fieldName: Schema.String,
});

export const PhotoMetaArraySchema = Schema.Array(PhotoMetaItemSchema);
