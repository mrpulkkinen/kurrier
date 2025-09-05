"use client";

import * as React from "react";
import { Container } from "@/components/common/containers";
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Copy,
    ExternalLink,
    Play,
    CheckCircle2,
    XCircle, FilePlus2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ----------------------- Mock provider catalog ----------------------- */

type ProviderKey = "ses" | "sendgrid" | "mailgun" | "postmark";

type ProviderSpec = {
    key: ProviderKey;
    name: string;
    docsUrl: string;
    requiredEnv: string[];
};

const PROVIDERS: ProviderSpec[] = [
    {
        key: "ses",
        name: "Amazon SES",
        docsUrl: "https://docs.aws.amazon.com/ses/latest/dg/Welcome.html",
        requiredEnv: [
            "SES_ACCESS_KEY_ID",
            "SES_SECRET_ACCESS_KEY",
            "SES_REGION",
            "SES_FROM_EMAIL",
        ],
    },
    {
        key: "sendgrid",
        name: "SendGrid",
        docsUrl: "https://docs.sendgrid.com/",
        requiredEnv: ["SENDGRID_API_KEY", "SENDGRID_FROM_EMAIL"],
    },
    {
        key: "mailgun",
        name: "Mailgun",
        docsUrl: "https://documentation.mailgun.com/",
        requiredEnv: ["MAILGUN_API_KEY", "MAILGUN_DOMAIN", "MAILGUN_FROM_EMAIL"],
    },
    {
        key: "postmark",
        name: "Postmark",
        docsUrl: "https://postmarkapp.com/developer",
        requiredEnv: ["POSTMARK_SERVER_TOKEN", "POSTMARK_FROM_EMAIL"],
    },
];

const SMTP = {
    name: "Generic SMTP",
    docsUrl: "https://www.rfc-editor.org/rfc/rfc5321", // or your own docs page
    requiredEnv: ["SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD"] as const,
    optionalEnv: [
        "SMTP_SECURE", // "true" for TLS (465), "false" or empty for STARTTLS/plain (587/25)
        "SMTP_FROM_EMAIL",
        "SMTP_FROM_NAME",
        // Receiving (optional, if you want IMAP discovery later)
        "IMAP_HOST",
        "IMAP_PORT",
        "IMAP_USERNAME",
        "IMAP_PASSWORD",
        "IMAP_SECURE",
    ] as const,
    help:
        "Works with cPanel, Office365, and most mail hosts. Provide host, port, and credentials. " +
        "Use SMTP_SECURE=true for implicit TLS (port 465); leave empty/false for STARTTLS (587). " +
        "IMAP vars are optional and only needed if you plan to receive/sync messages.",
};


/** In OSS mode these are read from process.env; here we just simulate presence. */
function isPresent(envVar: string) {
    // Feel free to swap this mock with a real server-provided map
    const mockPresent = new Set<string>([
        // "SES_ACCESS_KEY_ID",
        // "SES_SECRET_ACCESS_KEY",
        // "SES_REGION",
        // "SES_FROM_EMAIL",
        // "SENDGRID_API_KEY",
        // "SENDGRID_FROM_EMAIL",
        // "MAILGUN_API_KEY",
        // "MAILGUN_DOMAIN",
        // "MAILGUN_FROM_EMAIL",
        // "POSTMARK_SERVER_TOKEN",
        // "POSTMARK_FROM_EMAIL",
    ]);
    return mockPresent.has(envVar);
}

/* ----------------------- UI Bits ----------------------- */

function StatusBadge({ ok }: { ok: boolean }) {
    return ok ? (
        <Badge className="gap-1" variant="default">
            <CheckCircle2 className="size-3.5" />
            Configured
        </Badge>
    ) : (
        <Badge className="gap-1 bg-amber-100 text-amber-900 dark:bg-amber-300/20 dark:text-amber-200">
            <XCircle className="size-3.5" />
            Missing env
        </Badge>
    );
}

function EnvRow({
                    name,
                    present,
                }: {
    name: string;
    present: boolean;
}) {
    const [copied, setCopied] = React.useState(false);

    async function copy() {
        await navigator.clipboard.writeText(name);
        setCopied(true);
        setTimeout(() => setCopied(false), 900);
    }

    return (
        <div className="grid grid-cols-12 items-center rounded-lg border p-3 sm:p-4">
            <div className="col-span-12 sm:col-span-6">
                <code className="rounded bg-muted/50 px-2 py-1 text-sm">{name}</code>
            </div>
            <div className="col-span-6 mt-2 flex items-center sm:col-span-3 sm:mt-0">
        <span
            className={cn(
                "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs",
                present
                    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-300/15 dark:text-emerald-200"
                    : "bg-muted text-muted-foreground",
            )}
        >
          {present ? (
              <>
                  <CheckCircle2 className="size-3.5" /> Present
              </>
          ) : (
              <>
                  <XCircle className="size-3.5" /> Missing
              </>
          )}
        </span>
            </div>
            <div className="col-span-6 mt-2 flex justify-end gap-2 sm:col-span-3 sm:mt-0">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={copy}
                    className="gap-2"
                    title="Copy variable name"
                >
                    <Copy className="size-4" />
                    {copied ? "Copied" : "Copy"}
                </Button>
            </div>
        </div>
    );
}


