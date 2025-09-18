import {
	DnsRecord,
	DomainIdentity,
	EmailIdentity,
	Mailer,
	RawSesConfigSchema,
	SesConfig,
	VerifyResult,
} from "../core";
import {
	CreateReceiptRuleSetCommand,
	DeleteReceiptRuleCommand,
	DescribeActiveReceiptRuleSetCommand,
	GetSendQuotaCommand,
	ListReceiptRuleSetsCommand,
	ReceiptRule,
	SendEmailCommand,
	SESClient,
	SetActiveReceiptRuleSetCommand,
	SetReceiptRulePositionCommand,
	UpdateReceiptRuleCommand,
} from "@aws-sdk/client-ses";
import {
	S3Client,
	HeadBucketCommand,
	CreateBucketCommand,
	PutBucketPolicyCommand,
	CreateBucketCommandInput,
	BucketLocationConstraint,
	PutPublicAccessBlockCommand,
} from "@aws-sdk/client-s3";
import {
	SNSClient,
	CreateTopicCommand,
	GetTopicAttributesCommand,
	SetTopicAttributesCommand,
	ListSubscriptionsByTopicCommand,
	SubscribeCommand,
} from "@aws-sdk/client-sns";
import {
	SES,
	DescribeReceiptRuleSetCommand,
	CreateReceiptRuleCommand,
} from "@aws-sdk/client-ses";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

import {
	SESv2Client,
	CreateEmailIdentityCommand,
	GetEmailIdentityCommand,
	DeleteEmailIdentityCommand,
	PutEmailIdentityMailFromAttributesCommand,
	// DeleteEmailIdentityCommand,
} from "@aws-sdk/client-sesv2";
import slugify from "@sindresorhus/slugify";
import { ulid } from "ulid";

type BootResult = {
	bucket: string;
	topicArn: string;
	ruleSetName: string;
	bucketExists: boolean;
	topicExists: boolean;
	ruleCreated: boolean;
};

export class SesMailer implements Mailer {
	private client: SESClient;
	private v2: SESv2Client;
	private cfg: SesConfig;

	private constructor(cfg: SesConfig) {
		const shared = {
			region: cfg.region,
			credentials: {
				accessKeyId: cfg.accessKeyId,
				secretAccessKey: cfg.secretAccessKey,
			},
		};
		this.cfg = cfg;
		this.client = new SESClient(shared);
		this.v2 = new SESv2Client(shared);
	}

	static from(raw: unknown): SesMailer {
		const cfg = RawSesConfigSchema.parse(raw);
		return new SesMailer(cfg);
	}

	async verify(
		id: string,
		metaData?: Record<string, any>,
	): Promise<VerifyResult> {
		try {
			const q = await this.client.send(new GetSendQuotaCommand({}));
			const bootResult = await this.bootstrap(id, metaData || {});

			return {
				ok: true,
				message: "OK",
				meta: {
					send: true,
					// handy diagnostics:
					max24HourSend: q.Max24HourSend,
					maxSendRate: q.MaxSendRate,
					sentLast24Hours: q.SentLast24Hours,
					resourceIds: bootResult,
				},
			};
		} catch (err: any) {
			return {
				ok: false,
				message: err?.message ?? "SES verify failed",
				meta: {
					code: err?.name,
					httpStatus: err?.$metadata?.httpStatusCode,
				},
			};
		}
	}

	private baseNames(id: string) {
		const base = `kurrier-${id ?? "acct"}`;
		return {
			bucket: `${base}-ses-inbound`,
			topicName: `${base}-ses-inbound-topic`,
			ruleSetName: `${base}-rules`,
			defaultRuleName: `${base}-inbound-default`,
		};
	}

	private async ensureRuleSet(
		ses: SES,
		desired: string,
	): Promise<{ name: string; usedExistingActive: boolean }> {
		const active = await ses.send(new DescribeActiveReceiptRuleSetCommand({}));
		if (active.Metadata?.Name)
			return { name: active.Metadata.Name, usedExistingActive: true };

		const sets = await ses.send(new ListReceiptRuleSetsCommand({}));
		const exists = sets.RuleSets?.some((r) => r.Name === desired);
		if (!exists) {
			try {
				await ses.send(
					new CreateReceiptRuleSetCommand({ RuleSetName: desired }),
				);
			} catch (e: any) {
				if ((e.name || e.Code) !== "RuleSetNameAlreadyExists") throw e;
			}
		}
		await ses.send(
			new SetActiveReceiptRuleSetCommand({ RuleSetName: desired }),
		);
		return { name: desired, usedExistingActive: false };
	}

