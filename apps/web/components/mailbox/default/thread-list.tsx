"use client";

import * as React from "react";
import {
	Star,
	StarOff,
	Paperclip,
	MoreHorizontal,
	Archive,
	Trash2,
	MailOpen,
	Mail,
} from "lucide-react";
import { MailboxEntity, MessageEntity, ThreadEntity } from "@db";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PublicConfig } from "@schema";
import {
	FetchMailboxThreadsResult,
	revalidateMailbox,
} from "@/lib/actions/mailbox";
import MailListItem from "@/components/mailbox/default/mail-list-item";
import MailListHeader from "@/components/mailbox/default/mail-list-header";
import ThreadListItem from "@/components/mailbox/default/thread-list-item";

type MailItem = {
	id: string;
	from: string;
	subject: string;
	snippet: string;
	labels?: string[];
	hasAttachment?: boolean;
	date: string; // e.g. "13 Sept", "2 Aug"
	unread?: boolean;
	starred?: boolean;
};

const MOCK_MAILS: MailItem[] = [
	{
		id: "1",
		from: "The Google Workspace",
		subject: "Regarding your account: Fix potential security issues",
		snippet:
			"Take action now for better protection. We found some security gaps...",
		hasAttachment: false,
		labels: [],
		date: "13 Sept",
		unread: true,
		starred: false,
	},
	{
		id: "2",
		from: "Google Payments",
		subject: "Your invoice is available for dinebot.io",
		snippet: "Your Google Workspace monthly invoice is available to download.",
		hasAttachment: true,
		labels: ["PDF"],
		date: "2 Sept",
		unread: false,
		starred: false,
	},
	{
		id: "3",
		from: "The Google Workspace",
		subject:
			"[Legal Update] Changes to Google Workspace Service Specific Terms",
		snippet:
			"We’ve updated our service terms. These changes will take effect on...",
		hasAttachment: false,
		date: "26 Aug",
		unread: false,
		starred: false,
	},
	{
		id: "4",
		from: "Google Workspace",
		subject: "Grow your business with Google Ads",
		snippet: "Here’s ₹20000 in ad credit to help you get started...",
		hasAttachment: false,
		date: "23 Jul",
		unread: false,
		starred: true,
	},
];

type MailListProps = {
	items?: MailItem[];
	onOpenMail?: (id: string) => void;
	threads: FetchMailboxThreadsResult["threads"];
	publicConfig: PublicConfig;
	activeMailbox: MailboxEntity;
	identityPublicId: string;
};

export default function ThreadList({
	items = MOCK_MAILS,
	onOpenMail,
	threads,
	publicConfig,
	activeMailbox,
	identityPublicId,
}: MailListProps) {
	const [selected, setSelected] = React.useState<Set<string>>(new Set());
	const [starred, setStarred] = React.useState<Record<string, boolean>>(
		Object.fromEntries(items.map((m) => [m.id, !!m.starred])),
	);

	const allSelected = selected.size === items.length && items.length > 0;

	const toggleRow = (id: string) =>
		setSelected((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});

	const toggleAll = () =>
		setSelected((prev) =>
			prev.size ? new Set() : new Set(items.map((m) => m.id)),
		);

	const toggleStar = (id: string) =>
		setStarred((prev) => ({ ...prev, [id]: !prev[id] }));

	const startListener = async () => {
		const supabase = createClient(publicConfig);

		const myChannel = supabase.channel(`${activeMailbox.ownerId}-mailbox`);
		function messageReceived(payload: any) {
			console.log("Message received!", payload);
			revalidateMailbox("/mail");
		}
		myChannel
			.on("broadcast", { event: "mail-received" }, (payload) =>
				messageReceived(payload),
			)
			.subscribe();

		console.log("Listening to mailbox changes on channel:");
		const testChannel = supabase.channel(`smtp-worker`);
		testChannel.subscribe((status) => {
			if (status !== "SUBSCRIBED") {
				return null;
			}
			testChannel.send({
				type: "broadcast",
				event: "backfill",
				payload: { identityId: "956279b4-23e0-41ee-977c-ca82223c5cbd" },
			});
			testChannel.unsubscribe();

			return;
		});
	};

	useEffect(() => {
		startListener();
	}, []);

	// const [activeMessage, setActiveMessage] = useState<string | null>(null);

	return (
		<>
			{threads.length === 0 ? (
				<div className="p-4 text-center text-base text-muted-foreground">
					No messages in{" "}
					<span className={"lowercase"}>{activeMailbox.name}</span>
				</div>
			) : (
				<div className="rounded-xl border bg-background/50 p-1">
					<MailListHeader />

					<ul role="list" className="divide-y">
						{threads.map((threadItem) => (
							<ThreadListItem
								key={threadItem.thread.id}
								threadItem={threadItem}
								activeMailbox={activeMailbox}
								identityPublicId={identityPublicId}
							/>
							// <MailListItem
							//     key={threadItem.id}
							//     message={message}
							//     activeMailbox={activeMailbox}
							//     identityPublicId={identityPublicId}
							// />
						))}
					</ul>
				</div>
			)}
		</>
	);
}
