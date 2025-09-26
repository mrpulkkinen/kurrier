"use server";

import { cache } from "react";
import { rlsClient } from "@/lib/actions/clients";
import {
    identities,
    mailboxes,
    MessageAttachmentEntity, MessageAttachmentInsertSchema,
    messageAttachments, MessageEntity, MessageInsertSchema,
    messages,
    providers,
    providerSecrets, threads
} from "@db";
import {and, asc, desc, eq, inArray} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {AddressObjectJSON, ComposeMode, FormState, getServerEnv, MailComposeInput} from "@schema";
import { decode } from "decode-formdata";
import {fetchDecryptedSecrets} from "@/lib/actions/dashboard";
import {createMailer} from "@providers";
import {fromAddress, fromName, toArray} from "@/lib/utils";
import {createClient} from "@/lib/supabase/server";
import {SupabaseClient} from "@supabase/supabase-js";
import {isSignedIn} from "@/lib/actions/auth";

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
                .orderBy(desc(threads.lastMessageDate), desc(messages.createdAt))
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
    }
);

// export const fetchMailboxThreads = cache(async (mailboxId: string, threadId?: string) => {
//     const rls = await rlsClient();
//
//     const rows = await rls(tx =>
//         tx
//             .select({
//                 thread: threads,
//                 message: messages,
//             })
//             .from(threads)
//             .leftJoin(messages, eq(messages.threadId, threads.id))
//             .where(eq(threads.mailboxId, mailboxId))
//             .orderBy(desc(threads.lastMessageDate), messages.date) // order threads and messages
//     );
//
//     const byThread = new Map<string, { thread: any; messages: any[] }>();
//
//     for (const row of rows) {
//         const t = row.thread;
//         if (!byThread.has(t.id)) {
//             byThread.set(t.id, { thread: t, messages: [] });
//         }
//         if (row.message) {
//             byThread.get(t.id)!.messages.push(row.message);
//         }
//     }
//
//     return { threads: Array.from(byThread.values()) };
// });

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


// const fetchAttachmentBlobs = async (supabase: SupabaseClient, attachmentsString: string) => {
//     let attachments = []
//     try {
//         attachments = JSON.parse(attachmentsString)
//
//         const downloads = await Promise.all(
//             attachments.map(async (attachment: Partial<MessageAttachmentEntity>) => {
//                 const { data: blob, error } = await supabase
//                     .storage
//                     .from(String(attachment.bucketId))
//                     .download(String(attachment.path));
//
//                 console.log("blobs", blob)
//                 if (error) {
//                     throw new Error(`Failed to download "${attachment.path}": ${error.message}`);
//                 }
//
//                 // Prefer explicit contentType/size you captured; fall back to blob
//                 // const contentType = attachment?.contentType ?? blob.type || undefined;
//                 const sizeBytes = attachment.sizeBytes ?? blob.size;
//
//
//                 const parsedAttachment = MessageAttachmentInsertSchema.parse(attachment)
//                 // const [messageAttachment] = await rls((tx) => {
//                 //     return tx
//                 //         .insert(messageAttachments)
//                 //         .values(parsedAttachment)
//                 // })
//                 //
//                 // console.log("messageAttachment", messageAttachment)
//
//                 return {
//                     item: parsedAttachment,
//                     blob,
//                     name: attachment.filenameOriginal || "attachment",
//                     sizeBytes,
//                 };
//             })
//         );
//
//         return downloads
//
//     } catch (e) {
//         console.log("e", e)
//         console.log("No attachments")
//     }
//
//
//
// };


type AttachmentDownload = {
    item: ReturnType<typeof MessageAttachmentInsertSchema.parse>;
    blob: Blob;
    name: string;
    sizeBytes: number;
    contentType?: string;
};

