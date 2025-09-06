"use server";

import { eq, sql } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { secretsMeta } from "./schema";
import { createDrizzleSupabaseClient } from "./drizzle-client";

async function vaultCreateSecret(
	tx: PgTransaction<any, any, any>,
	opts: { name: string; secret: string; description?: string | null },
) {
	const { name, secret, description = null } = opts;
	const rows = await tx.execute(
		sql`select vault.create_secret(${name}, ${secret}, ${description}) as id`,
	);

	const id = (rows as any)[0]?.id as string | undefined;
	if (!id) throw new Error("vault.create_secret did not return an id");
	return id;
}

async function vaultUpdateSecret(
	tx: PgTransaction<any, any, any>,
	id: string,
	secret: string,
) {
	await tx.execute(sql`select vault.update_secret(${id}, ${secret})`);
}

async function vaultDeleteSecret(tx: PgTransaction<any, any, any>, id: string) {
	await tx.execute(sql`select vault.delete_secret(${id})`);
}

async function vaultGetSecret(tx: PgTransaction<any, any, any>, id: string) {
	const rows = await tx.execute(sql`select vault.get_secret(${id}) as value`);
	const value = (rows as any)[0]?.value as string | null | undefined;
	return value ?? null;
}

export async function listSecrets(session: { access_token?: string } | null) {
	const db = await createDrizzleSupabaseClient(session);
	return db.rls((tx) => tx.select().from(secretsMeta));
}

export async function createSecret(
	session: { access_token?: string } | null,
	input: { name: string; value: string; description?: string | null },
) {
	const db = await createDrizzleSupabaseClient(session);
	const { admin, rls } = db;

	const vaultId = await admin.transaction((tx) =>
		vaultCreateSecret(tx, {
			name: input.name,
			secret: input.value,
			description: input.description ?? null,
		}),
	);

	const rows = await rls((tx) =>
		tx
			.insert(secretsMeta)
			.values({
				name: input.name,
				description: input.description ?? null,
				vaultSecret: vaultId,
				// If your column has default auth.uid(), you do NOT need to set owner_id explicitly.
				// owner_id will be checked by your RLS policy (withCheck owner_id = auth.uid()).
			})
			.returning(),
	);

	return rows[0]!;
}

export async function getSecret(
	session: { access_token?: string } | null,
	id: string,
) {
	const db = await createDrizzleSupabaseClient(session);
	const { admin, rls } = db;

	const meta = await rls((tx) =>
		tx.select().from(secretsMeta).where(eq(secretsMeta.id, id)).limit(1),
	).then((r) => r[0]);

	if (!meta) throw new Error("Not found or not allowed");

	const value = await admin.transaction((tx) =>
		vaultGetSecret(tx, meta.vaultSecret),
	);

	return { ...meta, value };
}

export async function updateSecret(
	session: { access_token?: string } | null,
	id: string,
	input: { value?: string; name?: string; description?: string | null },
) {
	const db = await createDrizzleSupabaseClient(session);
	const { admin, rls } = db;

	const meta = await rls((tx) =>
		tx.select().from(secretsMeta).where(eq(secretsMeta.id, id)).limit(1),
	).then((r) => r[0]);
	if (!meta) throw new Error("Not found or not allowed");

	if (input.value !== undefined) {
		await admin.transaction((tx) =>
			vaultUpdateSecret(tx, meta.vaultSecret, input.value!),
		);
	}

	if (input.name !== undefined || input.description !== undefined) {
		const rows = await rls((tx) =>
			tx
				.update(secretsMeta)
				.set({
					...(input.name !== undefined ? { name: input.name } : {}),
					...(input.description !== undefined
						? { description: input.description }
						: {}),
				})
				.where(eq(secretsMeta.id, id))
				.returning(),
		);
		return rows[0]!;
	}

	return meta;
}

export async function deleteSecret(
	session: { access_token?: string } | null,
	id: string,
) {
	const db = await createDrizzleSupabaseClient(session);
	const { admin, rls } = db;

	const meta = await rls((tx) =>
		tx.select().from(secretsMeta).where(eq(secretsMeta.id, id)).limit(1),
	).then((r) => r[0]);
	if (!meta) return;

	await admin.transaction((tx) => vaultDeleteSecret(tx, meta.vaultSecret));

	await rls((tx) => tx.delete(secretsMeta).where(eq(secretsMeta.id, id)));
}
