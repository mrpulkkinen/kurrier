"use client";
import React from "react";
import {createSmtpAccount, SmtpAccountsWithSecretsRow, updateSmtpAccount} from "@/lib/actions/dashboard";
import { SMTP_SPEC } from "@schema";
import { ReusableForm } from "@/components/common/reusable-form";
import { ulid } from "ulid";

function NewSmtpAccountForm({
                                vault,
                                secretId,
                                accountId
                            }: {
    vault?: SmtpAccountsWithSecretsRow["decrypted"]["vault"];
    secretId?: string;
    accountId?: string;
}) {

    const parseVaultValues =
        vault && vault.decrypted_secret ? JSON.parse(vault.decrypted_secret) : {};

    const fields = [
        { name: "ulid", props: { hidden: true, defaultValue: ulid() } },
        { name: "secretId", props: { hidden: true, defaultValue: secretId } },
        { name: "accountId", props: { hidden: true, defaultValue: accountId } },

        {
            name: "label",
            label: (
                <code className="rounded bg-muted/50 px-2 py-1 text-xs">ACCOUNT LABEL</code>
            ),
            required: true,
            props: {
                autoComplete: "off",
                required: true,
                placeholder: "My SMTP Account",
                defaultValue: vault ? parseVaultValues["label"] ?? "" : "",
            },
        },

        ...SMTP_SPEC.requiredEnv.map((row: string) => ({
            name: `required.${row}`,
            label: <code className="rounded bg-muted/50 px-2 py-1 text-xs">{row}</code>,
            required: true,
            props: {
                autoComplete: "off",
                required: true,
                type: /PASSWORD/.test(row) ? "password" : "text",
                defaultValue: vault ? parseVaultValues[row] ?? "" : "",
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

        ...SMTP_SPEC.optionalEnv.map((row: string) =>
            row === "SMTP_SECURE" || row === "IMAP_SECURE"
                ? {
                    name: `optional.${row}`,
                    label: (
                        <code className="rounded bg-muted/50 px-2 py-1 text-xs">{row}</code>
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
                        defaultValue: vault ? parseVaultValues[row] ?? "false" : "false",
                        className: "w-full",
                    },
                }
                : {
                    name: `optional.${row}`,
                    label: (
                        <code className="rounded bg-muted/50 px-2 py-1 text-xs">{row}</code>
                    ),
                    required: false,
                    wrapperClasses: "col-span-12 sm:col-span-6",
                    props: {
                        autoComplete: "off",
                        required: false,
                        type: /PASSWORD/.test(row) ? "password" : "text",
                        defaultValue: vault ? parseVaultValues[row] ?? "" : "",
                    },
                }
        ),
    ];

    return (
        <ReusableForm
            action={ vault && vault.decrypted_secret ? updateSmtpAccount  : createSmtpAccount}
            fields={fields}
            {...(vault?.decrypted_secret
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




// "use client";
// import React from "react";
// import {createSmtpAccount, SmtpAccountsWithSecretsRow} from "@/lib/actions/dashboard";
// import { SMTP_SPEC } from "@schema";
// import { ReusableForm } from "@/components/common/reusable-form";
// import { ulid } from "ulid";
//
// function NewSmtpAccountForm({vault}: {vault?: SmtpAccountsWithSecretsRow["decrypted"]["vault"]}) {
//
//     const parseVaultValues = vault && vault.decrypted_secret ? JSON.parse(vault.decrypted_secret) : {};
//
// 	const fields = [
//         {
//             name: "ulid",
//             props: {hidden: true, defaultValue: ulid()}
//         },
// 		{
// 			name: `label`,
// 			label: <code className="rounded bg-muted/50 px-2 py-1 text-xs">ACCOUNT LABEL</code>,
// 			required: true,
// 			props: { autoComplete: "off", required: true, placeholder: "My SMTP Account", defaultValue: vault ? parseVaultValues['label'] ?? "" : "" },
// 		},
// 		...SMTP_SPEC.requiredEnv.map((row) => {
// 			return {
// 				name: `required.${row}`,
// 				label: (
// 					<code className="rounded bg-muted/50 px-2 py-1 text-xs">{row}</code>
// 				),
// 				required: true,
// 				props: { autoComplete: "off", required: true, type: row.match(/PASSWORD/) ? "password" : "text" , defaultValue: vault ? parseVaultValues[row] ?? "" : ""},
// 			};
// 		}),
// 		{
// 			el: (
// 				<div className="my-3 md:my-4">
// 					<h4 className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
// 						Optional Environment Vars
// 					</h4>
// 				</div>
// 			),
// 		},
// 		...SMTP_SPEC.optionalEnv.map((row) => {
// 			if (row === "SMTP_SECURE" || row === "IMAP_SECURE") {
// 				return {
// 					name: `optional.${row}`,
// 					label: (
// 						<code className="rounded bg-muted/50 px-2 py-1 text-xs">{row}</code>
// 					),
// 					kind: "select" as const,
// 					options: [
// 						{ label: "TRUE", value: "true" },
// 						{ label: "FALSE", value: "false" },
// 					],
// 					required: false,
// 					wrapperClasses: "col-span-12 sm:col-span-6",
// 					props: {
// 						autoComplete: "off",
// 						required: false,
// 						defaultValue: vault ? parseVaultValues[row] ?? "false" : "false",
// 						className: "w-full",
// 					},
// 				};
// 			}
// 			return {
// 				name: `optional.${row}`,
// 				label: (
// 					<code className="rounded bg-muted/50 px-2 py-1 text-xs">{row}</code>
// 				),
// 				required: false,
// 				wrapperClasses: "col-span-12 sm:col-span-6",
// 				props: { autoComplete: "off", required: false, type: row.match(/PASSWORD/) ? "password" : "text", defaultValue: vault ? parseVaultValues[row] ?? "" : "" },
// 			};
// 		}),
// 	];
//
//     return <>
//         <ReusableForm
//             action={createSmtpAccount}
//             fields={fields}
//             {...(vault?.decrypted_secret
//                 ? {
//                     submitButtonProps: {
//                         submitLabel: "Save",
//                         wrapperClasses: "justify-center mt-6 flex",
//                         fullWidth: true,
//                     },
//                 }
//                 : {})}
//         />
//     </>
// }
//
// export default NewSmtpAccountForm;
