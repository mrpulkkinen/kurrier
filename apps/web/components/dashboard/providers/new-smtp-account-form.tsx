"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { createSmtpAccount } from "@/lib/actions/dashboard";
import { SMTP_SPEC } from "@schema";
import { ReusableForm } from "@/components/common/reusable-form";

function NewSmtpAccountForm() {

    const fields = [
        {
            name: `label`,
            label: "Label for this account",
            required: true,
            props: { autoComplete: "off", required: true },
        },
        ...SMTP_SPEC.requiredEnv.map((row) => {

            return {
                name: `required.${row}`,
                label: <code className="rounded bg-muted/50 px-2 py-1 text-xs">{row}</code>,
                required: true,
                props: { autoComplete: "off", required: true },
            }
        }),
        { el: (
                <div className="my-3 md:my-4">
                    <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                        Optional Environment Vars
                    </h4>
                </div>
            )
        },
        ...SMTP_SPEC.optionalEnv.map((row) => {
            if (row === "SMTP_SECURE" || row === "IMAP_SECURE") {
                return {
                    name: `optional.${row}`,
                    label: <code className="rounded bg-muted/50 px-2 py-1 text-xs">{row}</code>,
                    kind: "select",
                    options: [
                        { label: "TRUE", value: "true" },
                        { label: "FALSE", value: "false" },
                    ],
                    required: false,
                    wrapperClasses: "col-span-12 sm:col-span-6",
                    props: { autoComplete: "off", required: false, defaultValue: "false", className: "w-full" },
                }
            }
            return {
                name: `optional.${row}`,
                label: <code className="rounded bg-muted/50 px-2 py-1 text-xs">{row}</code>,
                required: false,
                wrapperClasses: "col-span-12 sm:col-span-6",
                props: { autoComplete: "off", required: false },
            }
        }),
    ];

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="default" size="lg" className="my-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Add SMTP Account
                </Button>
            </DialogTrigger>

            <DialogContent tabIndex={-1}>
                {/*<DialogHeader className="px-6 pt-6 pb-4 sticky top-0 z-10 bg-background/80 backdrop-blur">*/}
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">New SMTP Account</DialogTitle>
                    <DialogDescription>
                        Configure connection details for your SMTP provider. Required variables must be filled in before you can send mail.
                    </DialogDescription>
                </DialogHeader>

                {/* Scroll only the body */}
                <div className="px-6 pb-6 overflow-y-auto max-h-[75dvh] md:max-h-[70dvh]">
                    <section className="space-y-4">
                        <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                            Required Environment
                        </h4>

                        <ReusableForm action={createSmtpAccount} fields={fields} />
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default NewSmtpAccountForm;
