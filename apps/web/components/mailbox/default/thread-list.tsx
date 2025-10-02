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
	deltaFetch,
	FetchMailboxThreadsResult,
	revalidateMailbox,
} from "@/lib/actions/mailbox";
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

type MailListProps = {
	items?: MailItem[];
	onOpenMail?: (id: string) => void;
	threads: FetchMailboxThreadsResult["threads"];
	publicConfig: PublicConfig;
	activeMailbox: MailboxEntity;
	identityPublicId: string;
};

export default function ThreadList({
	items = [],
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

	// useEffect(() => {
	//     deltaFetch({identityId: activeMailbox.identityId})
	// }, []);

	// const [activeMessage, setActiveMessage] = useState<string | null>(null);

	const triggerSync = async () => {
		const supabase = createClient(publicConfig);

		const testChannel = supabase.channel(`smtp-worker`);
		testChannel.subscribe((status) => {
			if (status !== "SUBSCRIBED") {
				return null;
			}
			testChannel.send({
				type: "broadcast",
				event: "delta",
				payload: { identityId: activeMailbox.identityId },
			});
			testChannel.unsubscribe();

			return;
		});
		await revalidateMailbox("/mail");
	};

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
						))}
					</ul>
				</div>
			)}
		</>
	);
}
