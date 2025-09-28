"use server";

import { cache } from "react";
import { rlsClient } from "@/lib/actions/clients";
import {
    identities,
    mailboxes,
    MessageAttachmentInsertSchema,
    messageAttachments, MessageCreate,
    MessageInsertSchema,
    messages,
    providers,
    providerSecrets, smtpAccounts, smtpAccountSecrets,
    threads,
} from "@db";
import {and, asc, desc, eq} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
    ComposeMode,
    FormState, getServerEnv,
    MailComposeInput,
} from "@schema";
import { decode } from "decode-formdata";
import { fetchDecryptedSecrets } from "@/lib/actions/dashboard";
import { createMailer } from "@providers";
import { fromAddress, fromName, toArray } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import {Queue, QueueEvents} from "bullmq";
// const {REDIS_PASSWORD, REDIS_HOST, REDIS_PORT} = getServerEnv()
//
// const redisConnection = {
//     connection: {
//         host: REDIS_HOST || 'redis',
//         port: Number(REDIS_PORT || 6379),
//         password: REDIS_PASSWORD
//     }
// };
// const smtpQueue = new Queue('smtp-worker', redisConnection);
// const smtpEvents = new QueueEvents('smtp-worker', redisConnection);
// await smtpEvents.waitUntilReady();

const getRedis = async () => {
    const {REDIS_PASSWORD, REDIS_HOST, REDIS_PORT} = getServerEnv()

    const redisConnection = {
        connection: {
            host: REDIS_HOST || 'redis',
            port: Number(REDIS_PORT || 6379),
            password: REDIS_PASSWORD
        }
    };
    const smtpQueue = new Queue('smtp-worker', redisConnection);
    const smtpEvents = new QueueEvents('smtp-worker', redisConnection);
    await smtpEvents.waitUntilReady();
    return {
        smtpQueue, smtpEvents
    }
};

export const fetchMailbox = cache(
	async (identityPublicId: string, mailboxSlug = "inbox") => {
		const rls = await rlsClient();
		const [identity] = await rls((tx) =>
			tx
				.select()
				.from(identities)
				.where(eq(identities.publicId, identityPublicId)),
		);
		const [activeMailbox] = await rls((tx) =>
			tx
				.select()
				.from(mailboxes)
				.where(
					and(
						eq(mailboxes.identityId, identity.id),
						eq(mailboxes.slug, mailboxSlug),
					),
				),
		);
		const mailboxList = await rls((tx) =>
			tx.select().from(mailboxes).where(eq(mailboxes.identityId, identity.id)),
		);
		return { activeMailbox, mailboxList, identity };
	},
);

export const fetchMailboxMessages = cache(async (mailboxId: string) => {
	const rls = await rlsClient();
	const messageList = await rls((tx) =>
		tx
			.select()
			.from(messages)
			.where(eq(messages.mailboxId, mailboxId))
			.orderBy(desc(messages.date)),
	);
	return { messages: messageList };
});

export const fetchMailboxThreads = cache(
	async (mailboxId: string, threadId?: string) => {
		const rls = await rlsClient();

		const conditions = [eq(threads.mailboxId, mailboxId)];
		if (threadId) {
			conditions.push(eq(threads.id, threadId));
		}

		const rows = await rls((tx) =>
			tx
				.select({
					thread: threads,
					message: messages,
				})
				.from(threads)
				.leftJoin(messages, eq(messages.threadId, threads.id))
				.where(and(...conditions))
                .limit(50)
				.orderBy(desc(threads.lastMessageDate), desc(messages.createdAt)),
		);

		const byThread = new Map<string, { thread: any; messages: any[] }>();

		for (const row of rows) {
			const t = row.thread;
			if (!byThread.has(t.id)) {
				byThread.set(t.id, { thread: t, messages: [] });
			}
			if (row.message) {
				byThread.get(t.id)!.messages.push(row.message);
			}
		}

		return { threads: Array.from(byThread.values()) };
	},
);


export type FetchMailboxThreadsResult = Awaited<
	ReturnType<typeof fetchMailboxThreads>
>;

export const fetchMessageAttachments = cache(async (messageId: string) => {
	const rls = await rlsClient();
	const attachmentsList = await rls((tx) =>
		tx
			.select()
			.from(messageAttachments)
			.where(eq(messageAttachments.messageId, messageId))
			.orderBy(desc(messageAttachments.createdAt)),
	);
	return { attachments: attachmentsList };
});

