"use server";

import { cache } from "react";
import { rlsClient } from "@/lib/actions/clients";
import { identities, mailboxes, messages } from "@db";
import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
	// const [activeMailbox] = await rls((tx) =>
	//     tx.select().from(mailboxes).where(eq(mailboxes.id, mailboxId))
	// );
	const messageList = await rls((tx) =>
		tx
			.select()
			.from(messages)
			.where(eq(messages.mailboxId, mailboxId))
			.orderBy(desc(messages.date)),
	);
	return { messages: messageList };
});

export const revalidateMailbox = async (path: string) => {
	revalidatePath(path);
};
