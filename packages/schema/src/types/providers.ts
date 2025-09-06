import {z} from "zod";

export const providersList = ["smtp", "ses", "mailgun", "postmark", "sendgrid"] as const;
export const ProvidersEnum = z.enum(providersList);
export type Providers = z.infer<typeof ProvidersEnum>;


/** UI label for each provider key */
export const ProviderLabels: Record<Providers, string> = {
    smtp: "Generic SMTP",
    ses: "Amazon SES",
    mailgun: "Mailgun",
    postmark: "Postmark",
    sendgrid: "SendGrid",
};

/** Minimal spec used by the Providers page */
export type ProviderSpec = {
    key: Exclude<Providers, "smtp">; // SMTP is shown separately
    name: string;
    docsUrl: string;
    requiredEnv: string[];
};

/** Catalog for API providers (non-SMTP) */
export const PROVIDERS: ProviderSpec[] = [
    {
        key: "ses",
        name: ProviderLabels.ses,
        docsUrl: "https://docs.aws.amazon.com/ses/latest/dg/Welcome.html",
        requiredEnv: ["SES_ACCESS_KEY_ID", "SES_SECRET_ACCESS_KEY", "SES_REGION", "SES_FROM_EMAIL"],
    },
    {
        key: "sendgrid",
        name: ProviderLabels.sendgrid,
        docsUrl: "https://docs.sendgrid.com/",
        requiredEnv: ["SENDGRID_API_KEY", "SENDGRID_FROM_EMAIL"],
    },
    {
        key: "mailgun",
        name: ProviderLabels.mailgun,
        docsUrl: "https://documentation.mailgun.com/",
        requiredEnv: ["MAILGUN_API_KEY", "MAILGUN_DOMAIN", "MAILGUN_FROM_EMAIL"],
    },
    {
        key: "postmark",
        name: ProviderLabels.postmark,
        docsUrl: "https://postmarkapp.com/developer",
        requiredEnv: ["POSTMARK_SERVER_TOKEN", "POSTMARK_FROM_EMAIL"],
    },
];

/** SMTP block used by the SMTP card */
export const SMTP_SPEC = {
    key: "smtp" as const,
    name: ProviderLabels.smtp,
    docsUrl: "https://www.rfc-editor.org/rfc/rfc5321",
    requiredEnv: ["SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD"] as const,
    optionalEnv: [
        "SMTP_SECURE",       // true => implicit TLS(465); false/empty => STARTTLS (587)
        "SMTP_FROM_EMAIL",
        "SMTP_FROM_NAME",
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








// export type Providers = "smtp" | "ses" | "mailgun" | "postmark" | "sendgrid";
//
// interface BaseProviderConfig {
//     provider: Providers;
// }
//
// export const ProviderLabels: Record<Providers, string> = {
//     smtp: "Custom SMTP",
//     ses: "Amazon SES",
//     mailgun: "Mailgun",
//     postmark: "Postmark",
//     sendgrid: "SendGrid",
// };
//
// export interface SmtpProviderConfig extends BaseProviderConfig {
//     provider: "smtp";
//     SMTP_HOST: string;
//     SMTP_PORT: number;
//     SMTP_USER: string;
//     SMTP_PASS: string;
//     SMTP_FROM_EMAIL: string;
// }
//
// // Amazon SES
// export interface SesProviderConfig extends BaseProviderConfig {
//     provider: "ses";
//     SES_ACCESS_KEY_ID: string;
//     SES_SECRET_ACCESS_KEY: string;
//     // SES_REGION: string;
//     // SES_FROM_EMAIL: string;
// }
//
// // Mailgun
// export interface MailgunProviderConfig extends BaseProviderConfig {
//     provider: "mailgun";
//     MAILGUN_API_KEY: string;
// }
//
// // Postmark
// export interface PostmarkProviderConfig extends BaseProviderConfig {
//     provider: "postmark";
//     POSTMARK_API_TOKEN: string;
// }
//
// // SendGrid
// export interface SendGridProviderConfig extends BaseProviderConfig {
//     provider: "sendgrid";
//     SENDGRID_API_KEY: string;
//     SENDGRID_FROM_EMAIL: string;
// }
//
// // Discriminated union of all configs
// export type ProviderConfig =
//     | SmtpProviderConfig
//     | SesProviderConfig
//     | MailgunProviderConfig
//     | PostmarkProviderConfig
//     | SendGridProviderConfig;
