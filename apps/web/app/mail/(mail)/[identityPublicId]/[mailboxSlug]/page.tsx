import {
	fetchMailbox,
	fetchMailboxThreads,
} from "@/lib/actions/mailbox";
import { getPublicEnv } from "@schema";
import ThreadList from "@/components/mailbox/default/thread-list";
import MailPagination from "@/components/mailbox/default/mail-pagination";

async function Page({
	params,
    searchParams
}: {
	params: { identityPublicId: string; mailboxSlug?: string };
    searchParams: {page?: string}
}) {
    const {page} = await searchParams
	const { identityPublicId, mailboxSlug } = await params;
	const { activeMailbox, count } = await fetchMailbox(identityPublicId, mailboxSlug);
	const { threads } = await fetchMailboxThreads(activeMailbox.id, Number(page));
	const publicConfig = getPublicEnv();

	return (
		<>
			<div className="flex flex-1 flex-col gap-4 p-4 mb-12">
				<ThreadList
					threads={threads}
					publicConfig={publicConfig}
					activeMailbox={activeMailbox}
					identityPublicId={identityPublicId}
				/>

                <MailPagination count={count} mailboxSlug={activeMailbox.slug} identityPublicId={identityPublicId} page={Number(page)} />

				{/*{Array.from({ length: 24 }).map((_, index) => (*/}
				{/*	<div*/}
				{/*		key={index}*/}
				{/*		className="bg-muted/50 aspect-video h-12 w-full rounded-lg"*/}
				{/*	/>*/}
				{/*))}*/}
			</div>
		</>
	);
}

export default Page;
