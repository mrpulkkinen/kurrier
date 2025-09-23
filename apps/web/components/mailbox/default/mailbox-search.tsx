// "use client";
//
// import { useState } from "react";
// import { Spotlight, type SpotlightActionData } from "@mantine/spotlight";
// import { Group, Badge, Text, Divider } from "@mantine/core";
// import { IconMail, IconPaperclip, IconSearch } from "@tabler/icons-react";
//
// type MailResult = {
//     id: string;
//     subject: string;
//     from: string;
//     when: string;
//     hasAttachment?: boolean;
// };
//
// const MOCK_RESULTS: MailResult[] = [
//     { id: "1", subject: "Your invoice is available for dinebot.io", from: "Google Payments", when: "2 Sept", hasAttachment: true },
//     { id: "2", subject: "Update your tax info", from: "Google Payments", when: "11 Aug" },
//     { id: "3", subject: "[Legal Update] Changes to Service Terms", from: "The Google Workspace Team", when: "26 Aug" },
//     { id: "4", subject: "Your invoice is available for dinebot.io", from: "Google Payments", when: "2 Jul", hasAttachment: true },
// ];
//
// export default function MailboxSpotlight() {
//     const [query, setQuery] = useState("");
//
//     const addToken = (token: string) =>
//         setQuery((q) => (q.trim() ? `${q} ${token}` : token));
//
//     // Normal mail actions
//     const mailActions: SpotlightActionData[] = MOCK_RESULTS.map((m) => ({
//         id: `mail_${m.id}`,
//         label: m.subject,
//         description: `${m.from} • ${m.when}`,
//         leftSection: <IconMail size={16} />,
//         rightSection: m.hasAttachment ? <IconPaperclip size={14} /> : undefined,
//         onClick: () => console.log("open mail:", m.id),
//     }));
//
//     // Chips row as the first action
//     const topAction: SpotlightActionData = {
//         id: "__chips",
//         disabled: true,
//         children: (
//             <>
//                 <Group gap="xs" px="xs" py="xs" wrap="wrap">
//                     <Badge radius="xl" onClick={() => addToken("has:attachment")} style={{ cursor: "pointer" }}>
//                         Has attachment
//                     </Badge>
//                     <Badge radius="xl" onClick={() => addToken("newer_than:7d")} style={{ cursor: "pointer" }}>
//                         Last 7 days
//                     </Badge>
//                     <Badge radius="xl" onClick={() => addToken("from:me")} style={{ cursor: "pointer" }}>
//                         From me
//                     </Badge>
//                 </Group>
//                 <Divider />
//             </>
//         ),
//     };
//
//     // Footer bar as the last action
//     const bottomAction: SpotlightActionData = {
//         id: "__footer",
//         disabled: true,
//         children: (
//             <>
//                 <Divider />
//                 <Group justify="space-between" px="sm" py="xs">
//                     <Text size="sm" c="dimmed">
//                         All search results for ‘{query || "..."}’
//                     </Text>
//                     <Text size="sm" c="dimmed">Press ENTER</Text>
//                 </Group>
//             </>
//         ),
//     };
//
//     // Final action list
//     // const actions = [topAction, query.length > 0 ? [...mailActions] : [], bottomAction];
//     const actions = [
//         topAction,
//         ...(query.length > 0 ? mailActions : []),
//         bottomAction,
//     ];
//
//     return (
//         <>
//             <button
//                 onClick={() => Spotlight.open()}
//                 className="rounded-xl border px-3 py-2 text-sm"
//             >
//                 Search mail (⌘K)
//             </button>
//
//             <Spotlight
//                 actions={actions}
//                 shortcut={["mod + K"]}
//                 nothingFound="No results"
//                 highlightQuery
//                 searchProps={{
//                     placeholder: "Search mail…",
//                     leftSection: <IconSearch size={16} />,
//                     value: query,
//                     onChange: (e) => setQuery(e.currentTarget.value),
//                     autoFocus: true,
//                 }}
//             />
//         </>
//     );
// }





