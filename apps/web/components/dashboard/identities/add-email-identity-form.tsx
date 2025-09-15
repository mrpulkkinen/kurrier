import {addNewIdentity, FetchDecryptedSecretsResult} from "@/lib/actions/dashboard";
import { ReusableForm } from "@/components/common/reusable-form";
import React from "react";
import {Providers} from "@schema";
import {parseSecret} from "@/lib/utils";

function AddEmailIdentityForm({
                                  onCompleted,
                                  providerOptions,
                                  smtpAccounts,
                                  providerAccounts
                              }: {
    onCompleted?: () => void;
    providerOptions: { label: string; value: string }[];
    smtpAccounts: FetchDecryptedSecretsResult;
    providerAccounts: FetchDecryptedSecretsResult;
}) {
    const [providerType, setProviderType] = React.useState<Providers | null>(null);
    const [providerTypeId, setProviderTypeId] = React.useState<string | null>(null);


    function getSmtpFields(smtpAccounts: FetchDecryptedSecretsResult) {
        const existing = providerTypeId ? smtpAccounts.find(s => String(s.linkRow.id) === providerTypeId) : null;
        const parsedVaultValues = parseSecret(existing)

        return [
            {
                name: "value",
                label: "Value",
                required: true,
                wrapperClasses: "col-span-12",
                props: {
                    autoComplete: "off",
                    required: true,
                    readOnly: true,
                    defaultValue: parsedVaultValues.SMTP_USERNAME || "",
                },
            },
            { name: "smtpAccountId", wrapperClasses: "hidden", props: { hidden: true, defaultValue: existing?.linkRow.accountId } },
            // { name: "providerId", wrapperClasses: "hidden", props: { hidden: true, defaultValue: providerTypeId } },
            { name: "kind", wrapperClasses: "hidden", props: { hidden: true, defaultValue: "email" } },
        ];
    }


    const extraFields = React.useMemo(() => {
        // const id = providerTypeId?.replace(/^[a-z]+-/, "") || null;
        switch (providerType) {
            case "smtp":
                return getSmtpFields(smtpAccounts);
            // case "ses":
            //     return getSesFields(...);
            // case "sendgrid":
            //     return getSendgridFields(...);
            default:
                return [];
        }
    }, [providerType, providerTypeId, smtpAccounts]);


    const fields = [
        {
            name: "provider",
            label: "Choose a provider",
            kind: "select" as const,
            options: providerOptions,
            wrapperClasses: "col-span-12",
            props: {
                className: "w-full",
                required: true,
                onChange: (val: unknown) => {
                    const v = typeof val === "string" ? val : (val as any)?.target?.value ?? "";
                    setProviderTypeId(v?.replace(/^[a-z]+-/, "") || null)
                    if (v.startsWith("smtp")) setProviderType("smtp");
                    else setProviderType(null);
                },
            },
        },
        ...extraFields,
    ];

    return (
        <ReusableForm
            action={addNewIdentity}
            onSuccess={onCompleted || undefined}
            fields={fields}
        />
    );
}

export default AddEmailIdentityForm;
