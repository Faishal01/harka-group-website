import { Schema } from "effect";

export const CreateTeamMemberSchema = Schema.Struct({
	name: Schema.NonEmptyTrimmedString,
	role: Schema.optional(Schema.NullOr(Schema.TrimmedString)),
	photoUrl: Schema.optional(Schema.NullOr(Schema.TrimmedString)),
	phone: Schema.optional(Schema.NullOr(Schema.TrimmedString)),
	email: Schema.optional(Schema.NullOr(Schema.TrimmedString)),
	order: Schema.optional(Schema.Number),
	isActive: Schema.optional(Schema.Boolean),
});

export const UpdateTeamMemberSchema = Schema.Struct({
	name: Schema.optional(Schema.NonEmptyTrimmedString),
	role: Schema.optional(Schema.NullOr(Schema.TrimmedString)),
	photoUrl: Schema.optional(Schema.NullOr(Schema.TrimmedString)),
	phone: Schema.optional(Schema.NullOr(Schema.TrimmedString)),
	email: Schema.optional(Schema.NullOr(Schema.TrimmedString)),
	order: Schema.optional(Schema.Number),
	isActive: Schema.optional(Schema.Boolean),
});
