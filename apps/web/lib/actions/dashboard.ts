"use server";

import {
	createDrizzleSupabaseClient,
	createSecret,
	getSecret,
	providers,
	providerSecrets,
	secretsMeta,
	smtpAccounts,
	smtpAccountSecrets,
	updateSecret,
} from "@db";
import { FormState, PROVIDERS } from "@schema";
import { currentSession } from "@/lib/actions/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { decode } from "decode-formdata";
import { PgColumn, PgTable } from "drizzle-orm/pg-core";

export const syncProviders = async () => {
	const rls = await rlsClient();
	await rls((tx) =>
		tx
			.insert(providers)
			.values(PROVIDERS.map((k) => ({ type: k.key })))
			.onConflictDoNothing({ target: [providers.ownerId, providers.type] })
			.returning(),
	);
	const rows = await rls((tx) => tx.select().from(providers));
	return rows;
};

export type SyncProvidersRow = Awaited<
	ReturnType<typeof syncProviders>
>[number];

export async function upsertProviderAccount(
	_prev: FormState,
	formData: FormData,
): Promise<FormState> {
	try {
		const session = await currentSession();
		const data = decode(formData);
		const rls = await rlsClient();
		const [providerSecret] = await rls((tx) =>
			tx
				.select()
				.from(providerSecrets)
				.where(eq(providerSecrets.providerId, String(data.providerId))),
		);

		if (!providerSecret) {
			const newSecret = await createSecret(session, {
				name: String(data.ulid),
				value: JSON.stringify(data.required),
			});
			await rls((tx) =>
				tx.insert(providerSecrets).values({
					providerId: String(data.providerId),
					secretId: newSecret.id,
				}),
			);
		} else {
			await updateSecret(session, providerSecret.secretId, {
				name: String(data.ulid),
				value: JSON.stringify(data.required),
			});
		}

		revalidatePath("/dashboard/providers");

		return {
			success: true,
			message: "Successfully updated provider account",
		};
	} catch (e) {
		console.log("error", e);
		return {
			success: false,
			error: "Error updating provider account",
		};
	}
}

export async function upsertSMTPAccount(
	_prev: FormState,
	formData: FormData,
): Promise<FormState> {
	try {
		const session = await currentSession();
		const data = decode(formData);
		const cleanedRequired = Object.fromEntries(
			Object.entries(data.required ?? {}).filter(
				([, v]) => v !== "" && v != null,
			),
		);
		const cleanedOptional = Object.fromEntries(
			Object.entries(data.optional ?? {}).filter(
				([, v]) => v !== "" && v != null,
			),
		);

		const smtpConfig = {
			ulid: data.ulid,
			label: String(data.label || "My SMTP Account").trim(),
			...cleanedRequired,
			...cleanedOptional,
		};

		const rls = await rlsClient();

		if (data.accountId) {
			const [accountSecret] = await rls((tx) =>
				tx
					.select()
					.from(smtpAccountSecrets)
					.where(eq(smtpAccountSecrets.accountId, String(data.accountId))),
			);

			if (!accountSecret) {
				const newSecret = await createSecret(session, {
					name: String(data.ulid),
					value: JSON.stringify(smtpConfig),
				});
				await rls((tx) =>
					tx.insert(accountSecret).values({
						providerId: String(data.accountId),
						secretId: newSecret.id,
					}),
				);
			} else {
				await updateSecret(session, accountSecret.secretId, {
					value: JSON.stringify(smtpConfig),
				});
			}
		} else {
			// Create new account

			const secretMeta = await createSecret(session, {
				name: String(data.ulid),
				value: JSON.stringify(smtpConfig),
			});

			const [smtpAccount] = await rls((tx) =>
				tx.insert(smtpAccounts).values({}).returning(),
			);

			await rls((tx) =>
				tx
					.insert(smtpAccountSecrets)
					.values({
						accountId: smtpAccount.id,
						secretId: secretMeta.id,
					})
					.returning(),
			);
		}

		revalidatePath("/dashboard/providers");

		return {
			success: true,
			message: "Done",
		};
	} catch (e) {
		console.log("error", e);
		return {
			success: false,
			error: "Error updating provider account",
		};
	}
}

export async function fetchDecryptedSecrets({
	linkTable,
	foreignCol,
	secretIdCol,
	parentId,
}: {
	linkTable: PgTable;
	foreignCol: PgColumn; // e.g. providerSecrets.providerId
	secretIdCol: PgColumn; // e.g. providerSecrets.secretId
	parentId?: string;
}) {
	const rls = await rlsClient();
	const session = await currentSession();

	const rows = await rls((tx) => {
		let q = tx
			.select({
				linkRow: linkTable,
				metaId: secretsMeta.id,
			})
			.from(linkTable)
			.leftJoin(secretsMeta, eq(secretIdCol, secretsMeta.id))
			.$dynamic(); // <-- allow conditional chaining

		if (parentId) {
			q = q.where(eq(foreignCol, parentId));
		}

		return q;
	});

	return Promise.all(
		rows.map(async (r) => {
			const metaId = String(r.metaId);
			const { vault } = await getSecret(session, metaId);
			return { linkRow: r.linkRow, metaId, vault };
		}),
	);
}

export type FetchDecryptedSecretsResult = Awaited<
	ReturnType<typeof fetchDecryptedSecrets>
>;

export type FetchDecryptedSecretsResultRow =
	FetchDecryptedSecretsResult[number];

export const deleteSmtpAccount = async (id: string) => {
	const rls = await rlsClient();
	await rls((tx) => tx.delete(smtpAccounts).where(eq(smtpAccounts.id, id)));
	revalidatePath("/dashboard/providers");
};

export const rlsClient = async () => {
	const session = await currentSession();
	const { rls } = await createDrizzleSupabaseClient(session);
	return rls;
};

export const adminClient = async () => {
	const session = await currentSession();
	const { admin } = await createDrizzleSupabaseClient(session);
	return admin;
};