export async function fetchAttachmentBlobs(
    supabase: SupabaseClient,
    attachmentsString: string
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
    const candidates = list.filter(
        (a: any) => a && a.bucketId && a.path
    );

    if (candidates.length === 0) return [];

    try {
        const downloads = await Promise.all(
            candidates.map(async (attachment: any): Promise<AttachmentDownload> => {
                const { data: blob, error } = await supabase
                    .storage
                    .from(String(attachment.bucketId))
                    .download(String(attachment.path));

                if (error || !blob) {
                    throw new Error(
                        `Failed to download "${attachment.path}": ${error?.message ?? "unknown error"}`
                    );
                }

                const sizeBytes = Number(attachment.sizeBytes ?? blob.size);
                // const contentType: string | undefined =
                //     attachment.contentType ?? blob.type || undefined;

                // Validate/shape with your schema
                const item = MessageAttachmentInsertSchema.parse(attachment);

                return {
                    item,
                    blob,
                    name: String(attachment.filenameOriginal || "attachment"),
                    sizeBytes,
                    // contentType,
                };
            })
        );

        return downloads;
    } catch (e) {
        console.error("fetchAttachmentBlobs error:", e);
        return [];
    }
}

export async function sendMail(
    _prev: FormState,
    formData: FormData,
): Promise<FormState> {

    const decodedForm = decode(formData);
    console.log("decodedForm", decodedForm)

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

    const [row] = await rls((tx) =>
        tx
            .select({
                message: messages,
                mailbox: mailboxes,
                identity: identities,
                provider: providers,
            })
            .from(messages)
            .innerJoin(mailboxes, eq(messages.mailboxId, mailboxes.id))
            .innerJoin(identities, eq(mailboxes.identityId, identities.id))
            .innerJoin(providers, eq(identities.providerId, providers.id))
            .where(eq(messages.id, String(decodedForm.originalMessageId)))
    );

    if (!row) return { error: "Original message not found." };


    const [secrets] = await fetchDecryptedSecrets({
        linkTable: providerSecrets,
        foreignCol: providerSecrets.providerId,
        secretIdCol: providerSecrets.secretId,
        parentId: row.provider.id,
    });

    // console.log("row", row.message)

    const mailer = createMailer(row.provider.type, secrets.parsedSecret);

    const supabase = await createClient()
    const attachmentBlobs = await fetchAttachmentBlobs(supabase, decodedForm.attachments as string)

    console.log("attachmentBlobs", attachmentBlobs)

//     // ---- Helpers
    const fromNameStr  = fromName(row.message);
    const fromAddrStr  = fromAddress(row.message);
    const origHtml  = row.message.html || row.message.textAsHtml || "";
    const origText  = row.message.text || "";

    const subject =
        data.mode === "reply"
            ? (row.message.subject?.startsWith("Re:") ? row.message.subject : `Re: ${row.message.subject ?? ""}`)
            : data.mode === "forward"
                ? (row.message.subject?.startsWith("Fwd:") ? row.message.subject : `Fwd: ${row.message.subject ?? ""}`)
                : (data.subject ?? "");

    const quotedText =
        `On ${row.message.date?.toISOString()}, ${fromNameStr} <${fromAddrStr}> wrote:
${origText}`;

    const quotedHtml =
        `<hr>
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

    // ---- Strongly typed payload
    const payload: {
        to: string[];     // keep arrays internally
        from: string;     // your identity address
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



    // const uniques = [...new Set([...parent.references, parent.messageId])];
    // const MAX = 30;

    const newMessageBody = MessageInsertSchema.parse({
        mailboxId: row.message.mailboxId,
        messageId: "PLACEHOLDER", // set by provider response
        inReplyTo: row.message.messageId,
        // references: row?.message?.references ? [...new Set([...row?.message?.references, row?.message.messageId])] : [],
        references: row?.message?.references ? [...new Set([...row?.message?.references, row?.message.messageId])].slice(0,30) : [],
        threadId: row.message.threadId,
        ...payload,
        hasAttachments: attachmentBlobs?.length > 0,
    })

    console.log("newMessageBody", newMessageBody)

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
                contentType: String(att.item.contentType)
            }
        })
    });

    if (mailerResponse.success) {
        const [newMessage] = await rls((tx) =>
            tx
                .insert(messages)
                .values({
                    ...newMessageBody,
                    messageId: String(mailerResponse.MessageId) || `msg-${Date.now()}`
                })
                .returning()
        );

        for (const attachmentBlob of attachmentBlobs) {
            await rls((tx) =>
                tx
                    .insert(messageAttachments)
                    .values({
                        ...attachmentBlob.item,
                        messageId: newMessage.id,
                    })
            );
        }

    }

    // console.log("res", res)

    return { success: true };
}



// export async function sendMail(
// 	_prev: FormState,
// 	formData: FormData,
// ): Promise<FormState> {
// 	const data = decode(formData);
//
//
//     const mailData: MailComposeInput = {
//         messageId: String(data.messageId ?? ""),
//         to: toArray(data.to as any),
//         // subject: (formData.get("subject") as string) || undefined,
//         text: (data.text as string) || undefined,
//         html: (data.html as string) || undefined,
//         mode: (data.mode as ComposeMode) || "new",
//     };
//
//
// 	const to = data?.to
// 		? String(data?.to)
// 				.split(",")
// 				.map((s: string) => s.trim())
// 				.filter((s: string) => s.length > 0)
// 		: [];
// 	if (to.length === 0) {
// 	    return { error: "Please provide at least one recipient in the To field." };
// 	}
// 	const rls = await rlsClient();
// 	const [message] = await rls((tx) =>
// 		tx
// 			.select()
// 			.from(messages)
// 			.where(eq(messages.id, String(data?.messageId))),
// 	);
//
//     const [row] = await rls((tx) =>
//         tx
//             .select({
//                 message: messages,
//                 mailbox: mailboxes,
//                 identity: identities,
//                 provider: providers,
//             })
//             .from(messages)
//             .innerJoin(mailboxes, eq(messages.mailboxId, mailboxes.id))
//             .innerJoin(identities, eq(mailboxes.identityId, identities.id))
//             .innerJoin(providers, eq(identities.providerId, providers.id))
//             .where(eq(messages.id, message.id))
//     );
//
//
//     const [secrets] = await fetchDecryptedSecrets({
//         linkTable: providerSecrets,
//         foreignCol: providerSecrets.providerId,
//         secretIdCol: providerSecrets.secretId,
//         parentId: row.provider.id
//     })
//
//     const mailer = createMailer(row.provider.type, secrets.parsedSecret);
//
//     const subject =
//         data.mode === "reply"
//             ? `Re: ${row.message.subject}`
//             : data.mode === "forward"
//                 ? `Fwd: ${row.message.subject}`
//                 : data.subject;
//
//     const quotedText = `
// On ${row.message.date?.toISOString()} ${row.message.from?.value[0]?.name} <${row.message.from?.value[0]?.address}> wrote:
// ${row.message.text || ""}
// `;
//
//     const quotedHtml = `
// <hr>
// <p>On ${row.message.date?.toISOString()}, ${row.message.from?.value[0]?.name} <${row.message.from?.value[0]?.address}> wrote:</p>
// <blockquote style="border-left:2px solid #ccc; margin:0; padding-left:8px;">
//   ${row.message.html || row.message.textAsHtml || row.message.text || ""}
// </blockquote>
// `;
//
//     const text =
//         data.mode === "reply"
//             ? `${data.text || ""}\n\n${quotedText}`
//             : data.mode === "forward"
//                 ? `${data.text || ""}\n\nForwarded message:\n${quotedText}`
//                 : data.text || "";
//
//     const html =
//         data.mode === "reply"
//             ? `${data.html || ""}${quotedHtml}`
//             : data.mode === "forward"
//                 ? `${data.html || ""}<p>Forwarded message:</p>${quotedHtml}`
//                 : data.html || row.message.html || "";
//
//
//     const payload: {
//         to: string[];
//         from: string;
//         subject: string;
//         text: string;
//         html: string;
//     } = {
//         to: data.to,
//         from: row.identity.value,
//         subject,
//         text,
//         html,
//     };
//
//     console.log("payload", payload)
//
//     await mailer.sendEmail(data.to, {
//         from: payload.from,
//         subject: payload.subject,
//         text: payload.text,
//         html: payload.html,
//     })
//
//     // console.log("secrets", secrets)
//
//
// 	// console.dir(message, { depth: 10 });
//
// 	await new Promise((resolve) => setTimeout(resolve, 1000));
// 	// return { success: true, data } as FormState;
// 	console.log("sendMail done");
// 	// return { error: "nooo" };
// 	return { success: true };
// }
