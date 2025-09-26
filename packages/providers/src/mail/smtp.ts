import nodemailer, { type Transporter } from "nodemailer";
import {
	DomainIdentity,
	Mailer,
	RawSmtpConfigSchema,
	SmtpVerifyInput,
	VerifyResult,
} from "../core";
import { ImapFlow } from "imapflow";

export class SmtpMailer implements Mailer {
	private transporter: Transporter;
	private imapClient: ImapFlow | null;

	private constructor(cfg: SmtpVerifyInput) {
		this.transporter = nodemailer.createTransport({
			host: cfg.host,
			port: cfg.port,
			secure: cfg.secure ?? false,
			auth: cfg.auth,
			pool: cfg.pool ?? false,
		});
		this.imapClient = cfg.imap
			? new ImapFlow({
					host: cfg.imap.host,
					port: cfg.imap.port,
					secure: cfg.imap.secure,
					auth: {
						user: cfg.imap.user,
						pass: cfg.imap.pass,
					},
				})
			: null;
	}

	static from(raw: unknown): SmtpMailer {
		const cfg = RawSmtpConfigSchema.parse(raw);
		return new SmtpMailer(cfg);
	}

	async verify(): Promise<VerifyResult> {
		const meta: Record<string, unknown> = { send: false, receive: undefined };

		try {
			const ok = await this.transporter.verify();
			meta.send = !!ok;

			if (this.imapClient) {
				try {
					await this.imapClient.connect();
					await this.imapClient.noop();
					meta.receive = true;
				} catch (err: any) {
					meta.receive = false;
					meta.response = err?.message ?? String(err);
				} finally {
					if (this.imapClient?.authenticated) {
						try {
							await this.imapClient.logout();
						} catch {}
					} else {
						try {
							await this.imapClient?.close();
						} catch {}
					}
				}
			}

			return { ok: true, message: "OK", meta };
		} catch (err: any) {
			return {
				ok: false,
				message: err?.message ?? "SMTP verify failed",
				meta: { code: err?.code, response: err?.response || err?.responseText },
			};
		} finally {
			try {
				(this.transporter as any).close?.();
			} catch {}
		}
	}

	async sendTestEmail(
		to: string,
		opts?: { subject?: string; body?: string },
	): Promise<boolean> {
		try {
			await this.transporter.sendMail({
				from: (this.transporter.options as any).auth.user,
				to,
				subject: opts?.subject ?? "Test email",
				text:
					opts?.body ?? "This is a test email from your configured provider.",
			});
			return true;
		} catch (err) {
			console.error("sendTestEmail error", err);
			return false;
		}
	}

	async addDomain(): Promise<DomainIdentity> {
		return {
			domain: "",
			status: "unverified",
			dns: [],
			meta: { info: "SMTP does not support domain identities" },
		};
	}

	async removeDomain(): Promise<DomainIdentity> {
		return {
			domain: "",
			status: "unverified",
			dns: [],
			meta: { info: "SMTP does not support domain identities" },
		};
	}

	async verifyDomain(): Promise<DomainIdentity> {
		return {
			domain: "",
			status: "unverified",
			dns: [],
			meta: { info: "SMTP does not support domain identities" },
		};
	}

	async addEmail() {
		return {} as any;
	}

	async removeEmail() {
		return {} as any;
	}

	async sendEmail() {
		return {} as any;
	}

	// async close(): Promise<void> {
	//     // best-effort close if transport supports it
	//     try {
	//         this.transporter.close?.();
	//     } catch { /* ignore */ }
	// }
}
