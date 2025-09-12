import React from 'react';
import {
    deleteSmtpAccount,
    FetchDecryptedSecretsResultRow
} from "@/lib/actions/dashboard";
import {modals} from "@mantine/modals";
import NewSmtpAccountForm from "@/components/dashboard/providers/new-smtp-account-form";
import {cn} from "@/lib/utils";
import {Lock, Mail, Pencil, ShieldCheck, Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";

function SmtpAccountCard({smtpSecret}: {smtpSecret: FetchDecryptedSecretsResultRow}) {

    const parsedVaultValues = smtpSecret?.vault?.decrypted_secret ? JSON.parse(smtpSecret?.vault?.decrypted_secret) : {};
    const openEdit = () => {
        const openModalId = modals.open({
            title: (
                <div className="font-semibold text-brand-600">
                    Edit SMTP Account
                </div>
            ),
            size: "lg",
            children: (
                <div className="p-2">
                    <NewSmtpAccountForm
                        smtpSecret={smtpSecret}
                        onCompleted={() => modals.close(openModalId)}
                    />
                </div>
            ),
        });
    }


    const confirmDelete = () =>
        modals.openConfirmModal({
            title: "Delete SMTP Account",
            centered: true,
            children: (
                <div className="text-sm ">
                    Are you sure you want to delete <b>{parsedVaultValues.label}</b>? This
                    will remove the account and unlink any associated
                    secrets.
                </div>
            ),
            labels: { confirm: "Delete", cancel: "Cancel" },
            confirmProps: { color: "red" },
            onConfirm: () => {
                deleteSmtpAccount(String(smtpSecret?.linkRow?.accountId));
            },
        });


    return <>

        <div
            className={cn(
                "col-span-12 md:col-span-6",
                "rounded-lg border text-brand-foreground p-5 bg-card border-border"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-base font-medium">{parsedVaultValues.label}</div>
                    <div className="mt-1 text-sm  flex items-center gap-2">
														<span className="inline-flex items-center gap-1">
															<Lock className="h-3.5 w-3.5" />
                                                            {parsedVaultValues.SMTP_HOST}:
                                                            {parsedVaultValues.SMTP_PORT}
														</span>
                        <span className="">•</span>
                        <span className="inline-flex items-center gap-1">
															<ShieldCheck className="h-3.5 w-3.5" />
                            {parsedVaultValues.SMTP_SECURE === "true"
                                ? "TLS"
                                : "STARTTLS"}
														</span>
                    </div>
                    {parsedVaultValues.SMTP_FROM_EMAIL && (
                        <div className="mt-1 text-xs  inline-flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            From: {parsedVaultValues.SMTP_FROM_EMAIL}
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={openEdit}
                    >
                        <Pencil className="h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        onClick={confirmDelete}
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>
        </div>

    </>
}

export default SmtpAccountCard;