export const revalidateMailbox = async (path: string) => {
	revalidatePath(path);
};

type AttachmentDownload = {
	item: ReturnType<typeof MessageAttachmentInsertSchema.parse>;
	blob: Blob;
	name: string;
	sizeBytes: number;
	contentType?: string;
};

export async function fetchAttachmentBlobs(
	supabase: SupabaseClient,
	attachmentsString: string,
): Promise<AttachmentDownload[]> {
	// Parse safely
	let attachments: unknown = [];
	try {
		attachments = attachmentsString ? JSON.parse(attachmentsString) : [];
	} catch {
		// bad JSON -> no attachments
		return [];
	}

	// Normalize & filter
	const list = Array.isArray(attachments) ? attachments : [];
	const candidates = list.filter((a: any) => a && a.bucketId && a.path);

	if (candidates.length === 0) return [];

	try {
		const downloads = await Promise.all(
			candidates.map(async (attachment: any): Promise<AttachmentDownload> => {
				const { data: blob, error } = await supabase.storage
					.from(String(attachment.bucketId))
					.download(String(attachment.path));

				if (error || !blob) {
					throw new Error(
						`Failed to download "${attachment.path}": ${error?.message ?? "unknown error"}`,
					);
				}

				const sizeBytes = Number(attachment.sizeBytes ?? blob.size);

				const item = MessageAttachmentInsertSchema.parse(attachment);

				return {
					item,
					blob,
					name: String(attachment.filenameOriginal || "attachment"),
					sizeBytes,
					// contentType,
				};
			}),
		);

		return downloads;
	} catch (e) {
		console.error("fetchAttachmentBlobs error:", e);
		return [];
	}
}


const generateMailAttrs = async ({row, data}: {row: RowForProviderResult, data: MailComposeInput}) => {
    const fromNameStr = fromName(row.message);
    const fromAddrStr = fromAddress(row.message);
    const origHtml = row.message.html || row.message.textAsHtml || "";
    const origText = row.message.text || "";

    const subject =
        data.mode === "reply"
            ? row.message.subject?.startsWith("Re:")
                ? row.message.subject
                : `Re: ${row.message.subject ?? ""}`
            : data.mode === "forward"
                ? row.message.subject?.startsWith("Fwd:")
                    ? row.message.subject
                    : `Fwd: ${row.message.subject ?? ""}`
                : (data.subject ?? "");

    const quotedText = `On ${row.message.date?.toISOString()}, ${fromNameStr} <${fromAddrStr}> wrote:
${origText}`;

    const quotedHtml = `<hr>
<p>On ${row.message.date?.toISOString()}, ${fromNameStr} &lt;${fromAddrStr}&gt; wrote:</p>
<blockquote style="border-left:2px solid #ccc;margin:0;padding-left:8px;">
  ${origHtml || `<pre style="white-space:pre-wrap;margin:0;">${origText}</pre>`}
</blockquote>`;

    const text =
        data.mode === "reply"
            ? `${data.text ?? ""}\n\n${quotedText}`
            : data.mode === "forward"
                ? `${data.text ?? ""}\n\nForwarded message:\n${quotedText}`
                : (data.text ?? "");

    const html =
        data.mode === "reply"
            ? `${data.html ?? ""}${quotedHtml}`
            : data.mode === "forward"
                ? `${data.html ?? ""}<p>Forwarded message:</p>${quotedHtml}`
                : (data.html ?? row.message.html ?? "");

    return { subject, text, html };

};

const rowForProvider = async (decodedForm: Record<any, any>) => {
    const rls = await rlsClient();
    const [row] = await rls((tx) =>
        tx
            .select({
                message: messages,
                mailbox: mailboxes,
                identity: identities,
                provider: providers,
                smtpAccount: smtpAccounts,
            })
            .from(messages)
            .leftJoin(mailboxes, eq(messages.mailboxId, mailboxes.id))
            .leftJoin(identities, eq(mailboxes.identityId, identities.id))
            .leftJoin(providers, eq(identities.providerId, providers.id))
            .leftJoin(smtpAccounts, eq(identities.smtpAccountId, smtpAccounts.id))
            .where(eq(messages.id, String(decodedForm.originalMessageId))),
    );

    return row;
};

