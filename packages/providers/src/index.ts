import type { Providers } from "@schema";
import type { Mailer } from "./core";
import { SmtpMailer } from "./mail/smtp";

export function createMailer(provider: Providers, config: unknown): Mailer {
    switch (provider) {
        case "smtp":
            return SmtpMailer.from(config);
        // Add others when you implement them:
        // case "ses": return SesMailer.from(config)
        // case "sendgrid": return SendgridMailer.from(config)
        default:
            throw new Error(`Provider not implemented: ${provider}`);
    }
}

export * from "./core";
export * from "./mail/map";