"use client";

import * as React from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // optional: remove if you don't use cn
import { Search } from "lucide-react";

type MockResult = {
    id: string;
    subject: string;
    from: string;
    when: string;
    hasAttachment?: boolean;
};

const MOCK_RESULTS: MockResult[] = [
    { id: "1", subject: "Your invoice is available for dinebot.io", from: "Google Payments", when: "2 Sept", hasAttachment: true },
    { id: "2", subject: "Update your tax info", from: "Google Payments", when: "11 Aug" },
    { id: "3", subject: "[Legal Update] Changes to Service Terms", from: "The Google Workspace Team", when: "26 Aug" },
    { id: "4", subject: "Your invoice is available for dinebot.io", from: "Google Payments", when: "2 Jul", hasAttachment: true },
];

export default function MailboxSearch() {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");

    // Open with ⌘K / Ctrl+K
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen((v) => !v);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Quick chips that append tokens into the query
    const chips = [
        { label: "Has attachment", token: "has:attachment" },
        { label: "Last 7 days", token: "newer_than:7d" },
        { label: "From me", token: "from:me" },
    ];

    const filtered = query.trim()
        ? MOCK_RESULTS.filter((r) =>
            `${r.subject} ${r.from}`.toLowerCase().includes(query.toLowerCase())
        )
        : MOCK_RESULTS;

    const handleSearchAll = () => {
        // Replace with router push or your full search page
        console.log("Full search for:", query);
        setOpen(false);
    };

    return (
        <>
            {/* Trigger input (tiny top bar). Click to open dialog */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-muted-foreground hover:bg-muted/30"
            >
                <Search className="h-4 w-4 opacity-60" />
                <span className="text-sm">Search mail (⌘K)</span>
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                {/* INPUT */}
                <CommandInput
                    autoFocus
                    placeholder="Search mail…"
                    value={query}
                    onValueChange={setQuery}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey || e.shiftKey)) {
                            e.preventDefault();           // ⬅️ stop Command from selecting top item
                            e.stopPropagation();
                            // optional: modifier-based "open in new tab" etc
                        } else if (e.key === "Enter" && query.trim().length > 0) {
                            handleSearchAll();
                        }
                    }}
                />

                {/* CHIPS */}
                <div className="sticky top-0 z-10 flex flex-wrap gap-2 border-b bg-background px-4 py-2">
                    {chips.map((c) => (
                        <Badge
                            key={c.label}
                            variant="secondary"
                            className="cursor-pointer rounded-full px-3 py-1 text-sm"
                            onClick={() =>
                                setQuery((q) =>
                                    q.includes(c.token) ? q : (q ? `${q} ${c.token}` : c.token)
                                )
                            }
                        >
                            {c.label}
                        </Badge>
                    ))}
                </div>

                <CommandList className="max-h-[60vh]">
                    <CommandEmpty>No results found.</CommandEmpty>

                    <CommandGroup heading="Top results">
                        {filtered.map((r) => (
                            <CommandItem
                                key={r.id}
                                value={`${r.subject} ${r.from}`}
                                onSelect={() => {
                                    console.log("Navigate to message:", r.id);
                                    setOpen(false);
                                }}
                                className="items-start gap-3 px-4 py-3"
                            >
                <span
                    aria-hidden
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40"
                />
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-[15px] font-medium">
                                        {r.subject}
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="truncate">{r.from}</span>
                                        <span>•</span>
                                        <span>{r.when}</span>
                                        {r.hasAttachment && (
                                            <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px]">
                        attachment
                      </span>
                                        )}
                                    </div>
                                </div>
                                <div className="shrink-0 pl-3 text-xs text-muted-foreground">
                                    {/* right-side date / icons space (mock) */}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>

                <CommandSeparator />

                {/* FOOTER BAR */}
                <div className="flex items-center justify-between rounded-b-lg bg-background/95 px-4 py-3 backdrop-blur">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Search className="h-4 w-4 opacity-70" />
                        <span>
              All search results for{" "}
                            <span className="font-medium text-foreground">
                {`‘${query || ""}’`}
              </span>
            </span>
                    </div>
                    <div className="text-xs text-muted-foreground">Press ENTER</div>
                </div>
            </CommandDialog>
        </>
    );
}


