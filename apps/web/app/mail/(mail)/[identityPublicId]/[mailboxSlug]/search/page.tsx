import {
	fetchMailbox,
	fetchMailboxThreadsList,
	initSearch,
} from "@/lib/actions/mailbox";
import { getPublicEnv, ThreadHit } from "@schema";
import { isSignedIn } from "@/lib/actions/auth";
import ThreadList from "@/components/mailbox/default/thread-list";
import SearchPagination from "@/components/mailbox/default/search-pagination";

const PAGE_SIZE = 50;

export default async function SearchPage({
	params,
	searchParams,
}: {
	params: { mailboxSlug: string; identityPublicId: string };
	searchParams: Record<string, string | string[] | undefined>;
}) {
	const { identityPublicId, mailboxSlug } = await params;
	const resolvedSearchParams = await searchParams;
	const q = (resolvedSearchParams.q as string) ?? "";
	const has = (resolvedSearchParams.has as string) === "1";
	const unread = (resolvedSearchParams.unread as string) === "1";
	const page = Math.max(1, Number((resolvedSearchParams.page as string) ?? 1));

	const { activeMailbox } = await fetchMailbox(identityPublicId, mailboxSlug);
	const publicConfig = await getPublicEnv();

	let items: ThreadHit[] = [];
	let totalThreads = 0;
	let totalMessages = 0;

	if (q.trim()) {
		const user = await isSignedIn();
		const res = await initSearch(q, String(user?.id), has, unread, page); // paged at source
		items = res.items ?? [];
		totalThreads = res.totalThreads ?? items.length; // ideally = total matching threads
		totalMessages = res.totalMessages ?? items.length; // total matching docs
	}

	const total = totalThreads || items.length;
	const totalPages = Math.max(1, Math.ceil((total || 1) / PAGE_SIZE));

	// DO NOT slice here—items are already page-scoped
	const pageItems = items;

	const threadIds = pageItems.map((i) => i.threadId);
	const { threads } =
		threadIds.length > 0
			? await fetchMailboxThreadsList(activeMailbox.id, threadIds)
			: { threads: [] };

	return (
		<div className="p-4 space-y-4">
			<header className="flex items-center justify-between">
				<h1 className="text-lg font-semibold">Search</h1>
				<div className="text-sm text-muted-foreground">
					{q.trim()
						? `Threads: ${totalThreads} • Messages: ${totalMessages}`
						: "Type a query to search"}
				</div>
			</header>

			<div className="text-sm text-muted-foreground">
				<span className="font-medium">Query:</span> “{q || "—"}” ·{" "}
				<span className="font-medium">Has attachment:</span>{" "}
				{has ? "Yes" : "No"} · <span className="font-medium">Unread only:</span>{" "}
				{unread ? "Yes" : "No"}
			</div>

			{!q.trim() ? (
				<div className="text-sm text-muted-foreground">
					Use the global search box above to run a query.
				</div>
			) : pageItems.length === 0 ? (
				<div className="text-sm text-muted-foreground">No results found.</div>
			) : (
				<ThreadList
					threads={threads}
					publicConfig={publicConfig}
					activeMailbox={activeMailbox}
					identityPublicId={identityPublicId}
				/>
			)}

			{q.trim() && totalPages > 1 && (
				<SearchPagination
					total={total}
					pageSize={PAGE_SIZE}
					page={page}
					identityPublicId={identityPublicId}
					mailboxSlug={mailboxSlug}
					q={q}
					has={has}
					unread={unread}
				/>
			)}
		</div>
	);
}