	async removeEmail(ruleSetName: string, ruleName: string) {
		const ses = new SES({ region: this.cfg.region, credentials: this.cfg });

		try {
			await ses.send(
				new DeleteReceiptRuleCommand({
					RuleSetName: ruleSetName,
					RuleName: ruleName,
				}),
			);
			return { removed: true };
		} catch (e: any) {
			const code = e?.name || e?.Code;
			if (code === "RuleDoesNotExist") return { removed: false };
			throw e;
		}
	}

	async addEmail(
		address: string,
		metaData?: Record<string, any>,
	): Promise<EmailIdentity> {
		const ses = new SES({ region: this.cfg.region, credentials: this.cfg });
		const res = metaData?.resourceIds as BootResult | undefined;

		if (!res?.bucket || !res?.topicArn || !res?.ruleSetName) {
			throw new Error(
				"Missing SES bootstrap resource IDs (bucket/topicArn/ruleSetName).",
			);
		}

		const normalized = address.trim().toLowerCase();
		const { bucket, topicArn, ruleSetName } = res;

		const { name: activeRuleSet } = await this.ensureRuleSet(ses, ruleSetName);

		const ruleName = (
			slugify(`${normalized}`, {
				customReplacements: [["@", " at "]],
			}) + `-${ulid()}`
		).slice(0, 64);

		const ruleDef: ReceiptRule = {
			Name: ruleName,
			Enabled: true,
			Recipients: [normalized],
			Actions: [
				{ S3Action: { BucketName: bucket, ObjectKeyPrefix: "inbound/" } },
				{ SNSAction: { TopicArn: topicArn, Encoding: "UTF-8" } },
			],
			ScanEnabled: true,
			TlsPolicy: "Optional",
		};

		// Create-or-update (idempotent)
		let created = false;
		try {
			await ses.send(
				new CreateReceiptRuleCommand({
					RuleSetName: activeRuleSet,
					Rule: ruleDef,
				}),
			);
			created = true;
		} catch (e: any) {
			if ((e?.name || e?.Code) === "RuleAlreadyExists") {
				await ses.send(
					new UpdateReceiptRuleCommand({
						RuleSetName: activeRuleSet,
						Rule: ruleDef,
					}),
				);
			} else {
				throw e;
			}
		}

		await ses.send(
			new SetReceiptRulePositionCommand({
				RuleSetName: activeRuleSet,
				RuleName: ruleName,
			}),
		);

		return { address: normalized, ruleName, ruleSetName, created };
	}

	async ensureWebhookSubscription(
		sns: SNSClient,
		topicArn: string,
		webhookUrl?: string,
	) {
		if (!webhookUrl) return { subscribed: false };

		const existing = await sns.send(
			new ListSubscriptionsByTopicCommand({ TopicArn: topicArn }),
		);
		const same = existing.Subscriptions?.find(
			(s) => s.Endpoint === webhookUrl && s.Protocol?.startsWith("http"),
		);

		if (!same) {
			await sns.send(
				new SubscribeCommand({
					TopicArn: topicArn,
					Protocol: webhookUrl.startsWith("https") ? "https" : "http",
					Endpoint: webhookUrl,
					Attributes: {
						RawMessageDelivery: "true", // get raw JSON
						// Optional filter policy to only receive SES inbound notifications you emit
						// FilterPolicy: JSON.stringify({ source: ["ses"] })
					},
					ReturnSubscriptionArn: true, // will be "pending confirmation" for http(s)
				}),
			);
		}

		return { subscribed: true };
	}