// "use client";
//
// import { Spotlight, SpotlightActionData, spotlight } from "@mantine/spotlight";
// import { Search } from "lucide-react";
// import { useState } from "react";
//
// export default function MailboxSearch() {
//     const [query, setQuery] = useState("");
//
//     const actions: SpotlightActionData[] = [
//         {
//             id: "1",
//             label: "Your invoice is available for dinebot.io",
//             description: "Google Payments • 2 Sept",
//             onClick: () => console.log("Navigate invoice"),
//         },
//         {
//             id: "2",
//             label: "Update your tax info",
//             description: "Google Payments • 11 Aug",
//             onClick: () => console.log("Navigate tax"),
//         },
//         {
//             id: "3",
//             label: "[Legal Update] Changes to Service Terms",
//             description: "The Google Workspace Team • 26 Aug",
//             onClick: () => console.log("Navigate legal"),
//         },
//     ];
//
//     return (
//         <>
//             {/* trigger bar */}
//             <div
//                 onClick={() => spotlight.open()}
//                 className="flex w-full cursor-pointer items-center gap-2 rounded-2xl border bg-white px-4 py-2.5 text-gray-500 shadow-sm hover:bg-gray-50"
//             >
//                 <Search className="h-4 w-4 opacity-60" />
//                 Search mail (⌘K)
//             </div>
//
//             {/* Mantine Spotlight overlay */}
//             <Spotlight
//                 actions={actions}
//                 query={query}
//                 onQueryChange={setQuery}
//                 nothingFound="No results found"
//                 searchProps={{
//                     leftSection: <Search className="h-4 w-4 opacity-60" />,
//                     placeholder: "Search mail…",
//                 }}
//                 // optional: style the overlay
//                 styles={{
//                     content: { borderRadius: "12px" },
//                 }}
//             />
//         </>
//     );
// }



