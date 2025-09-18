import React from "react";
import MailIdentities from "@/components/dashboard/identities/mail-identities";
import {
	fetchDecryptedSecrets,
	fetchUserIdentities,
	getProviderById,
} from "@/lib/actions/dashboard";
import { smtpAccountSecrets, providerSecrets } from "@db";
import { ProviderLabels } from "@schema";
import { parseSecret } from "@/lib/utils";

async function Page() {
	const [userSmtpAccounts, userProviderAccounts] = await Promise.all([
		fetchDecryptedSecrets({
			linkTable: smtpAccountSecrets,
			foreignCol: smtpAccountSecrets.accountId,
			secretIdCol: smtpAccountSecrets.secretId,
		}),
		fetchDecryptedSecrets({
			linkTable: providerSecrets,
			foreignCol: providerSecrets.providerId,
			secretIdCol: providerSecrets.secretId,
		}),
	]);
	const userIdentities = await fetchUserIdentities();

	const options = [];
	for (const providerAccount of userProviderAccounts) {
		const secret = parseSecret(providerAccount);
		if (secret.verified) {
			const provider = await getProviderById(
				String(providerAccount.linkRow.providerId),
			);
			const providerName =
				ProviderLabels[provider?.type || "unknown"] || "Unknown Provider";
			if (provider) {
				options.push({
					label: providerName,
					value: `provider-${String(providerAccount.linkRow.id)}`,
				});
			}
		}
	}
	for (const smtpAccount of userSmtpAccounts) {
		const secret = parseSecret(smtpAccount);
		if (secret.sendVerified || secret.receiveVerified) {
			options.push({
				label: `SMTP Account (${secret.label})`,
				value: `smtp-${String(smtpAccount.linkRow.id)}`,
			});
		}
	}

	return (
		<>
			<MailIdentities
				userIdentities={userIdentities}
				smtpAccounts={userSmtpAccounts}
				providerAccounts={userProviderAccounts}
				providerOptions={options}
			/>
		</>
	);
}

export default Page;