	private async bootstrap(
		id: string,
		metaData: Record<any, any>,
	): Promise<BootResult> {
		const { region, accessKeyId, secretAccessKey } = this.cfg;
		const creds = { region, credentials: { accessKeyId, secretAccessKey } };

		const s3 = new S3Client(creds);
		const sns = new SNSClient(creds);
		const ses = new SES(creds); // classic SES (inbound)
		const sts = new STSClient(creds);

		// Used in resource policies
		const { Account: accountId = "" } = await sts.send(
			new GetCallerIdentityCommand({}),
		);

		const { bucket, topicName, ruleSetName, defaultRuleName } =
			this.baseNames(id);

		let bucketExists = false;
		try {
			await s3.send(new HeadBucketCommand({ Bucket: bucket }));
			bucketExists = true;
		} catch {
			const input: CreateBucketCommandInput = { Bucket: bucket };
			if (region !== "us-east-1") {
				input.CreateBucketConfiguration = {
					LocationConstraint: region as BucketLocationConstraint,
				};
			}
			try {
				await s3.send(new CreateBucketCommand(input));
				bucketExists = true;
			} catch (e: any) {
				const code = e?.name || e?.Code;
				if (code !== "BucketAlreadyOwnedByYou") throw e;
				bucketExists = true;
			}
		}

		// Tight bucket policy for SES → S3 (PutObject)
		// (Optionally include ArnLike SourceArn to further scope to your rule set)
		const bucketPolicy = {
			Version: "2012-10-17",
			Statement: [
				{
					Sid: "AllowSESPutObject",
					Effect: "Allow",
					Principal: { Service: "ses.amazonaws.com" },
					Action: "s3:PutObject",
					Resource: `arn:aws:s3:::${bucket}/*`,
					Condition: {
						StringEquals: { "aws:SourceAccount": accountId },
						// ArnLike: { "aws:SourceArn": `arn:aws:ses:${region}:${accountId}:receipt-rule-set/${ruleSetName}` }
					},
				},
			],
		};
		await s3.send(
			new PutBucketPolicyCommand({
				Bucket: bucket,
				Policy: JSON.stringify(bucketPolicy),
			}),
		);

		await s3.send(
			new PutPublicAccessBlockCommand({
				Bucket: bucket,
				PublicAccessBlockConfiguration: {
					BlockPublicAcls: true,
					IgnorePublicAcls: true,
					BlockPublicPolicy: true,
					RestrictPublicBuckets: true,
				},
			}),
		);

		// -----------------------------------------------------------
		// 2) SNS topic (idempotent) + policy that allows SES Publish
		// -----------------------------------------------------------
		const topicArn = (
			await sns.send(new CreateTopicCommand({ Name: topicName }))
		).TopicArn!;
		let topicExists = false;
		try {
			await sns.send(new GetTopicAttributesCommand({ TopicArn: topicArn }));
			topicExists = true;
		} catch {
			topicExists = false;
		}

		const topicPolicy = {
			Version: "2012-10-17",
			Statement: [
				{
					Sid: "AllowSESPublish",
					Effect: "Allow",
					Principal: { Service: "ses.amazonaws.com" },
					Action: "sns:Publish",
					Resource: topicArn,
					Condition: { StringEquals: { "aws:SourceAccount": accountId } },
					// ArnLike: { "aws:SourceArn": `arn:aws:ses:${region}:${accountId}:receipt-rule-set/${ruleSetName}` }
				},
			],
		};
		await sns.send(
			new SetTopicAttributesCommand({
				TopicArn: topicArn,
				AttributeName: "Policy",
				AttributeValue: JSON.stringify(topicPolicy),
			}),
		);
		const { subscribed } = await this.ensureWebhookSubscription(
			sns,
			topicArn,
			`${metaData.WEB_URL}/api/v1/hooks/aws/sns`,
		);
		console.log("subscribed", subscribed);

		// Create the default inbound rule if missing
		const { name: ruleSetNameInUse, usedExistingActive } =
			await this.ensureRuleSet(ses, ruleSetName);

		let ruleCreated = false;
		if (!usedExistingActive) {
			const current = await ses.send(
				new DescribeReceiptRuleSetCommand({ RuleSetName: ruleSetNameInUse }),
			);
			const hasRule = current.Rules?.some((r) => r.Name === defaultRuleName);

			if (!hasRule) {
				await ses.send(
					new CreateReceiptRuleCommand({
						RuleSetName: ruleSetNameInUse,
						Rule: {
							Name: defaultRuleName,
							Enabled: true,
							// Recipients: [] // empty = catch-all
							Actions: [
								{
									S3Action: { BucketName: bucket, ObjectKeyPrefix: "inbound/" },
								},
								{ SNSAction: { TopicArn: topicArn, Encoding: "UTF-8" } },
							],
							ScanEnabled: true,
							TlsPolicy: "Optional",
						},
					}),
				);
				ruleCreated = true;
			}
		}

		return {
			bucket,
			topicArn,
			ruleSetName: ruleSetNameInUse,
			bucketExists,
			topicExists,
			ruleCreated,
		};
	}

