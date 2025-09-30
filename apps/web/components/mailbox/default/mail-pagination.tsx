"use client"
import React, {useEffect, useState} from 'react';
import {Pagination} from "@mantine/core";
import {useRouter} from "next/navigation";

function MailPagination({count, mailboxSlug, identityPublicId, page}: {count: number, mailboxSlug: string | null, identityPublicId: string, page?: number}) {

    const [activePage, setPage] = useState(page || 1);
    const router = useRouter()

    useEffect(() => {
        if ((activePage !== page) && activePage) {
            router.push(`/mail/${identityPublicId}/${mailboxSlug}?page=${activePage}`)
        }
    }, [activePage, page])


    return <Pagination value={activePage} onChange={setPage} total={count > 0 ? count/50 : 0} />
}

export default MailPagination;
