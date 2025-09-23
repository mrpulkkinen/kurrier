import React from 'react';
import {SidebarTrigger} from "@/components/ui/sidebar";
import {Separator} from "@/components/ui/separator";
import MailboxSearch from "@/components/mailbox/default/mailbox-search";
import MailList from "@/components/mailbox/default/mail-list";
import {fetchMailbox, fetchMailboxMessages} from "@/lib/actions/mailbox";
import {getPublicEnv} from "@schema";


async function Page({params}: {params: {identityPublicId: string, mailboxSlug?: string}}) {

    const {identityPublicId, mailboxSlug} = await params;
    const {activeMailbox} = await fetchMailbox(identityPublicId, mailboxSlug);
    const {messages} = await fetchMailboxMessages(activeMailbox.id);
    const publicConfig = getPublicEnv();

    return <>
        <div className="flex flex-1 flex-col gap-4 p-4">

            <MailList messages={messages}
                      publicConfig={publicConfig}
                      activeMailbox={activeMailbox}
                      identityPublicId={identityPublicId} />

            {Array.from({ length: 24 }).map((_, index) => (
                <div
                    key={index}
                    className="bg-muted/50 aspect-video h-12 w-full rounded-lg"
                />
            ))}
        </div>
    </>
}

export default Page;
