import { Schema } from "effect";

export const CreateTeamMemberSchema = Schema.Struct({
	name: Schema.NonEmptyTrimmedString,
	role: Schema.optional(Schema.NullOr(Schema.String)),
	photoUrl: Schema.optional(Schema.NullOr(Schema.String)),
	phone: Schema.optional(Schema.NullOr(Schema.String)),
	email: Schema.optional(Schema.NullOr(Schema.String)),
	order: Schema.optional(Schema.Number),
	isActive: Schema.optional(Schema.Boolean),
});

export const UpdateTeamMemberSchema = Schema.Struct({
	name: Schema.optional(Schema.NonEmptyTrimmedString),
	role: Schema.optional(Schema.NullOr(Schema.String)),
	photoUrl: Schema.optional(Schema.NullOr(Schema.String)),
	phone: Schema.optional(Schema.NullOr(Schema.String)),
	email: Schema.optional(Schema.NullOr(Schema.String)),
	order: Schema.optional(Schema.Number),
	isActive: Schema.optional(Schema.Boolean),
});
