import { defineEventHandler, readRawBody } from "h3";
import {
	db,
	decryptAdminSecrets,
	mailboxes,
	MessageCreate,
	messages,
	providerSecrets,
} from "@db";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

import { simpleParser } from "mailparser";
import { and, eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv, getServerEnv } from "@schema";

export default defineEventHandler(async (event) => {
	try {
		const raw = (await readRawBody(event)) || "";
		const sns = JSON.parse(raw as string);

		// 1) One-time SNS handshake
		if (sns?.Type === "SubscriptionConfirmation" && sns.SubscribeURL) {
			await $fetch(sns.SubscribeURL as string, { method: "GET" });
			console.log("[Webhook] SNS subscription confirmed");
			return { ok: true };
		}

		// 2) Normal notifications (S3 → SNS). We expect Message to be the S3 event JSON
		if (sns?.Type === "Notification" && sns?.Message) {
			const msg =
				typeof sns.Message === "string" ? JSON.parse(sns.Message) : sns.Message;
			const rec = msg?.Records?.[0];
			if (!rec || rec.eventSource !== "aws:s3") {
				console.log("[Webhook] Non-S3 notification, ignoring.");
				return { ok: true };
			}

			const bucket: string = rec.s3?.bucket?.name;
			const key: string = decodeURIComponent(rec.s3?.object?.key || "");
			const size: number = rec.s3?.object?.size ?? 0;

			console.log("[S3] ObjectCreated:", { bucket, key, size });

			const [, ownerId, providerId, identityId] = key.split("/");
			const [secrets] = await decryptAdminSecrets({
				linkTable: providerSecrets,
				foreignCol: providerSecrets.providerId,
				secretIdCol: providerSecrets.secretId,
				ownerId,
				parentId: providerId,
			});

			const vaultValues = secrets?.vault?.decrypted_secret
				? JSON.parse(secrets.vault.decrypted_secret)
				: {};

			const s3 = new S3Client({
				region: vaultValues.SES_REGION,
				credentials: {
					accessKeyId: vaultValues.SES_ACCESS_KEY_ID,
					secretAccessKey: vaultValues.SES_SECRET_ACCESS_KEY,
				},
			});

			const getObj = await s3.send(
				new GetObjectCommand({ Bucket: bucket, Key: key }),
			);
			const rawEmail = await getObj?.Body?.transformToString("utf-8");

			const parsed = await simpleParser(rawEmail);

			const [inbox] = await db
				.select()
				.from(mailboxes)
				.where(
					and(
						eq(mailboxes.identityId, identityId),
						eq(mailboxes.slug, "inbox"),
					),
				);

			const fromList = parsed.from?.value ?? [];
			const toList = parsed.to?.value ?? [];
			const ccList = parsed.cc?.value ?? [];
			const bccList = parsed.bcc?.value ?? [];

			const messagePayload: MessageCreate = {
				ownerId,
				mailboxId: inbox.id,

				subject: parsed.subject || "(no subject)",
				snippet: parsed.text?.slice(0, 200) ?? "",

				fromName: fromList[0]?.name ?? "",
				fromEmail: fromList[0]?.address ?? "",

				to: toList.map((x) => ({ name: x.name, email: x.address })),
				cc: ccList.map((x) => ({ name: x.name, email: x.address })),
				bcc: bccList.map((x) => ({ name: x.name, email: x.address })),

				date: parsed.date ? new Date(parsed.date) : new Date(),
				sizeBytes: size,

				seen: false,
				answered: false,
				flagged: false,
				draft: false,

				text: parsed.text || "",
				html: parsed.html || "",
				textAsHtml: parsed.textAsHtml || "",

				hasAttachments: (parsed.attachments?.length ?? 0) > 0,
				state: "normal",

				headersJson: Object.fromEntries(
					(parsed.headers as Map<string, any>)?.entries?.() ?? [],
				),

				rawStorageKey: key,
			};

			const message = await db
				.insert(messages)
				.values(messagePayload)
				.returning();

			const publicConfig = getPublicEnv();
			const serverConfig = getServerEnv();
			const supabase = createClient(
				publicConfig.SUPABASE_DOMAIN,
				serverConfig.SUPABASE_SERVICE_ROLE_KEY,
			);

			const myChannel = supabase.channel("test-channel");

			myChannel.subscribe((status) => {
				if (status !== "SUBSCRIBED") {
					return null;
				}
				myChannel.send({
					type: "broadcast",
					event: "shout",
					payload: { message },
				});
			});

			// Optional: fetch the raw RFC822 now (you can move this to a worker if preferred)
			// const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
			// const rawEmail = await obj.Body?.transformToString(); // Node 18+ SDK helper
			// TODO: enqueue or parse with `mailparser` here

			// TODO: insert a lightweight row to your DB linking to {bucket, key}
			// (so the UI can list messages immediately while a worker parses content)

			return { ok: true };
		}

		// 3) Anything else
		console.log("[Webhook] Ignored payload shape.");
		return { ok: true };
	} catch (err) {
		console.error("[Webhook] Error:", err);
		return { ok: true };
	}
});