function SMTPCard() {
    const required = SMTP.requiredEnv.map((n) => ({ name: n, present: isPresent(n), optional: false }));
    const optional = SMTP.optionalEnv.map((n) => ({ name: n, present: isPresent(n), optional: true }));
    const allGood = required.every((e) => e.present);

    function onTest() {
        alert(allGood ? "SMTP: looks configured (mock)." : "SMTP: missing required env vars (mock).");
    }

    async function copyTemplate() {
        const requiredLines = SMTP.requiredEnv.map((k) => `${k}=`).join("\n");
        const optionalLines = SMTP.optionalEnv.map((k) => `# ${k}=`).join("\n");
        const block = `# ${SMTP.name}\n${requiredLines}\n${optionalLines}\n`;
        await navigator.clipboard.writeText(block);
        alert(".env template copied");
    }

    return (
        <Card className="shadow-none">
            <CardHeader className="gap-3">
                {/* stack by default; only go side-by-side on lg */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* left: title + description */}
                    <div className="space-y-1 lg:max-w-[56ch]">
                        <CardTitle className="text-lg sm:text-xl">{SMTP.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Managed via environment variables. Enable by adding the keys to your deployment.
                        </p>
                        <p className="text-xs text-muted-foreground/80">
                            {SMTP.help}
                        </p>
                    </div>

                    {/* right: actions — full width & wrapping on small; tight row on lg */}
                    <CardAction className="flex w-full flex-wrap gap-2 lg:w-auto lg:flex-nowrap lg:justify-end">
                        <StatusBadge ok={allGood} />

                        <Button
                            variant="outline"
                            asChild
                            className="h-8 px-3 text-xs lg:h-9 lg:px-4 lg:text-sm"
                        >
                            <a href={SMTP.docsUrl} target="_blank" rel="noreferrer" className="gap-2">
                                <ExternalLink className="size-4" />
                                Docs
                            </a>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={copyTemplate}
                            className="h-8 px-3 text-xs lg:h-9 lg:px-4 lg:text-sm gap-2"
                        >
                            <FilePlus2 className="size-4" />
                            Copy .env template
                        </Button>

                        <Button
                            onClick={onTest}
                            className="h-8 px-3 text-xs lg:h-9 lg:px-4 lg:text-sm gap-2"
                        >
                            <Play className="size-4" />
                            Test Connection
                        </Button>
                    </CardAction>
                </div>
            </CardHeader>

            <CardContent className="space-y-5">
                <div className="space-y-3">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Required</div>
                    {required.map((row) => (
                        <EnvRow key={row.name} name={row.name} present={row.present} />
                    ))}
                </div>

                {!!optional.length && (
                    <div className="space-y-3">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Optional</div>
                        {optional.map((row) => (
                            <EnvRow key={row.name} name={row.name} present={row.present} />
                        ))}
                    </div>
                )}

                {!allGood && (
                    <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                        Add the missing variables above to enable <strong>{SMTP.name}</strong>. Values live in your
                        deployment’s environment — this app doesn’t store provider secrets.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ProviderCard({ spec }: { spec: ProviderSpec }) {
    const envStatuses = spec.requiredEnv.map((v) => ({
        name: v,
        present: isPresent(v),
    }));
    const allGood = envStatuses.every((e) => e.present);

    function onTest() {
        // Placeholder: trigger a provider-wide health check (ping or sample send)
        // For now just toast/alert
        alert(
            allGood
                ? `${spec.name}: looks configured (mock).`
                : `${spec.name}: missing env vars (mock).`,
        );
    }

    return (
        <Card className="shadow-none">
            <CardHeader className="gap-3">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* left */}
                    <div className="space-y-1 lg:max-w-[56ch]">
                        <CardTitle className="text-lg sm:text-xl">{spec.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Managed via environment variables. Toggle by adding/removing keys.
                        </p>
                    </div>

                    {/* right (actions) */}
                    <CardAction className="flex w-full flex-wrap gap-2 lg:w-auto lg:flex-nowrap lg:justify-end">
                        <StatusBadge ok={allGood} />

                        <Button
                            variant="outline"
                            asChild
                            className="h-8 px-3 text-xs lg:h-9 lg:px-4 lg:text-sm"
                        >
                            <a href={spec.docsUrl} target="_blank" rel="noreferrer" className="gap-2">
                                <ExternalLink className="size-4" />
                                Docs
                            </a>
                        </Button>

                        <Button
                            onClick={onTest}
                            className="h-8 px-3 text-xs lg:h-9 lg:px-4 lg:text-sm gap-2"
                        >
                            <Play className="size-4" />
                            Test Connection
                        </Button>
                    </CardAction>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Required ENV
                </div>

                <div className="space-y-3">
                    {envStatuses.map((row) => (
                        <EnvRow key={row.name} name={row.name} present={row.present} />
                    ))}
                </div>

                {!allGood && (
                    <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                        Add the missing variables above to enable <strong>{spec.name}</strong>.
                        Values live in your deployment’s environment — this app doesn’t store provider secrets.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/* ----------------------- Page ----------------------- */

export default function ProvidersPage() {
    return (
        <Container variant="wide">
            <div className="my-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-brand-600">Providers</h1>
                </div>

                <p className="max-w-prose text-sm text-muted-foreground">
                    Configure email providers by setting environment variables. We never store your
                    credentials; the app only checks whether required keys exist and then performs
                    a provider-level test when you ask it to.
                </p>

                <div className="grid gap-6 lg:grid-cols-2">
                    {PROVIDERS.map((p) => (
                        <ProviderCard key={p.key} spec={p} />
                    ))}
                </div>
                <div className="grid gap-6">
                    <SMTPCard />
                </div>
            </div>
        </Container>
    );
}
