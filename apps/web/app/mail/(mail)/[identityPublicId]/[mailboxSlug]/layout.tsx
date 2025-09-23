import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import MailboxSearch from "@/components/mailbox/default/mailbox-search";
import React from "react";
import { PublicConfig } from "@schema";
import { MailboxEntity, MessageEntity } from "@db";

export default async function DashboardLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: { identityPublicId: string; mailboxSlug?: string };
}) {
	return (
		<>
			<header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mr-2 data-[orientation=vertical]:h-4"
				/>

				<MailboxSearch />
			</header>

			{children}
		</>
	);
}