// const PAGE_SIZE = 5;
//
// export default async function SearchPage({ params, searchParams}: {
//     params: { mailboxSlug: string; identityPublicId: string };
//     searchParams: Record<string, string | string[] | undefined>;
// }) {
//     const { identityPublicId, mailboxSlug } = await params;
//     const resolvedSearchParams = await searchParams;
//
//     const q = (resolvedSearchParams.q as string) ?? "";
//     const has = (resolvedSearchParams.has as string) === "1";
//     const unread = (resolvedSearchParams.unread as string) === "1";
//     const page = Math.max(1, Number((resolvedSearchParams.page as string) ?? 1));
//
//     const { activeMailbox } = await fetchMailbox(identityPublicId, mailboxSlug);
//     const publicConfig = await getPublicEnv();
//
//     let items: ThreadHit[] = [];
//     let totalThreads = 0;
//     let totalMessages = 0;
//
//     if (q.trim()) {
//         const user = await isSignedIn();
//         // NOTE: if initSearch supports limit/offset, pass them here instead of slicing below
//         const res = await initSearch(q, String(user?.id), has, unread, page);
//         // console.log("res", res)
//         items = res.items ?? [];
//         totalThreads = res.totalThreads ?? items.length;
//         totalMessages = res.totalMessages ?? items.length;
//     }
//
//     const total = totalThreads || items.length;
//     const totalPages = Math.max(1, Math.ceil((total || 1) / PAGE_SIZE));
//     console.log("totalPages", totalPages)
//
//     // Slice items for this page (until backend pagination is added to initSearch)
//     const start = (page - 1) * PAGE_SIZE;
//     const end = start + PAGE_SIZE;
//     const pageItems = items.slice(start, end);
//
//     // Fetch only the thread rows we need for this page
//     const threadIds = pageItems.map((i) => i.threadId);
//     const { threads } =
//         threadIds.length > 0
//             ? await fetchMailboxThreadsList(activeMailbox.id, threadIds)
//             : { threads: [] };
//
//     console.log("page", page)
//     return (
//         <div className="p-4 space-y-4">
//             <header className="flex items-center justify-between">
//                 <h1 className="text-lg font-semibold">Search</h1>
//                 <div className="text-sm text-muted-foreground">
//                     {q.trim()
//                         ? `Threads: ${totalThreads} • Messages: ${totalMessages}`
//                         : "Type a query to search"}
//                 </div>
//             </header>
//
//
//             <div className="text-sm text-muted-foreground">
//                 <span className="font-medium">Query:</span> “{q || "—"}” ·{" "}
//                 <span className="font-medium">Has attachment:</span> {has ? "Yes" : "No"} ·{" "}
//                 <span className="font-medium">Unread only:</span> {unread ? "Yes" : "No"}
//             </div>
//
//             {!q.trim() ? (
//                 <div className="text-sm text-muted-foreground">Use the global search box above to run a query.</div>
//             ) : pageItems.length === 0 ? (
//                 <div className="text-sm text-muted-foreground">No results found.</div>
//             ) : (
//                 <ThreadList
//                     threads={threads}
//                     publicConfig={publicConfig}
//                     activeMailbox={activeMailbox}
//                     identityPublicId={identityPublicId}
//                 />
//             )}
//
//             {/* pagination */}
//             {q.trim() && totalPages > 1 && (
//                 <SearchPagination
//                     total={total}
//                     pageSize={PAGE_SIZE}
//                     page={page}
//                     identityPublicId={identityPublicId}
//                     mailboxSlug={mailboxSlug}
//                     q={q}
//                     has={has}
//                     unread={unread}
//                 />
//             )}
//         </div>
//     );
// }

