"use client";
import React from "react";
import {
    FetchDecryptedSecretsResultRow,
    upsertSMTPAccount,
} from "@/lib/actions/dashboard";
import { SMTP_SPEC } from "@schema";
import { ReusableForm } from "@/components/common/reusable-form";
import { ulid } from "ulid";

function NewSmtpAccountForm({
    smtpSecret,
    onCompleted
}: {
    smtpSecret?: FetchDecryptedSecretsResultRow
    onCompleted?: () => void
}) {

    const parsedVaultValues = smtpSecret?.vault?.decrypted_secret ? JSON.parse(smtpSecret?.vault?.decrypted_secret) : {};

	const fields = [
		{ name: "ulid", wrapperClasses: "hidden", props: { hidden: true, defaultValue: ulid() } },
		{ name: "secretId", wrapperClasses: "hidden", props: { hidden: true, defaultValue: smtpSecret?.linkRow?.secretId } },
		{ name: "accountId", wrapperClasses: "hidden", props: { hidden: true, defaultValue: smtpSecret?.linkRow?.accountId } },

		{
			name: "label",
			label: (
				<code className="rounded bg-muted/50 px-2 py-1 text-xs">
					ACCOUNT LABEL
				</code>
			),
			required: true,
			props: {
				autoComplete: "off",
				required: true,
				placeholder: "My SMTP Account",
				defaultValue: parsedVaultValues ? (parsedVaultValues["label"] ?? "") : "",
			},
		},

		...SMTP_SPEC.requiredEnv.map((rowKey: string) => ({
			name: `required.${rowKey}`,
			label: (
				<code className="rounded bg-muted/50 px-2 py-1 text-xs">{rowKey}</code>
			),
			required: true,
            wrapperClasses: "col-span-12 sm:col-span-6",
			props: {
				autoComplete: "off",
				required: true,
				// type: /PASSWORD/.test(rowKey) ? "password" : "text",
				defaultValue: parsedVaultValues ? (parsedVaultValues[rowKey] ?? "") : "",
			},
		})),

		{
			el: (
				<div className="my-3 md:my-4">
					<h4 className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
						Optional Environment Vars
					</h4>
				</div>
			),
		},

		...SMTP_SPEC.optionalEnv.map((rowKey: string) =>
            rowKey === "SMTP_SECURE" || rowKey === "IMAP_SECURE"
				? {
						name: `optional.${rowKey}`,
						label: (
							<code className="rounded bg-muted/50 px-2 py-1 text-xs">
								{rowKey}
							</code>
						),
						kind: "select" as const,
						options: [
							{ label: "TRUE", value: "true" },
							{ label: "FALSE", value: "false" },
						],
						required: false,
						wrapperClasses: "col-span-12 sm:col-span-6",
						props: {
							autoComplete: "off",
							required: false,
							defaultValue: parsedVaultValues
								? (parsedVaultValues[rowKey] ?? "false")
								: "false",
							className: "w-full",
						},
					}
				: {
						name: `optional.${rowKey}`,
						label: (
							<code className="rounded bg-muted/50 px-2 py-1 text-xs">
								{rowKey}
							</code>
						),
						required: false,
						wrapperClasses: "col-span-12 sm:col-span-6",
						props: {
							autoComplete: "off",
							required: false,
							type: /PASSWORD/.test(rowKey) ? "password" : "text",
							defaultValue: parsedVaultValues ? (parsedVaultValues[rowKey] ?? "") : "",
						},
					},
		),
	];

	return (
		<ReusableForm
            action={upsertSMTPAccount}
            onSuccess={onCompleted ? onCompleted : undefined}
			fields={fields}
			{...(parsedVaultValues
				? {
						submitButtonProps: {
							submitLabel: "Save",
							wrapperClasses: "justify-center mt-6 flex",
							fullWidth: true,
						},
					}
				: {})}
		/>
	);
}

export default NewSmtpAccountForm;
