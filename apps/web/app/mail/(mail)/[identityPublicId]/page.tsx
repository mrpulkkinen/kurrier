import React from 'react';
import {identities, mailboxes} from "@db";
import {rlsClient} from "@/lib/actions/clients";
import {and, eq} from "drizzle-orm";

async function Page({params}: {params: {identityPublicId: string, mailboxSlug?: string}}) {

    // const {identityPublicId, mailboxSlug="inbox"} = await params;
    // const rls = await rlsClient();
    // const [identity] = await rls((tx) =>
    //     tx.select().from(identities).where(eq(identities.publicId, identityPublicId))
    // );
    // const [mailbox] = await rls((tx) =>
    //     tx.select().from(mailboxes).where(and(eq(mailboxes.identityId, identity.id), eq(mailboxes.slug, mailboxSlug)))
    // );
    // console.log("mailbox", mailbox)

    return <>
        <div className="flex flex-1 flex-col gap-4 p-4">
            {/*<div*/}
            {/*    // key={index}*/}
            {/*    className="bg-muted/50 aspect-video h-full w-full rounded-lg"*/}
            {/*/>*/}
            {/*{Array.from({ length: 24 }).map((_, index) => (*/}
            {/*    <div*/}
            {/*        key={index}*/}
            {/*        className="bg-muted/50 aspect-video h-12 w-full rounded-lg"*/}
            {/*    />*/}
            {/*))}*/}
        </div>
    </>
}

export default Page;
