import { Effect } from "effect";
import {
	teamMembers as teamMembersTable,
	generateId,
	getTeamMembers as getTeamMembersFromDb,
	getTeamMemberById as getTeamMemberByIdFromDb,
	type TeamMember,
} from "@harka/db";
import { eq } from "drizzle-orm";
import { DatabaseClient } from "../clients/database";
import { DatabaseError, TeamMemberNotFoundError, ValidationError } from "../errors";
import { uploadTeamMemberPhoto, deleteStorageFile } from "./storage.service";

export interface TeamMemberInput {
	name: string;
	role?: string | null;
	phone?: string | null;
	email?: string | null;
	order?: number;
	isActive?: boolean;
}

export const getTeamMembers = (options: { activeOnly?: boolean } = {}) =>
	Effect.gen(function* () {
		const db = yield* DatabaseClient;
		return yield* Effect.tryPromise({
			try: () => getTeamMembersFromDb(db, options),
			catch: (cause) => new DatabaseError({ cause }),
		});
	});

export const getTeamMemberById = (id: string) =>
	Effect.gen(function* () {
		const db = yield* DatabaseClient;
		const member = yield* Effect.tryPromise({
			try: () => getTeamMemberByIdFromDb(db, id),
			catch: (cause) => new DatabaseError({ cause }),
		});

		if (!member) {
			return yield* Effect.fail(new TeamMemberNotFoundError({ id }));
		}

		return member;
	});

export const createTeamMember = (input: TeamMemberInput, photoFile?: File | null) =>
	Effect.gen(function* () {
		const trimmedName = input.name?.trim();
		if (!trimmedName) {
			return yield* Effect.fail(new ValidationError({ message: "Nama anggota tim wajib diisi." }));
		}

		const id = generateId();
		let photoUrl: string | null = null;

		if (photoFile && photoFile.size > 0) {
			photoUrl = yield* uploadTeamMemberPhoto(photoFile, id);
		}

		const trimmedRole = input.role?.trim() || null;
		const trimmedPhone = input.phone?.trim() || null;
		const trimmedEmail = input.email?.trim() || null;
		const order = typeof input.order === "number" ? input.order : 0;
		const isActive = typeof input.isActive === "boolean" ? input.isActive : true;

		const db = yield* DatabaseClient;
		const now = new Date();

		yield* Effect.tryPromise({
			try: () =>
				db.insert(teamMembersTable).values({
					id,
					name: trimmedName,
					role: trimmedRole,
					photoUrl,
					phone: trimmedPhone,
					email: trimmedEmail,
					order,
					isActive,
					createdAt: now,
					updatedAt: now,
				}),
			catch: (cause) => new DatabaseError({ cause }),
		});

		return { success: true, id };
	});

export const updateTeamMember = (
	id: string,
	input: Partial<TeamMemberInput>,
	photoFile?: File | null,
	removePhoto = false,
) =>
	Effect.gen(function* () {
		const existing = yield* getTeamMemberById(id);
		let photoUrl = existing.photoUrl;

		if (removePhoto && existing.photoUrl) {
			yield* deleteStorageFile(existing.photoUrl);
			photoUrl = null;
		} else if (photoFile && photoFile.size > 0) {
			if (existing.photoUrl) {
				yield* deleteStorageFile(existing.photoUrl);
			}
			photoUrl = yield* uploadTeamMemberPhoto(photoFile, id);
		}

		const updateValues: Record<string, unknown> = {
			updatedAt: new Date(),
		};

		if (input.name !== undefined) {
			const trimmedName = input.name.trim();
			if (!trimmedName) {
				return yield* Effect.fail(
					new ValidationError({ message: "Nama anggota tim tidak boleh kosong." }),
				);
			}
			updateValues.name = trimmedName;
		}

		if (input.role !== undefined) {
			updateValues.role = input.role ? input.role.trim() : null;
		}

		if (input.phone !== undefined) {
			updateValues.phone = input.phone ? input.phone.trim() : null;
		}

		if (input.email !== undefined) {
			updateValues.email = input.email ? input.email.trim() : null;
		}

		if (input.order !== undefined) {
			updateValues.order = Number(input.order) || 0;
		}

		if (input.isActive !== undefined) {
			updateValues.isActive = Boolean(input.isActive);
		}

		if (photoUrl !== existing.photoUrl) {
			updateValues.photoUrl = photoUrl;
		}

		const db = yield* DatabaseClient;
		yield* Effect.tryPromise({
			try: () => db.update(teamMembersTable).set(updateValues).where(eq(teamMembersTable.id, id)),
			catch: (cause) => new DatabaseError({ cause }),
		});

		return { success: true, id };
	});

export const deleteTeamMember = (id: string) =>
	Effect.gen(function* () {
		const existing = yield* getTeamMemberById(id);

		if (existing.photoUrl) {
			yield* deleteStorageFile(existing.photoUrl);
		}

		const db = yield* DatabaseClient;
		yield* Effect.tryPromise({
			try: () => db.delete(teamMembersTable).where(eq(teamMembersTable.id, id)),
			catch: (cause) => new DatabaseError({ cause }),
		});

		return { success: true, id };
	});

export const reorderTeamMembers = (orderedIds: string[]) =>
	Effect.gen(function* () {
		if (!orderedIds || orderedIds.length === 0) {
			return { success: true };
		}

		const db = yield* DatabaseClient;
		const now = new Date();

		yield* Effect.tryPromise({
			try: async () => {
				for (let i = 0; i < orderedIds.length; i++) {
					const mid = orderedIds[i];
					await db
						.update(teamMembersTable)
						.set({ order: i, updatedAt: now })
						.where(eq(teamMembersTable.id, mid));
				}
			},
			catch: (cause) => new DatabaseError({ cause }),
		});

		return { success: true };
	});
