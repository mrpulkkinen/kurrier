"use server";

import {
	createDrizzleSupabaseClient,
	createSecret,
	getSecret,
	providers,
	providerSecrets,
	secretsMeta,
	updateSecret,
} from "@db";
import { FormState, PROVIDERS } from "@schema";
import { currentSession } from "@/lib/actions/auth";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { decode } from "decode-formdata";

export const syncProviders = async () => {
	const session = await currentSession();
	const { rls } = await createDrizzleSupabaseClient(session);
	await rls((tx) =>
		tx
			.insert(providers)
			.values(PROVIDERS.map((k) => ({ type: k.key })))
			.onConflictDoNothing({ target: [providers.ownerId, providers.type] })
			.returning(),
	);
	const rows = await rls((tx) =>
		tx
			.select()
			.from(providers)
			.leftJoin(providerSecrets, eq(providerSecrets.providerId, providers.id)),
	);
	return rows;
};

export async function getProviderSecrets(providerId: string) {
	const session = await currentSession();
	const { rls } = await createDrizzleSupabaseClient(session);

	const rows = await rls((tx) =>
		tx
			.select({
				secret: providerSecrets,
				meta: {
					id: secretsMeta.id,
				},
			})
			.from(providerSecrets)
			.leftJoin(secretsMeta, eq(providerSecrets.secretId, secretsMeta.id))
			.where(eq(providerSecrets.providerId, providerId)),
	);

	return await Promise.all(
		rows.map(async (r) => ({
			providerSecret: r.secret,
			...(await getSecret(session, String(r?.meta?.id))),
		})),
	);
}

export type ProviderSecretsResult = Awaited<
	ReturnType<typeof getProviderSecrets>
>;
export type ProviderSecretRow = ProviderSecretsResult[number];
export type SyncProvidersRow = Awaited<
	ReturnType<typeof syncProviders>
>[number];

export async function saveProviderEnv(
	_prev: FormState,
	formData: FormData,
): Promise<FormState> {
	try {
		const {
			keys,
			providerId,
		}: { keys: Record<string, string>; providerId: string } = decode(formData);
		const session = await currentSession();

		const { rls } = await createDrizzleSupabaseClient(session);

		for (const key in keys) {
			const [currentProviderSecret] = await rls((tx) => {
				return tx
					.select()
					.from(providerSecrets)
					.where(
						and(
							eq(providerSecrets.providerId, providerId),
							eq(providerSecrets.keyName, key),
						),
					)
					.limit(1);
			});
			if (currentProviderSecret) {
				await updateSecret(session, currentProviderSecret.secretId, {
					name: `${session.user.id}-${key}`,
					value: keys[key],
				});
			} else {
				const newSecret = await createSecret(session, {
					name: `${session.user.id}-${key}`,
					value: keys[key],
				});
				await rls((tx) =>
					tx.insert(providerSecrets).values({
						providerId,
						secretId: newSecret.id,
						keyName: key,
					}),
				);
			}
		}

		revalidatePath("/dashboard/providers");

		return { success: false, message: "Provider env saved" };
	} catch (e) {
		return { success: false, error: "Error saving provider env" };
	}
}
