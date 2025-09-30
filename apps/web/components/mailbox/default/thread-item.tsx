import React from "react";
import { rlsClient } from "@/lib/actions/clients";
import { eq } from "drizzle-orm";
import { MessageEntity, messages } from "@db";
import EmailViewer from "@/components/mailbox/default/email-viewer";
import EmailRenderer from "@/components/mailbox/default/email-renderer";
import { Avatar } from "@mantine/core";
import { fetchMessageAttachments } from "@/lib/actions/mailbox";
import { getPublicEnv } from "@schema";
import { fromAddress, fromName } from "@schema";

export default async function ThreadItem({
	message,
}: {
	message: MessageEntity;
}) {
	const { attachments } = await fetchMessageAttachments(message.id);
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