	async addDomain(
		domain: string,
		mailFrom: string,
		incoming?: boolean,
	): Promise<DomainIdentity> {
		// 1) Create/enable identity with Easy DKIM
		try {
			await this.v2.send(
				new CreateEmailIdentityCommand({
					EmailIdentity: domain,
					DkimSigningAttributes: {
						// Easy DKIM
						NextSigningKeyLength: "RSA_2048_BIT",
					},
				}),
			);
		} catch (err: any) {
			// If it already exists, we’ll just proceed to fetch tokens
			if (
				err?.name !== "ConflictException" &&
				err?.name !== "AlreadyExistsException"
			) {
				// Return a minimal object but still surface the error in meta
				return {
					domain,
					status: "unverified" as any,
					dns: [],
					meta: {
						error: err?.name ?? "CreateEmailIdentityError",
						message: err?.message,
					},
				};
			}
		}

		// 2) Fetch identity details to build DNS records + status
		const info = await this.v2.send(
			new GetEmailIdentityCommand({ EmailIdentity: domain }),
		);

		// SESv2 Easy DKIM => CNAME records from Tokens
		const tokens = info.DkimAttributes?.Tokens ?? [];
		// const dns: DnsRecord[] = tokens.map((t) => ({
		const dkimRecords: DnsRecord[] = tokens.map((t) => ({
			type: "CNAME",
			name: `${t}._domainkey.${domain}`,
			value: `${t}.dkim.amazonses.com`,
			// note: "Easy DKIM",
		}));

		// Map SES status → your status
		// SES: "PENDING" | "SUCCESS" | "FAILED" | "TEMPORARY_FAILURE"
		const sesStatus = info.VerificationStatus || "PENDING";
		const status =
			sesStatus === "SUCCESS"
				? ("verified" as any)
				: sesStatus === "PENDING"
					? ("pending" as any)
					: sesStatus === "FAILED"
						? ("failed" as any)
						: ("unverified" as any);

		let extraDns: DnsRecord[] = [];
		let extraMeta: Record<string, any> = {};
		if (mailFrom) {
			const { dns, meta } = await this.configureMailFrom(domain, mailFrom);
			extraDns = dns;
			extraMeta = meta;
		}

		let incomingDns: DnsRecord[] = [];
		if (incoming) {
			// 1. Add MX record instruction for inbound
			incomingDns.push({
				type: "MX",
				name: domain,
				value: `10 inbound-smtp.${this.cfg.region}.amazonaws.com`,
				note: "Route incoming email via SES inbound",
			});
		}

		return {
			domain,
			status,
			// dns,
			dns: [...dkimRecords, ...extraDns, ...incomingDns],
			meta: {
				sesStatus,
				signingAttributesOrigin: info.DkimAttributes?.SigningAttributesOrigin,
				...(mailFrom ? { mailFrom: extraMeta } : {}),
			},
		};
	}

	private async configureMailFrom(
		domain: string,
		mailFrom: string,
	): Promise<{ dns: DnsRecord[]; meta: Record<string, any> }> {
		const mf = mailFrom.trim().replace(/\.$/, "");
		if (!mf.endsWith(`.${domain}`)) {
			throw new Error(`MAIL FROM must be a subdomain of ${domain}`);
		}

		await this.v2.send(
			new PutEmailIdentityMailFromAttributesCommand({
				EmailIdentity: domain,
				MailFromDomain: mf,
				// BehaviorOnMxFailure: "UseDefaultValue" | "RejectMessage"  // optional
			}),
		);

		const info = await this.v2.send(
			new GetEmailIdentityCommand({ EmailIdentity: domain }),
		);

		// Derive DNS (SES does not return explicit values)
		const feedbackHost = `feedback-smtp.${this.cfg.region}.amazonses.com`;
		const dns: DnsRecord[] = [
			{
				type: "MX",
				name: mf,
				value: `10 ${feedbackHost}`,
				priority: 10,
				note: "Custom MAIL FROM (SPF alignment)",
			},
			{
				type: "TXT",
				name: mf,
				value: "v=spf1 include:amazonses.com -all",
				note: "Custom MAIL FROM (SPF alignment)",
			},
			{
				type: "TXT",
				name: `_dmarc.${domain}`,
				value: "v=DMARC1; p=none;",
				note: "Recommended DMARC policy (start with p=none, strengthen later)",
			},
		];

		return {
			dns,
			meta: {
				mailFromDomain: info.MailFromAttributes?.MailFromDomain,
				mailFromDomainStatus: info.MailFromAttributes?.MailFromDomainStatus,
				behaviorOnMxFailure: info.MailFromAttributes?.BehaviorOnMxFailure,
			},
		};
	}

	private normalizeDomain(d: string) {
		return d.trim().replace(/\.$/, "").toLowerCase();
	}

