import React from "react";
import { rlsClient } from "@/lib/actions/clients";
import { eq } from "drizzle-orm";
import { messages } from "@db";
import EmailViewer from "@/components/mailbox/default/email-viewer";
import EmailRenderer from "@/components/mailbox/default/email-renderer";
import { Avatar } from "@mantine/core";
import { fetchMessageAttachments } from "@/lib/actions/mailbox";
import { getPublicEnv } from "@schema";
import { fromAddress, fromName } from "@/lib/utils";

async function Page({
	params,
}: {
	params: { identityPublicId: string; mailboxSlug: string; messageId: string };
}) {
	const { messageId } = await params;
	const { attachments } = await fetchMessageAttachments(messageId);
	const rls = await rlsClient();
	const [message] = await rls((tx) => {
		return tx.select().from(messages).where(eq(messages.id, messageId));
	});
	const publicConfig = getPublicEnv();

	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<div className={"flex gap-4"}>
				<div className={"flex-shrink flex flex-col items-center pt-12"}>
					<Avatar
						name={fromName(message) || fromAddress(message) || ""}
						color="initials"
					/>
				</div>
				<div className={"flex-grow flex flex-col gap-2"}>
					<EmailRenderer
						message={message}
						attachments={attachments}
						publicConfig={publicConfig}
					>
						<EmailViewer message={message} />
					</EmailRenderer>
				</div>
			</div>
		</div>
	);
}

export default Page;
