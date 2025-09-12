import React from 'react';
import {ProviderSpec} from "@schema";
import {ulid} from "ulid";
import {ReusableForm} from "@/components/common/reusable-form";
import {
    FetchDecryptedSecretsResult,
    upsertProviderAccount
} from "@/lib/actions/dashboard";

function ProviderEditForm({spec, providerId, decryptedSecrets}: {spec: ProviderSpec, providerId: string, decryptedSecrets: FetchDecryptedSecretsResult}) {

    const decryptedValues = decryptedSecrets[0]?.vault?.decrypted_secret ? JSON.parse(decryptedSecrets[0]?.vault?.decrypted_secret) : {}

    const fields = [
        { name: "ulid", wrapperClasses: "hidden", props: { hidden: true, defaultValue: ulid() } },
        { name: "providerId", wrapperClasses: "hidden", props: { hidden: true, defaultValue: providerId } },
        ...spec.requiredEnv.map((row: string) => ({
            name: `required.${row}`,
            label: (
                <code className="rounded bg-muted/50 px-2 py-1 text-xs">{row}</code>
            ),
            required: true,
            wrapperClasses: "col-span-12",
            props: {
                autoComplete: "off",
                required: true,
                // type: /PASSWORD/.test(row) ? "password" : "text",
                defaultValue: decryptedValues ? (decryptedValues[row] ?? "") : "",
            },
        })),
    ];


    return <ReusableForm fields={fields} action={upsertProviderAccount} />
}

export default ProviderEditForm;