	async removeDomain(domain: string): Promise<DomainIdentity> {
		const d = this.normalizeDomain(domain);

		// Try to delete; treat "not found" as success (idempotent).
		try {
			await this.client.send(
				new DeleteEmailIdentityCommand({ EmailIdentity: d }),
			);
		} catch (e: any) {
			const notFound =
				e?.name === "NotFoundException" || e?.$metadata?.httpStatusCode === 404;
			if (!notFound) throw e;
		}

		// Best-effort: confirm it’s gone; if still present, return current state
		try {
			await this.client.send(new GetEmailIdentityCommand({ EmailIdentity: d }));
			// Still exists (race/permissions). Report current state as “pending/unknown”.
			return {
				domain: d,
				status: "unverified", // your enum: "unverified" | "pending" | "verified" | "failed"
				dns: [],
				meta: { deleted: false, reason: "still-present-after-delete" },
			};
		} catch {
			// Deleted (or not found) – return empty DNS and a deleted flag
			return {
				domain: d,
				status: "unverified",
				dns: [],
				meta: { deleted: true },
			};
		}
	}

	async verifyDomain(domain: string): Promise<DomainIdentity> {
		const d = this.normalizeDomain(domain);

		try {
			const info = await this.v2.send(
				new GetEmailIdentityCommand({ EmailIdentity: d }),
			);
			console.log("info", info);

			// SES Easy DKIM → 3 CNAMEs (if tokens exist)
			const tokens = info.DkimAttributes?.Tokens ?? [];
			const dkimRecords: DnsRecord[] = tokens.map((t) => ({
				type: "CNAME",
				name: `${t}._domainkey.${d}`,
				value: `${t}.dkim.amazonses.com`,
			}));

			// MAIL FROM: if configured, derive the two DNS records (MX + SPF TXT)
			const mf = info.MailFromAttributes?.MailFromDomain?.trim().replace(
				/\.$/,
				"",
			);
			const mailFromDns: DnsRecord[] = mf
				? [
						{
							type: "MX",
							name: mf,
							value: `10 feedback-smtp.${this.cfg.region}.amazonses.com`,
							priority: 10,
							note: "Custom MAIL FROM (SPF alignment)",
						},
						{
							type: "TXT",
							name: mf,
							value: "v=spf1 include:amazonses.com -all",
							note: "Custom MAIL FROM (SPF alignment)",
						},
					]
				: [];

			// Map SES status → your IdentityStatus
			const sesStatus = info.VerificationStatus || "PENDING";
			const status =
				sesStatus === "SUCCESS"
					? ("verified" as any)
					: sesStatus === "PENDING"
						? ("pending" as any)
						: sesStatus === "FAILED"
							? ("failed" as any)
							: ("unverified" as any); // TEMPORARY_FAILURE or anything else

			return {
				domain: d,
				status,
				dns: [...dkimRecords, ...mailFromDns],
				meta: {
					sesStatus,
					signingAttributesOrigin: info.DkimAttributes?.SigningAttributesOrigin,
					mailFrom: mf
						? {
								mailFromDomain: mf,
								mailFromDomainStatus:
									info.MailFromAttributes?.MailFromDomainStatus,
								behaviorOnMxFailure:
									info.MailFromAttributes?.BehaviorOnMxFailure,
							}
						: undefined,
					verificationInfo: info.VerificationInfo,
				},
			};
		} catch (e: any) {
			const notFound =
				e?.name === "NotFoundException" || e?.$metadata?.httpStatusCode === 404;
			return {
				domain: d,
				status: "unverified" as any,
				dns: [],
				meta: {
					error: notFound ? "IdentityNotFound" : e?.name,
					message: e?.message,
				},
			};
		}
	}

	async sendTestEmail(
		to: string,
		opts?: { subject?: string; body?: string },
	): Promise<boolean> {
		return true;
		// try {
		//     await this.client.send(
		//         new SendEmailCommand({
		//             Source: opts?.from ?? this.defaultFrom ?? to, // pick your preferred defaulting
		//             Destination: { ToAddresses: [to] },
		//             Message: {
		//                 Subject: { Data: opts?.subject ?? "Test email" },
		//                 Body: { Text: { Data: opts?.body ?? "This is a test email from your configured SES account." } },
		//             },
		//         })
		//     );
		//     return true;
		// } catch (err) {
		//     console.error("SES sendTestEmail error", err);
		//     return false;
		// }
		// try {
		//     await this.transporter.sendMail({
		//         from: (this.transporter.options as any).auth.user,
		//         to,
		//         subject: opts?.subject ?? "Test email",
		//         text: opts?.body ?? "This is a test email from your configured provider.",
		//     });
		//     return true;
		// } catch (err) {
		//     console.error("sendTestEmail error", err);
		//     return false;
		// }
	}

	// async close(): Promise<void> {
	//     // best-effort close if transport supports it
	//     try {
	//         this.transporter.close?.();
	//     } catch { /* ignore */ }
	// }
}