// // app/mail/[mailboxId]/inbox/search/page.tsx
// import {fetchMailbox, fetchMailboxThreads, fetchMailboxThreadsList, initSearch} from "@/lib/actions/mailbox";
// import {getPublicEnv, ThreadHit} from "@schema";
// import {isSignedIn} from "@/lib/actions/auth";
// import * as React from "react";
// import ThreadList from "@/components/mailbox/default/thread-list";
//
// export default async function SearchPage({
//                                              params,
//                                              searchParams,
//                                          }: {
//     params: { mailboxSlug: string, identityPublicId: string };
//     searchParams: Record<string, string | string[] | undefined>;
// }) {
//
//     const searchAttrs = await searchParams
//     const attrs = await params
//
//     const {activeMailbox} = await fetchMailbox(attrs.identityPublicId, attrs.mailboxSlug)
//
//     const q      = (searchAttrs.q as string) ?? "";
//     const has    = (searchAttrs.has as string) === "1";
//     const unread = (searchAttrs.unread as string) === "1";
//
//     let items: ThreadHit[] = [];
//     let totalThreads = 0;
//     let totalMessages = 0;
//
//     if (q.trim()) {
//         const user = await isSignedIn()
//         const res = await initSearch(q, String(user?.id), has, unread);
//         items = res.items ?? [];
//         totalThreads = res.totalThreads ?? items.length;
//         totalMessages = res.totalMessages ?? items.length;
//     }
//
//     const threadIds = items.map(i => i.threadId)
//     const { threads: threads } = await fetchMailboxThreadsList(activeMailbox.id,  threadIds);
//     const publicConfig = await getPublicEnv()
//
//     const page = Number((searchAttrs.page as string) ?? 1)
//
//     return (
//         <div className="p-4 space-y-4">
//             <header className="flex items-center justify-between">
//                 <h1 className="text-lg font-semibold">Search</h1>
//                 <div className="text-sm text-muted-foreground">
//                     {q.trim()
//                         ? `Threads: ${totalThreads} • Messages: ${totalMessages}`
//                         : "Type a query to search"}
//                 </div>
//             </header>
//
//             <div className="text-sm text-muted-foreground">
//                 <span className="font-medium">Query:</span> “{q || "—"}” ·{" "}
//                 <span className="font-medium">Has attachment:</span> {has ? "Yes" : "No"} ·{" "}
//                 <span className="font-medium">Unread only:</span> {unread ? "Yes" : "No"}
//             </div>
//
//
//
//
//
//
//             {!q.trim() ? (
//                 <div className="text-sm text-muted-foreground">
//                     Use the global search box above to run a query.
//                 </div>
//             ) : items.length === 0 ? (
//                 <div className="text-sm text-muted-foreground">No results found.</div>
//             ) : <ThreadList
//                 threads={threads}
//                 publicConfig={publicConfig}
//                 activeMailbox={activeMailbox}
//                 identityPublicId={attrs.identityPublicId}
//             />}
//
//             {/*<MailPagination count={items.length > 0 ? items.length : 1} mailboxSlug={activeMailbox.slug} identityPublicId={identityPublicId} page={Number(page)} />*/}
//         </div>
//     );
// }

// (
//     <ul className="divide-y rounded-md border">
//         {items.map((t) => (
//             <li key={t.id} className="p-4">
//                 <div className="flex items-center gap-2">
//                 <span
//                     aria-hidden
//                     className={`h-2 w-2 rounded-full ${
//                         t.unread ? "bg-primary" : "bg-muted-foreground/30"
//                     }`}
//                 />
//                     <div className="min-w-0 flex-1">
//                         <div className="truncate text-[15px] font-medium">
//                             {t.subject || "(no subject)"}
//                         </div>
//
//                         {t.snippet && (
//                             <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
//                                 {t.snippet}
//                             </div>
//                         )}
//
//                         <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
//                             {t.fromName && <span className="truncate">{t.fromName}</span>}
//                             {!t.fromName && t.fromEmail && (
//                                 <span className="truncate">{t.fromEmail}</span>
//                             )}
//                             {t.participants?.length ? (
//                                 <>
//                                     <span>•</span>
//                                     <span className="truncate">
//                           {t.participants.slice(0, 2).join(", ")}
//                                         {t.participants.length > 2 ? " …" : ""}
//                         </span>
//                                 </>
//                             ) : null}
//                             {t.createdAt ? (
//                                 <>
//                                     <span>•</span>
//                                     <span>
//                           {new Date(t.createdAt).toLocaleDateString(undefined, {
//                               month: "short",
//                               day: "numeric",
//                           })}
//                         </span>
//                                 </>
//                             ) : null}
//                             {t.hasAttachment ? (
//                                 <>
//                                     <span>•</span>
//                                     <span>Attachment</span>
//                                 </>
//                             ) : null}
//                         </div>
//                     </div>
//                 </div>
//             </li>
//         ))}
//     </ul>
// )