// "use client";
//
// import * as React from "react";
// import {
//     CommandDialog,
//     CommandEmpty,
//     CommandGroup,
//     CommandInput,
//     CommandItem,
//     CommandList,
// } from "@/components/ui/command";
// import { Badge } from "@/components/ui/badge";
// import { Search } from "lucide-react";
//
// type MockResult = {
//     id: string;
//     subject: string;
//     from: string;
//     when: string;
//     hasAttachment?: boolean;
// };
//
// const MOCK_RESULTS: MockResult[] = [
//     { id: "1", subject: "Your invoice is available for dinebot.io", from: "Google Payments", when: "2 Sept", hasAttachment: true },
//     { id: "2", subject: "Update your tax info", from: "Google Payments", when: "11 Aug" },
//     { id: "3", subject: "[Legal Update] Changes to Service Terms", from: "The Google Workspace Team", when: "26 Aug" },
//     { id: "4", subject: "Your invoice is available for dinebot.io", from: "Google Payments", when: "2 Aug", hasAttachment: true },
// ];
//
// export default function MailboxSearch() {
//     const [open, setOpen] = React.useState(false);
//     const [query, setQuery] = React.useState("");
//
//     // keep your simple cmd/ctrl + K toggle
//     React.useEffect(() => {
//         const down = (e: KeyboardEvent) => {
//             if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
//                 e.preventDefault();
//                 setOpen(prev => !prev);
//             }
//         };
//         document.addEventListener("keydown", down);
//         return () => document.removeEventListener("keydown", down);
//     }, []);
//
//     const chips = [
//         { label: "Has attachment", onClick: () => setQuery(q => `${q} has:attachment`.trim()) },
//         { label: "Last 7 days",   onClick: () => setQuery(q => `${q} newer_than:7d`.trim()) },
//         { label: "From me",       onClick: () => setQuery(q => `${q} from:me`.trim()) },
//     ];
//
//     const filtered = query.trim()
//         ? MOCK_RESULTS.filter(r =>
//             `${r.subject} ${r.from}`.toLowerCase().includes(query.toLowerCase())
//         )
//         : MOCK_RESULTS;
//
//     return (
//         <>
//             {/* Trigger search pill */}
//             <div
//                 role="button"
//                 tabIndex={0}
//                 onClick={() => setOpen(true)}
//                 className="flex w-full items-center gap-2 rounded-2xl border bg-background px-4 py-2.5 text-muted-foreground shadow-sm hover:bg-muted/30 focus:outline-none"
//             >
//                 <Search className="h-4 w-4 opacity-60" />
//                 Search mail (⌘K)
//             </div>
//
//             {/* Spotlight-style dialog */}
//             <CommandDialog open={open} onOpenChange={setOpen}>
//                 <CommandInput
//                     placeholder="Search mail…"
//                     value={query}
//                     onValueChange={setQuery}
//                 />
//
//                 {/* Quick chips row */}
//                 <div className="flex gap-2 px-4 py-2">
//                     {chips.map((c) => (
//                         <Badge
//                             key={c.label}
//                             variant="secondary"
//                             className="cursor-pointer rounded-full px-3 py-1 text-sm"
//                             onClick={c.onClick}
//                         >
//                             {c.label}
//                         </Badge>
//                     ))}
//                 </div>
//
//                 <CommandList>
//                     <CommandEmpty>No results found.</CommandEmpty>
//                     <CommandGroup heading="Top results">
//                         {filtered.map((r) => (
//                             <CommandItem
//                                 key={r.id}
//                                 value={r.subject}
//                                 onSelect={() => {
//                                     console.log("Navigate to mail:", r.id);
//                                     setOpen(false);
//                                 }}
//                                 className="items-start gap-3 px-4 py-3"
//                             >
//                                 <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50" />
//                                 <div className="min-w-0 flex-1">
//                                     <div className="truncate text-[15px] font-medium">
//                                         {r.subject}
//                                     </div>
//                                     <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
//                                         <span className="truncate">{r.from}</span>
//                                         <span>•</span>
//                                         <span>{r.when}</span>
//                                         {r.hasAttachment && (
//                                             <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px]">
//                         attachment
//                       </span>
//                                         )}
//                                     </div>
//                                 </div>
//                             </CommandItem>
//                         ))}
//                     </CommandGroup>
//                 </CommandList>
//
//                 {/* --- Gmail-like footer bar --- */}
//                 {query && (
//                     <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
//             <span className="flex items-center gap-2">
//               <Search className="h-4 w-4" />
//               All search results for ‘{query}’
//             </span>
//                         <span className="text-xs">Press ENTER</span>
//                     </div>
//                 )}
//             </CommandDialog>
//         </>
//     );
// }






