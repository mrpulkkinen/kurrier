"use server";

import { cache } from "react";
import { rlsClient } from "@/lib/actions/clients";
import {identities, mailboxes, messageAttachments, messages} from "@db";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {FormState} from "@schema";
import {decode} from "decode-formdata";

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

export async function sendMail(
    _prev: FormState,
    formData: FormData,
): Promise<FormState> {
    const data = decode(formData)
    console.log("sendMail", { data } );
    const to = data?.to ? String(data?.to).split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [];
    // if (to.length === 0) {
    //     return { error: "Please provide at least one recipient in the To field." };
    // }
    const rls = await rlsClient();
    const message = await rls((tx) =>
        tx.select().from(messages).where(eq(messages.id, String(data?.messageId)))
    )

    console.dir(message, { depth: 10 })

    await new Promise(resolve => setTimeout(resolve, 100));
    // return { success: true, data } as FormState;
    console.log("sendMail done")
    // return { error: "nooo" };
    return { success: true };


}