type RowForProviderResult = Awaited<
    ReturnType<typeof rowForProvider>
>;

export async function sendMail(
	_prev: FormState,
	formData: FormData,
): Promise<FormState> {
	const decodedForm = decode(formData);

	const data: MailComposeInput = {
		messageId: String(decodedForm.messageId ?? ""),
		to: toArray(decodedForm.to as any),
		subject: (decodedForm.subject as string) || undefined,
		text: (decodedForm.text as string) || undefined,
		html: (decodedForm.html as string) || undefined,
		mode: (decodedForm.mode as ComposeMode) || "new",
	};

	if (data.to.length === 0) {
		return { error: "Please provide at least one recipient in the To field." };
	}

	const rls = await rlsClient();

    const row = await rowForProvider(decodedForm);

	if (!row) return { error: "Original message not found." };

	const [secrets] = row.provider ? await fetchDecryptedSecrets({
		linkTable: providerSecrets,
		foreignCol: providerSecrets.providerId,
		secretIdCol: providerSecrets.secretId,
		parentId: row.provider.id,
	}) : await fetchDecryptedSecrets({
        linkTable: smtpAccountSecrets,
        foreignCol: smtpAccountSecrets.accountId,
        secretIdCol: smtpAccountSecrets.secretId,
        parentId: row?.smtpAccount?.id,
    });

	const mailer = createMailer(row.provider ? row.provider.type : "smtp", secrets.parsedSecret);

	const supabase = await createClient();
	const attachmentBlobs = await fetchAttachmentBlobs(
		supabase,
		decodedForm.attachments as string,
	);

    const { subject, text, html } = await generateMailAttrs({ row, data });

	const payload: {
		to: string[]; // keep arrays internally
		from: string; // your identity address
		subject: string;
		text?: string;
		html?: string;
	} = {
		to: data.to,
		from: row.identity.value,
		subject,
		text,
		html,
	};


	const newMessageBody = MessageInsertSchema.parse({
		mailboxId: row.message.mailboxId,
		messageId: "PLACEHOLDER", // set by provider response
		inReplyTo: row.message.messageId,
		references: row?.message?.references
			? [
					...new Set([...row?.message?.references, row?.message.messageId]),
				].slice(0, 30)
			: [],
		threadId: row.message.threadId,
		...payload,
		hasAttachments: attachmentBlobs?.length > 0,
	});

	// If your mailer expects a string, join:
	const mailerResponse = await mailer.sendEmail(payload.to, {
		from: payload.from,
		subject: payload.subject,
		text: String(payload.text),
		html: String(payload.html),
		inReplyTo: row.message.messageId,
		references: newMessageBody.references || [],
		attachments: attachmentBlobs.map((att) => {
			return {
				name: att.name,
				content: att.blob,
				contentType: String(att.item.contentType),
			};
		}),
	});


	if (mailerResponse.success) {
        const parsedMessage = MessageInsertSchema.parse({
            ...newMessageBody,
            messageId: String(mailerResponse.MessageId) || `msg-${Date.now()}`,
        })
		const [newMessage] = await rls((tx) =>
			tx
				.insert(messages)
				.values(parsedMessage as MessageCreate)
				.returning(),
		);

		for (const attachmentBlob of attachmentBlobs) {
			await rls((tx) =>
				tx.insert(messageAttachments).values({
					...attachmentBlob.item,
					messageId: newMessage.id,
				}),
			);
		}
	}

	return { success: true };
}

export const deltaFetch = async ({identityId}: {identityId: string}) => {
    const {smtpQueue, smtpEvents} = await getRedis()
    // await deltaQueue.add("delta-fetch", { identityId }, { jobId: `delta-fetch-${identityId}` });
    const job = await smtpQueue.add("delta-fetch", { identityId });
    const result = await job.waitUntilFinished(smtpEvents);
    console.log("Worker result:", result);
};

export const backfillAccount = async (identityId: string) => {
    const {smtpQueue, smtpEvents} = await getRedis()
    const job = await smtpQueue.add("backfill", { identityId }, {
        jobId: `backfill-${identityId}`,
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000
        }});
    // await job.waitUntilFinished(smtpEvents);
};
