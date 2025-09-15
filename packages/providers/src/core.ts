import {z} from "zod";

export type VerifyResult = {
    ok: boolean;
    message?: string;
    meta?: Record<string, unknown>;
};


export const RawSmtpConfigSchema = z
    .object({
        SMTP_HOST: z.string(),
        SMTP_PORT: z.coerce.number(),
        SMTP_SECURE: z.enum(["true", "false"]).transform(v => v === "true").optional(),

        SMTP_USERNAME: z.string(),
        SMTP_PASSWORD: z.string(),
        SMTP_POOL: z.enum(["true", "false"]).transform(v => v === "true").optional(),

        IMAP_HOST: z.string().optional(),
        IMAP_PORT: z.coerce.number().optional(),
        IMAP_USERNAME: z.string().optional(),
        IMAP_PASSWORD: z.string().optional(),
        IMAP_SECURE: z.enum(["true", "false"]).transform(v => v === "true").optional(),
    })
    .transform(r => ({
        host: r.SMTP_HOST,
        port: r.SMTP_PORT,
        secure: r.SMTP_SECURE ?? false,
        auth: { user: r.SMTP_USERNAME, pass: r.SMTP_PASSWORD },
        pool: r.SMTP_POOL,

        imap:
            r.IMAP_HOST && r.IMAP_PORT && r.IMAP_USERNAME && r.IMAP_PASSWORD
                ? {
                    host: r.IMAP_HOST,
                    port: r.IMAP_PORT,
                    user: r.IMAP_USERNAME,
                    pass: r.IMAP_PASSWORD,
                    secure: r.IMAP_SECURE ?? true,
                }
                : undefined,
    }));

export type SmtpVerifyInput = z.infer<typeof RawSmtpConfigSchema>;

// export const SmtpVerifySchema = z.object({
//     host: z.string(),
//     port: z.coerce.number(),
//     secure: z.enum(["true", "false"]).transform(val => val === "true").optional(), // true => 465 (implicit TLS)
//     auth: z.object({
//         user: z.string(),
//         pass: z.string(),
//     }),
//     pool: z.enum(["true", "false"]).transform(val => val === "true").optional(),
//     imap: z.object({
//         host: z.string(),
//         port: z.coerce.number(),
//         user: z.string(),
//         pass: z.string(),
//         secure: z.enum(["true", "false"]).transform(val => val === "true"),
//     }).optional(),
// });
// export type SmtpVerifyInput = z.infer<typeof SmtpVerifySchema>;


// export type MailAddress = string | { name?: string; address: string };
//
// export type Mail = {
//     to: MailAddress | MailAddress[];
//     from: MailAddress;
//     subject: string;
//     text?: string;
//     html?: string;
//     headers?: Record<string, string>;
// };

// export type SendResult = {
//     id?: string;
//     accepted?: string[];
//     rejected?: string[];
//     provider?: Providers;
//     meta?: Record<string, unknown>;
// };

export interface Mailer {
    verify(): Promise<VerifyResult>;
    sendTestEmail(to: string, opts?: { subject?: string; body?: string }): Promise<boolean>;
    // send?(mail: Mail): Promise<SendResult>;
    // close?(): Promise<void>;
}