// "use client";
//
// import * as React from "react";
// import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
// import { Badge } from "@/components/ui/badge";
//
// type MockResult = {
//     id: string;
//     subject: string;
//     from: string;
//     when: string;
//     hasAttachment?: boolean;
// };
//
// const MOCK_RESULTS: MockResult[] = [
//     { id: "1", subject: "Your invoice is available for dinebot.io", from: "Google Payments", when: "2 Sept", hasAttachment: true },
//     { id: "2", subject: "Update your tax info", from: "Google Payments", when: "11 Aug" },
//     { id: "3", subject: "[Legal Update] Changes to Service Terms", from: "The Google Workspace Team", when: "26 Aug" },
//     { id: "4", subject: "Your invoice is available for dinebot.io", from: "Google Payments", when: "2 Aug", hasAttachment: true },
// ];
//
// export default function MailboxSearch() {
//     const [open, setOpen] = React.useState(false);
//     const [query, setQuery] = React.useState("");
//
//     // open with cmd+k or ctrl+k
//     React.useEffect(() => {
//         const down = (e: KeyboardEvent) => {
//             if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
//                 e.preventDefault();
//                 setOpen((prev) => !prev);
//             }
//         };
//         document.addEventListener("keydown", down);
//         return () => document.removeEventListener("keydown", down);
//     }, []);
//
//     const chips = [
//         { label: "Has attachment", onClick: () => setQuery((q) => `${q} has:attachment`.trim()) },
//         { label: "Last 7 days", onClick: () => setQuery((q) => `${q} newer_than:7d`.trim()) },
//         { label: "From me", onClick: () => setQuery((q) => `${q} from:me`.trim()) },
//     ];
//
//     const filtered = query.trim()
//         ? MOCK_RESULTS.filter((r) =>
//             `${r.subject} ${r.from}`.toLowerCase().includes(query.toLowerCase())
//         )
//         : MOCK_RESULTS;
//
//     return (
//         <>
//             {/* Your trigger, small search bar */}
//             <div
//                 role="button"
//                 tabIndex={0}
//                 onClick={() => setOpen(true)}
//                 className="flex w-full items-center gap-2 rounded-2xl border bg-background px-4 py-2.5 text-muted-foreground shadow-sm hover:bg-muted/30 focus:outline-none"
//             >
//                 <svg aria-hidden className="h-4 w-4 opacity-60" viewBox="0 0 20 20" fill="currentColor">
//                     <path
//                         fillRule="evenodd"
//                         d="M8.5 3a5.5 5.5 0 1 1 3.463 9.815l3.111 3.11a1 1 0 0 1-1.414 1.415l-3.11-3.112A5.5 5.5 0 0 1 8.5 3Zm-4 5.5a4 4 0 1 0 8 0a4 4 0 0 0-8 0Z"
//                         clipRule="evenodd"
//                     />
//                 </svg>
//                 Search mail (⌘K)
//             </div>
//
//             {/* Spotlight-style dialog */}
//             <CommandDialog open={open} onOpenChange={setOpen}>
//                 <CommandInput
//                     placeholder="Search mail…"
//                     value={query}
//                     onValueChange={setQuery}
//                 />
//                 <div className="px-4 py-2 flex gap-2">
//                     {chips.map((c) => (
//                         <Badge
//                             key={c.label}
//                             variant="secondary"
//                             className="cursor-pointer rounded-full px-3 py-1 text-sm"
//                             onClick={c.onClick}
//                         >
//                             {c.label}
//                         </Badge>
//                     ))}
//                 </div>
//                 <CommandList>
//                     <CommandEmpty>No results found.</CommandEmpty>
//                     <CommandGroup heading="Top results">
//                         {filtered.map((r) => (
//                             <CommandItem
//                                 key={r.id}
//                                 value={r.subject}
//                                 onSelect={() => {
//                                     console.log("Navigate to mail:", r.id);
//                                     setOpen(false);
//                                 }}
//                                 className="items-start gap-3 px-4 py-3"
//                             >
//                                 <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50" />
//                                 <div className="min-w-0 flex-1">
//                                     <div className="truncate text-[15px] font-medium">{r.subject}</div>
//                                     <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
//                                         <span className="truncate">{r.from}</span>
//                                         <span>•</span>
//                                         <span>{r.when}</span>
//                                         {r.hasAttachment && (
//                                             <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px]">
//                         attachment
//                       </span>
//                                         )}
//                                     </div>
//                                 </div>
//                             </CommandItem>
//                         ))}
//                     </CommandGroup>
//                 </CommandList>
//             </CommandDialog>
//         </>
//     );
// }
