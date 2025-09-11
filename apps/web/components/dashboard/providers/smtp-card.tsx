"use client";
import { SMTP_SPEC } from "@schema";
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {Plus, Trash2, Pencil, ShieldCheck, Lock, Mail, Edit, Delete} from "lucide-react";
import * as React from "react";
import { modals } from "@mantine/modals";
import NewSmtpAccountForm from "@/components/dashboard/providers/new-smtp-account-form";
import {
    deleteSmtpAccount,
    SmtpAccountsWithSecretsResult,
} from "@/lib/actions/dashboard";
import { cn } from "@/lib/utils";

export default function SMTPCard({
                                     accountsWithSecrets,
                                 }: {
    accountsWithSecrets: SmtpAccountsWithSecretsResult;
}) {
    const openAddModal = () =>
        modals.open({
            title: <div className="font-semibold text-brand-600">Add SMTP Account</div>,
            size: "lg",
            children: (
                <div className="p-2">
                    <NewSmtpAccountForm />
                </div>
            ),
        });

    return (
        <div className="grid grid-cols-12">
            <div className="col-span-12 flex flex-col">
                <Card>
                    <CardHeader className="gap-2">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl">
                                <CardTitle className="text-xl">{SMTP_SPEC.name}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Manage app-level SMTP accounts. Secrets are stored in your vault
                                    and linked to accounts here.
                                </p>
                                <p className="text-xs text-muted-foreground/80 mt-1">{SMTP_SPEC.help}</p>
                            </div>

                            <CardAction className="mt-3 lg:mt-0">
                                <Button variant="default" size="sm" onClick={openAddModal} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add SMTP Account
                                </Button>
                            </CardAction>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {(!accountsWithSecrets || accountsWithSecrets.length === 0) && (
                            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground text-center flex flex-col items-center gap-4 bg-neutral-50/50">
                                <div>
                                    <div className="font-medium text-neutral-800">No SMTP accounts yet</div>
                                    <div className="text-xs text-neutral-500 mt-1">
                                        Add an account to start sending mail from your app.
                                    </div>
                                </div>
                                <Button variant="default" size="sm" onClick={openAddModal} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add SMTP Account
                                </Button>
                            </div>
                        )}

                        {!!accountsWithSecrets?.length && (
                            <div className="grid grid-cols-12 gap-6">
                                {accountsWithSecrets.map((account) => {
                                    const a = account.smtp_accounts;
                                    const parseVaultValues = account.decrypted.vault && account.decrypted.vault.decrypted_secret ? JSON.parse(account.decrypted.vault.decrypted_secret) : {};
                                    const openEdit = () =>
                                        modals.open({
                                            title: (
                                                <div className="font-semibold text-brand-600">
                                                    Edit SMTP Account
                                                </div>
                                            ),
                                            size: "lg",
                                            children: (
                                                <div className="p-2">
                                                    <NewSmtpAccountForm vault={account.decrypted.vault} secretId={account?.smtp_account_secrets?.secretId} accountId={account?.smtp_accounts.id} />
                                                </div>
                                            ),
                                        });

                                    const confirmDelete = () =>
                                        modals.openConfirmModal({
                                            title: "Delete SMTP Account",
                                            centered: true,
                                            children: (
                                                <div className="text-sm ">
                                                    Are you sure you want to delete <b>{a.label}</b>? This
                                                    will remove the account and unlink any associated secrets.
                                                </div>
                                            ),
                                            labels: { confirm: "Delete", cancel: "Cancel" },
                                            confirmProps: { color: "red" },
                                            onConfirm: () => {
                                                deleteSmtpAccount(a.id)
                                            },
                                        });

                                    return (
                                        <div
                                            key={a.id}
                                            className={cn(
                                                "col-span-12 md:col-span-6",
                                                "rounded-lg border text-brand-foreground p-5",
                                                "hover:shadow-sm transition-shadow"
                                            )}
                                        >

                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-base font-medium">
                                                        {a.label}
                                                    </div>
                                                    <div className="mt-1 text-sm  flex items-center gap-2">
                            <span className="inline-flex items-center gap-1">
                              <Lock className="h-3.5 w-3.5 opacity-70" />
                                {parseVaultValues.SMTP_HOST}:{parseVaultValues.SMTP_PORT}
                            </span>
                                                        <span className="">•</span>
                                                        <span className="inline-flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5 opacity-70" />
                                                            {parseVaultValues.SMTP_SECURE === "true" ? "TLS" : "STARTTLS"}
                            </span>
                                                    </div>
                                                    {parseVaultValues.SMTP_FROM_EMAIL && (
                                                        <div className="mt-1 text-xs  inline-flex items-center gap-1">
                                                            <Mail className="h-3.5 w-3.5 opacity-70" />
                                                            From: {parseVaultValues.SMTP_FROM_EMAIL}
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
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}



// "use client";
// import { SMTP_SPEC } from "@schema";
// import {
// 	Card,
// 	CardAction,
// 	CardContent,
// 	CardHeader,
// 	CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Plus } from "lucide-react";
// import * as React from "react";
// import {
//     SmtpAccountsWithSecretsResult,
// } from "@/lib/actions/dashboard";
// import NewSmtpAccountForm from "@/components/dashboard/providers/new-smtp-account-form";
// import {modals} from "@mantine/modals";
//
// export default function SMTPCard({accountsWithSecrets}: {accountsWithSecrets: SmtpAccountsWithSecretsResult}) {
//
// 	return (
// 		<>
// 			<div className={"grid grid-cols-12"}>
// 				<div className={"col-span-12 flex flex-col"}>
// 					<Card className="shadow-none">
// 						<CardHeader className="gap-3">
// 							{/* stack by default; only go side-by-side on lg */}
// 							<div className={"flex flex-col"}>
// 								<CardTitle className="text-lg sm:text-xl">
// 									{SMTP_SPEC.name}
// 								</CardTitle>
// 								<p className="text-sm text-muted-foreground my-1">
// 									Managed via environment variables. Enable by adding the keys
// 									to your deployment.
// 								</p>
// 								<p className="text-xs text-muted-foreground/80">
// 									{SMTP_SPEC.help}
// 								</p>
//
// 								<CardAction className="flex w-full flex-wrap gap-2 lg:w-auto lg:flex-nowrap lg:justify-end my-4">
//                                     {/*<NewSmtpAccountForm />*/}
//                                     <Button variant="default" size={"sm"} onClick={() => {
//                                         modals.open({
//                                             title: <div className={"font-bold text-brand-600"}>Add SMTP Account</div>,
//                                             size: "lg",
//                                             children: (
//                                                 <div className={"p-2"}>
//                                                     <NewSmtpAccountForm />
//                                                 </div>
//                                             )
//                                         });
//                                     }}>
//                                         <Plus className="h-4 w-4" />
//                                         Add SMTP Account
//                                     </Button>
// 								</CardAction>
// 							</div>
//
//
// 						</CardHeader>
//
// 						<CardContent className="space-y-5">
// 							{accountsWithSecrets?.length === 0 && (
// 								<div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground text-center flex flex-col justify-center items-center gap-4">
// 									<span>
// 										No SMTP accounts yet. Once you add an account, it will show
// 										up here.
// 									</span>
//                                     <Button variant="default" size={"sm"} onClick={() => {
//                                         modals.open({
//                                             title: <div className={"font-bold text-brand-600"}>Add SMTP Account</div>,
//                                             size: "lg",
//                                             children: (
//                                                 <div className={"p-2"}>
//                                                     <NewSmtpAccountForm />
//                                                 </div>
//                                             )
//                                         });
//                                     }}>
//                                         <Plus className="h-4 w-4" />
//                                         Add SMTP Account
//                                     </Button>
// 								</div>
// 							)}
//
//
//                             <div className={"grid grid-cols-12 gap-8"}>
//                                 {accountsWithSecrets?.map((account) => {
//                                     return <div key={account.smtp_accounts.id} className={"col-span-6 bg-neutral-50 p-4 rounded-md border border-neutral-200"}>
//
//                                         <NewSmtpAccountForm vault={account.decrypted.vault} />
//
//                                     </div>
//                                 })}
//                             </div>
//
//
// 						</CardContent>
// 					</Card>
// 				</div>
// 			</div>
// 		</>
// 	);
//
// }
