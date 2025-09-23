import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/dashboards/mailbox/default/app-sidebar";
import { fetchMailbox } from "@/lib/actions/mailbox";

export default async function DashboardLayout({
	children,
	breadcrumb,
	params,
}: {
	children: React.ReactNode;
	breadcrumb: React.ReactNode;
	params: { identityPublicId: string; mailboxSlug?: string };
}) {
	const { identityPublicId, mailboxSlug = "inbox" } = await params;
	const { activeMailbox, mailboxList, identity } = await fetchMailbox(
		identityPublicId,
		mailboxSlug,
	);

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "225px",
				} as React.CSSProperties
			}
		>
			<AppSidebar
				activeMailbox={activeMailbox}
				mailboxList={mailboxList}
				identity={identity}
			/>
			<SidebarInset>
				{/*{breadcrumb}*/}
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}
