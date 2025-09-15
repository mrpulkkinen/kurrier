"use server";

import {
    createDrizzleSupabaseClient,
    createSecret,
    getSecret, identities, IdentityInsertSchema,
    providers,
    providerSecrets,
    secretsMeta,
    smtpAccounts,
    smtpAccountSecrets,
    updateSecret,
} from "@db";
import {FormState, Providers, PROVIDERS} from "@schema";
import { currentSession } from "@/lib/actions/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { decode } from "decode-formdata";
import { PgColumn, PgTable } from "drizzle-orm/pg-core";
import {createMailer} from "@providers";
import {parseSecret} from "@/lib/utils";

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
		return {
			success: false,
			error: "Error updating provider account",
		};
	}
}


export const verifySmtpAccount = async (smtpConfig: Record<any, unknown>) => {
    const mailer = createMailer("smtp", smtpConfig)
    const res = await mailer.verify()
    smtpConfig.sendVerified = res?.meta?.send
    smtpConfig.receiveVerified = res?.meta?.receive
    return {verifiedConfig: smtpConfig, res}
};

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

		const smtpConfig: Record<string, unknown> = {
			ulid: data.ulid,
			label: String(data.label || "My SMTP Account").trim(),
			...cleanedRequired,
			...cleanedOptional,
		};

		const rls = await rlsClient();


        let verifyResponse = {}

		if (data.accountId) {

			const [accountSecret] = await rls((tx) =>
				tx
					.select()
					.from(smtpAccountSecrets)
					.where(eq(smtpAccountSecrets.accountId, String(data.accountId))),
			);

			if (!accountSecret) {
                const {res,verifiedConfig} = await verifySmtpAccount(smtpConfig)
                verifyResponse = res
				const newSecret = await createSecret(session, {
					name: String(data.ulid),
					value: JSON.stringify(verifiedConfig),
				});
				await rls((tx) =>
					tx.insert(accountSecret).values({
						providerId: String(data.accountId),
						secretId: newSecret.id,
					}),
				);
			} else {
                const {res, verifiedConfig} = await verifySmtpAccount(smtpConfig)
                verifyResponse = res
				await updateSecret(session, accountSecret.secretId, {
					value: JSON.stringify(verifiedConfig),
				});
			}
		} else {
			// Create new account
            const {res, verifiedConfig} = await verifySmtpAccount(smtpConfig)
            verifyResponse = res
			const secretMeta = await createSecret(session, {
				name: String(data.ulid),
				value: JSON.stringify(verifiedConfig),
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
            data: verifyResponse
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
    // parent?: ProviderEntity | SMTPAccountEntity | null
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

export const testSmtpAccount = async (smtpSecret: FetchDecryptedSecretsResultRow) => {
    const parsedVaultValues = parseSecret(smtpSecret);

    const session = await currentSession();
    const {verifiedConfig, res} = await verifySmtpAccount(parsedVaultValues)

    await updateSecret(session, smtpSecret.metaId, {
        value: JSON.stringify(verifiedConfig),
    });
    revalidatePath("/dashboard/providers")
    return res
};

export const getProviderById = async (providerId: string) => {
    const rls = await rlsClient();
    const [provider] = await rls((tx) =>
        tx.select().from(providers).where(eq(providers.id, providerId))
    );
    return provider
};

export const getSMTPAccountById = async (accountId: string) => {
    const rls = await rlsClient();
    const [account] = await rls((tx) =>
        tx.select().from(smtpAccounts).where(eq(smtpAccounts.id, accountId))
    );
    return account
};


export async function addNewIdentity  (_prev: FormState, formData: FormData): Promise<FormState> {
    try {
        const rls = await rlsClient()
        const data = decode(formData);
        const identityData = IdentityInsertSchema.parse(data);
        await rls(tx => tx.insert(identities).values(identityData).returning())
    } catch (e) {
        const cause = (e as Error)?.cause
        return {
            success: false,
            error: `Error adding new identity: ${cause}` ,
        };
    }

    revalidatePath("/dashboard/providers");
    return {
        success: true,
        message: "Added new identity",
    }
};

export const testSendingEmail = async (
    userIdentity: FetchUserIdentitiesResult[number],
    decryptedSecrets: Record<any, unknown>
): Promise<{ ok: boolean; message: string }> => {
    try {
        if (userIdentity?.smtp_accounts) {
            const mailer = createMailer("smtp", decryptedSecrets);
            await mailer.sendTestEmail(
                userIdentity.identities.value,
                {
                    subject: "Test email from Kurrier",
                    body: "This is a test email from your configured SMTP account in Kurrier.",
                }
            );
            return { ok: true, message: "Test email sent successfully." };
        }

        // If provider is not SMTP (e.g. SES, Mailgun etc.) — handle here
        return { ok: false, message: "Provider not supported yet." };
    } catch (err: any) {
        return { ok: false, message: err?.message || "Failed to send test email." };
    }
};

export const fetchUserIdentities = async () => {
    const rls = await rlsClient()
    return await rls(tx =>
        tx
            .select()
            .from(identities)
            .leftJoin(smtpAccounts, eq(identities.smtpAccountId, smtpAccounts.id))
            .leftJoin(providers, eq(identities.providerId, providers.id))
    )
};

export const deleteIdentity = async (id: string) => {
    const rls = await rlsClient();
    await rls((tx) => tx.delete(identities).where(eq(identities.id, id)));
    revalidatePath("/dashboard/providers");
};

export type FetchUserIdentitiesResult = Awaited<
    ReturnType<typeof fetchUserIdentities>
>;

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
