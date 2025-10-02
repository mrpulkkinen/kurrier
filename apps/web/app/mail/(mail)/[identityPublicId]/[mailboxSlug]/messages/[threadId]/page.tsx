import React from "react";
import {
	fetchMailbox,
	fetchMailboxThreads,
	fetchThreadDetail,
} from "@/lib/actions/mailbox";
import ThreadItem from "@/components/mailbox/default/thread-item";
import { Divider } from "@mantine/core";
import { db, threads } from "@db";
import { eq } from "drizzle-orm";

async function Page({
	params,
}: {
	params: { identityPublicId: string; mailboxSlug: string; threadId: string };
}) {
	const { threadId, mailboxSlug, identityPublicId } = await params;
	const { activeMailbox } = await fetchMailbox(identityPublicId, mailboxSlug);
	const activeThread = await fetchThreadDetail(activeMailbox.id, threadId);
	console.log("activeThread", activeThread);

	return (
		<>
			{activeThread?.messages.map((message) => {
				return (
					<div key={message.id}>
						<ThreadItem message={message} />
						<Divider className={"opacity-50 mb-6"} ml={"xl"} mr={"xl"} />
					</div>
				);
			})}
		</>
	);
}

export default Page;
