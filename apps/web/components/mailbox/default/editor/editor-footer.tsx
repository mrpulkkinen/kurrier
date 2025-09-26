import React, {useRef, useState} from "react";
import { ActionIcon, Button, Popover, Progress } from "@mantine/core";
import { Baseline, Paperclip, X as IconX } from "lucide-react";
import { RichTextEditor } from "@mantine/tiptap";
import { useDynamicContext } from "@/hooks/use-dynamic-context";
import { createClient } from "@/lib/supabase/client";
import type { PublicConfig } from "@schema";
import { v4 as uuidv4 } from "uuid";
import { extension } from "mime-types";
import {MessageEntity} from "@db";


type UploadItem = {
    name: string;
    path: string;
    size: number;
    progress: number;                 // 0..100
    status: "uploading" | "done" | "error";
    error?: string;
};

// --- Optional: make progress visibly slower for demo/debug
const SLOW_MODE = false;             // set false for real-time progress
const SLOW_MS_PER_PERCENT = 20;     // lower=faster

const formatBytes = (n: number) => {
    if (!Number.isFinite(n)) return "";
    const units = ["B", "K", "MB", "GB"];
    let i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${Math.round(n)}${units[i]}`;
};

export default function EditorFooter() {
    const { state } = useDynamicContext<{ publicConfig: PublicConfig; isPending: boolean, message: MessageEntity }>();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [attachments, setAttachments] = useState<Record<any, any>[]>([]);

    const newMessageId = useRef(uuidv4())

    const triggerUpload = () => inputRef.current?.click();

    /**
     * Upload with XHR (so we get native progress events).
     * We animate progress updates to look smooth (and optionally slow).
     */
    const uploadFile = async (
        bucket: string,
        path: string,
        file: File,
        token: string
    ): Promise<void> => {
        const url = `${state.publicConfig.SUPABASE_DOMAIN}/storage/v1/object/${bucket}/${path}`;

        await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", url);
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            xhr.setRequestHeader("x-upsert", "true");

            let lastPct = 0;

            const animateTo = (target: number) => {
                if (!SLOW_MODE) {
                    lastPct = target;
                    setUploads(prev => prev.map(u => u.path === path ? ({ ...u, progress: lastPct }) : u));
                    return;
                }
                const step = () => {
                    if (lastPct < target) {
                        lastPct += 1;
                        setUploads(prev => prev.map(u => u.path === path ? ({ ...u, progress: lastPct }) : u));
                        setTimeout(step, SLOW_MS_PER_PERCENT);
                    }
                };
                step();
            };

            xhr.upload.onprogress = (evt) => {
                if (!evt.lengthComputable) return;
                const pct = Math.max(0, Math.min(100, Math.round((evt.loaded / evt.total) * 100)));
                if (pct > lastPct) animateTo(pct);
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    animateTo(100);
                    setAttachments(prev => [
                        ...prev,
                        {
                            path,
                            sizeBytes: file.size,
                            messageId: newMessageId.current,
                            bucketId: bucket,
                            filenameOriginal: file.name,
                            contentType: file.type,
                        }
                    ])

                    resolve();
                } else {
                    reject(xhr.responseText || `HTTP ${xhr.status}`);
                }
            };

            xhr.onerror = () => reject("Network error");
            xhr.send(file);
        });
    };

    const onFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        console.log("files", files)
        if (!files?.length) return;

        const supabase = createClient(state.publicConfig);
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        const userId = data.session?.user?.id;
        if (!token || !userId) {
            alert("No auth session found");
            event.target.value = "";
            return;
        }


        // const { data: d, error } = await supabase
        //     .storage
        //     .from('attachments')
        //     .createSignedUrl('public/883ca695-d81a-4ff8-80e9-e7d669f260f8/1758778270361-oc.dmg', 60)
        // console.log("ddd", d, error)

        // const { data: d } = supabase
        //     .storage
        //     .from('attachments')
        //     // .getPublicUrl('public/883ca695-d81a-4ff8-80e9-e7d669f260f8/1758778270361-oc.dmg');
        //     .getPublicUrl('private/883ca695-d81a-4ff8-80e9-e7d669f260f8/e5754695-1a66-4a7d-a8f5-76536a4bb971/0ff27fdf-c25d-4c41-9ffe-528249737127.pdf');
        //

        // console.log("ddd", d)

        const bucket = "attachments";

        for (const file of Array.from(files)) {
            console.log(extension(file.type))
            // IMPORTANT: path should NOT start with a leading slash for Supabase storage
            // const path = `private/${userId}/${newMessageId.current}/${file.name}`;
            const path = `private/${userId}/${newMessageId.current}/${uuidv4()}.${extension(file.type)}`;
            // uuidv4
            console.log("path", path)

            setUploads(prev => [
                ...prev,
                { name: file.name, path, size: file.size, progress: 0, status: "uploading" },
            ]);

            try {
                await uploadFile(bucket, path, file, token);
                setUploads(prev =>
                    prev.map(u => u.path === path ? { ...u, progress: 100, status: "done" } : u)
                );
            } catch (err) {
                setUploads(prev =>
                    prev.map(u =>
                        u.path === path
                            ? { ...u, progress: 100, status: "error", error: String(err) }
                            : u
                    )
                );
            }
        }

        // allow same-file selection immediately after
        event.target.value = "";
    };

    const removeUpload = (path: string) => {
        setUploads(prev => prev.filter(u => u.path !== path));
        // Optionally: also delete from storage if desired
        // await supabase.storage.from('attachments').remove([path]);
    };

    return (
        <>
            {/* Attachments area */}
            {uploads.length > 0 && (
                <div className="w-full rounded-md p-2 flex flex-col gap-2">
                    {uploads.map((u) => {
                        const showProgress = u.status === "uploading" && u.progress < 100;
                        return (
                            <div
                                key={u.path}
                                className="flex justify-between items-center w-full max-w-xl bg-zinc-100 rounded px-4 py-2"
                            >
                                {/* left: filename + size */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <a
                                        href="#"
                                        className="text-brand font-semibold truncate max-w-[18rem]"
                                        title={u.name}
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        {u.name}
                                    </a>
                                    <span className="text-sm text-zinc-700">({formatBytes(u.size)})</span>
                                </div>

                                {/* right: progress (when uploading) + X */}
                                <div className="flex items-center gap-2">
                                    {showProgress && (
                                        <div className="w-40">
                                            <Progress
                                                value={u.progress}
                                                size="sm"
                                                radius="xl"
                                                color="blue"
                                            />
                                        </div>
                                    )}
                                    {u.status === "error" && (
                                        <span className="text-xs text-red-600 truncate max-w-[14rem]" title={u.error}>
                      {u.error}
                    </span>
                                    )}
                                    <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        onClick={() => removeUpload(u.path)}
                                        title="Remove"
                                    >
                                        <IconX size={16} />
                                    </ActionIcon>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer bar */}
            <div className="border-t items-center flex py-2">
                <div className="mx-2">
                    <Button loading={!!state.isPending} size="xs" radius="xl" type="submit">
                        Send
                    </Button>
                </div>

                <Popover position="top-start" withArrow shadow="md">
                    <Popover.Target>
                        <ActionIcon variant="transparent" aria-label="Formatting">
                            <Baseline />
                        </ActionIcon>
                    </Popover.Target>
                    <Popover.Dropdown className="!p-0">
                        <RichTextEditor.Toolbar sticky stickyOffset={60} className="!border-0">
                            <RichTextEditor.ControlsGroup>
                                <RichTextEditor.Bold />
                                <RichTextEditor.Italic />
                                <RichTextEditor.Underline />
                                <RichTextEditor.Strikethrough />
                                <RichTextEditor.ClearFormatting />
                            </RichTextEditor.ControlsGroup>

                            <RichTextEditor.ControlsGroup>
                                <RichTextEditor.BulletList />
                                <RichTextEditor.OrderedList />
                            </RichTextEditor.ControlsGroup>

                            <RichTextEditor.ControlsGroup>
                                <RichTextEditor.Undo />
                                <RichTextEditor.Redo />
                            </RichTextEditor.ControlsGroup>
                        </RichTextEditor.Toolbar>
                    </Popover.Dropdown>
                </Popover>

                <ActionIcon
                    onClick={triggerUpload}
                    variant="transparent"
                    className="mx-2"
                    aria-label="Attach files"
                >
                    <Paperclip size={18} />
                </ActionIcon>

                <input type={"hidden"} name={"originalMessageId"} value={state.message.id}/>
                {/*<input type={"hidden"} name={"threadId"} value={state.message.threadId}/>*/}
                {/*<input type={"hidden"} name={"threadId"} value={state.message.mailboxId}/>*/}
                {/*<input type={"hidden"} name={"inReplyTo"} value={state.message.messageId}/>*/}
                {/*<input type={"hidden"} name={"messageId"} value={message.id} />*/}
                <input type={"hidden"} name={"newMessageId"} value={newMessageId.current}/>
                <input type="hidden" name="attachments" value={JSON.stringify(attachments)}/>
                <input ref={inputRef} type="file" multiple hidden onChange={onFileSelect}/>
            </div>
        </>
    );
}


// import React, { useRef, useState } from "react";
// import { ActionIcon, Button, Popover, Progress } from "@mantine/core";
// import { Baseline, Paperclip, X as IconX } from "lucide-react";
// import { RichTextEditor } from "@mantine/tiptap";
// import { useDynamicContext } from "@/hooks/use-dynamic-context";
// import { createClient } from "@/lib/supabase/client";
// import {PublicConfig} from "@schema";
//
// type UploadItem = {
//     name: string;
//     path: string;
//     size: number;           // bytes
//     progress: number;       // 0..100
//     status: "uploading" | "done" | "error";
//     error?: string;
//     // optional: url?: string
// };
//
// export default function EditorFooter() {
//     const { state } = useDynamicContext<{publicConfig: PublicConfig, isPending: boolean}>();
//     const inputRef = useRef<HTMLInputElement | null>(null);
//     const [uploads, setUploads] = useState<UploadItem[]>([]);
//
//     const triggerUpload = () => inputRef.current?.click();
//
//
//
//     const uploadFile = async (
//         bucket: string,
//         path: string,
//         file: File,
//         token: string
//     ): Promise<void> => {
//         const url = `${state.publicConfig?.SUPABASE_DOMAIN}/storage/v1/object/${bucket}/${path}`;
//
//         await new Promise<void>((resolve, reject) => {
//             const xhr = new XMLHttpRequest();
//             xhr.open("POST", url);
//             xhr.setRequestHeader("Authorization", `Bearer ${token}`);
//             xhr.setRequestHeader("x-upsert", "true");
//
//             let lastPct = 0;
//
//             // Helper: smooth / slow down updates
//             const animateProgress = (targetPct: number) => {
//                 const step = () => {
//                     if (lastPct < targetPct) {
//                         lastPct++;
//                         setUploads((prev) =>
//                             prev.map((u) =>
//                                 u.path === path ? { ...u, progress: lastPct } : u
//                             )
//                         );
//                         setTimeout(step, 30); // <-- adjust this to control speed (ms per %)
//                     }
//                 };
//                 step();
//             };
//
//             xhr.upload.onprogress = (evt) => {
//                 if (!evt.lengthComputable) return;
//                 const pct = Math.round((evt.loaded / evt.total) * 100);
//
//                 // Instead of jumping directly, animate towards pct
//                 if (pct > lastPct) {
//                     animateProgress(pct);
//                 }
//             };
//
//             xhr.onload = () => {
//                 if (xhr.status >= 200 && xhr.status < 300) {
//                     animateProgress(100); // animate to 100% at the end
//                     resolve();
//                 } else {
//                     reject(xhr.responseText || `HTTP ${xhr.status}`);
//                 }
//             };
//
//             xhr.onerror = () => reject("Network error");
//             xhr.send(file);
//         });
//     };
//     // const uploadFile = async (
//     //     bucket: string,
//     //     path: string,
//     //     file: File,
//     //     token: string
//     // ): Promise<void> => {
//     //     const url = `${state.publicConfig?.SUPABASE_DOMAIN}/storage/v1/object/${bucket}/${path}`;
//     //
//     //     await new Promise<void>((resolve, reject) => {
//     //         const xhr = new XMLHttpRequest();
//     //         xhr.open("POST", url);
//     //         xhr.setRequestHeader("Authorization", `Bearer ${token}`);
//     //         xhr.setRequestHeader("x-upsert", "true");
//     //
//     //         xhr.upload.onprogress = async (evt) => {
//     //             if (!evt.lengthComputable) return;
//     //
//     //             const pct = Math.round((evt.loaded / evt.total) * 100);
//     //             setUploads((prev) =>
//     //                 prev.map((u) => (u.path === path ? { ...u, progress: pct } : u))
//     //             );
//     //         };
//     //
//     //         xhr.onload = () => {
//     //             if (xhr.status >= 200 && xhr.status < 300) {
//     //                 resolve();
//     //             } else {
//     //                 reject(xhr.responseText || `HTTP ${xhr.status}`);
//     //             }
//     //         };
//     //         xhr.onerror = () => reject("Network error");
//     //         xhr.send(file);
//     //     });
//     // };
//
//     const onFileSelect = async (
//         event: React.ChangeEvent<HTMLInputElement>
//     ): Promise<void> => {
//         const files = event.target.files;
//         if (!files?.length) return;
//
//         const supabase = createClient(state.publicConfig);
//         const { data } = await supabase.auth.getSession();
//         const token = data.session?.access_token;
//         const userId = data.session?.user?.id;
//
//         if (!token || !userId) {
//             alert("No auth session found");
//             event.target.value = "";
//             return;
//         }
//
//         const bucket = "attachments";
//
//         Array.from(event.target.files).forEach((file) => {
//             const path = `/private/${data.session.user.id}/${Date.now()}-${file.name}`;
//
//             setUploads((prev) => [
//                 ...prev,
//                 { name: file.name, path, size: file.size, progress: 0, status: "uploading" },
//             ]);
//
//             uploadFile(bucket, path, file, token)
//                 .then(() => {
//                     setUploads((prev) =>
//                         prev.map((u) =>
//                             u.path === path ? { ...u, progress: 100, status: "done" } : u
//                         )
//                     );
//                 })
//                 .catch((err) => {
//                     setUploads((prev) =>
//                         prev.map((u) =>
//                             u.path === path
//                                 ? { ...u, progress: 100, status: "error", error: String(err) }
//                                 : u
//                         )
//                     );
//                 });
//         });
//
//         // allow same-file selection right after
//         event.target.value = "";
//     };
//
//     const formatBytes = (n: number) => {
//         if (!Number.isFinite(n)) return "";
//         const units = ["B", "K", "MB", "GB"];
//         let i = 0;
//         while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
//         return `${Math.round(n)}${units[i]}`;
//     };
//
// // call this to remove from UI (and optionally delete from storage)
//     const removeUpload = (path: string) => {
//         setUploads((prev) => prev.filter((u) => u.path !== path));
//         // Optional: also delete from storage here if you want
//         // await supabase.storage.from('attachments').remove([path]);
//     };
//
//     return (
//         <>
//             {/* Attachments area */}
//             {uploads.length > 0 && <div className="w-full rounded-md p-2 flex flex-col gap-2">
//                 {uploads.length === 0 ? (
//                     <div className="text-sm text-zinc-500"></div>
//                 ) : (
//                     uploads.map((u) => (
//                         <div key={u.path} className="flex justify-between w-96 bg-zinc-100 rounded px-4 py-1 my-1">
//
//                             <div className={"flex gap-1 items-center justify-start font-semibold"}>
//                                 <a href="#" className={"!p-0 !m-0 text-brand truncate overflow-ellipsis w-32"}>{u.name}</a>
//                                 <span className={"text-sm"}>({formatBytes(u.size)})</span>
//                             </div>
//                             <div className={"flex items-center"}>
//                                                  <Progress
//                                                      value={u.error ? 100 : u.progress}
//                                                      color={u.error ? "red" : "blue"}
//                                                      size="sm"
//                                                      radius="xl"
//                                                      className="mt-1"
//                                                  />
//                                 <ActionIcon variant="subtle" color="gray" onClick={() => removeUpload(u.path)}>
//                                     <IconX size={16} />
//                                 </ActionIcon>
//                             </div>
//
//                         </div>
//                     ))
//                 )}
//             </div>}
//
//
//             {/* Footer bar */}
//             <div className="border-t items-center flex py-2">
//                 <div className="mx-2">
//                     <Button
//                         loading={!!state.isPending}
//                         size="xs"
//                         radius="xl"
//                         type="submit"
//                     >
//                         Send
//                     </Button>
//                 </div>
//
//                 <Popover position="top-start" withArrow shadow="md">
//                     <Popover.Target>
//                         <ActionIcon variant="transparent" aria-label="Formatting">
//                             <Baseline />
//                         </ActionIcon>
//                     </Popover.Target>
//                     <Popover.Dropdown className="!p-0">
//                         <RichTextEditor.Toolbar sticky stickyOffset={60} className="!border-0">
//                             <RichTextEditor.ControlsGroup>
//                                 <RichTextEditor.Bold />
//                                 <RichTextEditor.Italic />
//                                 <RichTextEditor.Underline />
//                                 <RichTextEditor.Strikethrough />
//                                 <RichTextEditor.ClearFormatting />
//                             </RichTextEditor.ControlsGroup>
//
//                             <RichTextEditor.ControlsGroup>
//                                 <RichTextEditor.BulletList />
//                                 <RichTextEditor.OrderedList />
//                             </RichTextEditor.ControlsGroup>
//
//                             <RichTextEditor.ControlsGroup>
//                                 <RichTextEditor.Undo />
//                                 <RichTextEditor.Redo />
//                             </RichTextEditor.ControlsGroup>
//                         </RichTextEditor.Toolbar>
//                     </Popover.Dropdown>
//                 </Popover>
//
//                 <ActionIcon
//                     onClick={triggerUpload}
//                     variant="transparent"
//                     className="mx-2"
//                     aria-label="Attach files"
//                 >
//                     <Paperclip size={18} />
//                 </ActionIcon>
//
//                 <input
//                     ref={inputRef}
//                     type="file"
//                     multiple
//                     hidden
//                     onChange={onFileSelect}
//                 />
//             </div>
//         </>
//     );
// }





// import React, { useRef, useState } from "react";
// import {useDynamicContext} from "@/hooks/use-dynamic-context";
// import {createClient} from "@/lib/supabase/client";
//
//
// export default function EditorFooter() {
//     const inputRef = useRef(null);
//     const [uploads, setUploads] = useState([]);
//     const { state } = useDynamicContext();
//     const triggerUpload = () => inputRef.current?.click();
//
//     const uploadFile = async (bucket, path, file, token) => {
//         const url = `http://kurrier-supabase.orb.local/storage/v1/object/${bucket}/${path}`;
//
//         return new Promise((resolve, reject) => {
//             const xhr = new XMLHttpRequest();
//             xhr.open("POST", url);
//             xhr.setRequestHeader("Authorization", `Bearer ${token}`);
//             xhr.setRequestHeader("x-upsert", "true");
//
//             xhr.upload.onprogress = (evt) => {
//                 if (evt.lengthComputable) {
//                     const pct = Math.round((evt.loaded / evt.total) * 100);
//                     console.log(`Uploading ${path}: ${pct}%`);
//
//                     setUploads((prev) =>
//                         prev.map((u) =>
//                             u.path === path ? { ...u, progress: pct } : u
//                         )
//                     );
//                 }
//             };
//
//             xhr.onload = () => {
//                 if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
//                 else reject(xhr.responseText);
//             };
//             xhr.onerror = () => reject("network error");
//             xhr.send(file);
//         });
//     };
//
//     const onFileSelect = async (event) => {
//         if (!event.target.files) return;
//
//         const supabase = createClient(state.publicConfig)
//         const { data } = await supabase.auth.getSession();
//         const token = data.session?.access_token;
//         if (!token) {
//             alert("No auth session");
//             return;
//         }
//
//         const bucket = "attachments";
//
//         Array.from(event.target.files).forEach((file) => {
//             const path = `/private/${data.session.user.id}/${Date.now()}-${file.name}`;
//             setUploads((prev) => [...prev, { name: file.name, path, progress: 0 }]);
//
//             uploadFile(bucket, path, file, token)
//                 .then(() =>
//                     setUploads((prev) =>
//                         prev.map((u) =>
//                             u.path === path ? { ...u, progress: 100 } : u
//                         )
//                     )
//                 )
//                 .catch((err) =>
//                     setUploads((prev) =>
//                         prev.map((u) =>
//                             u.path === path ? { ...u, error: err } : u
//                         )
//                     )
//                 );
//         });
//
//         event.target.value = "";
//     };
//
//     return (
//         <>
//             <div className="border p-2">
//                 {uploads.map((u) => (
//                     <div key={u.path}>
//                         {u.name} - {u.progress}%
//                         {u.error && <span style={{ color: "red" }}> failed</span>}
//                     </div>
//                 ))}
//             </div>
//
//             <button type={"button"} onClick={triggerUpload}>Attach</button>
//             <input ref={inputRef} type="file" multiple hidden onChange={onFileSelect} />
//         </>
//     );
// }



// import React, {useRef} from "react";
// import { ActionIcon, Button, Popover } from "@mantine/core";
// import {Baseline, Paperclip} from "lucide-react";
// import { RichTextEditor } from "@mantine/tiptap";
// import { useDynamicContext } from "@/hooks/use-dynamic-context";
// import {createClient} from "@/lib/supabase/client";
//
// function EditorFooter() {
// 	const { state } = useDynamicContext();
//     const inputRef = useRef<HTMLInputElement | null>(null);
//
//     const triggerUpload = async () => {
//         inputRef?.current?.click()
//
//     };
//
//     const onFileSelect = async (
//         event: React.ChangeEvent<HTMLInputElement>
//     ): Promise<void> => {
//         if (!event.target.files) return;
//         console.log("event", event.target.files);
//         const avatarFile = event.target.files[0]
//         const supabase = createClient(state.publicConfig)
//         // Use the JS library to create a bucket.
//
//         // const { data, error } = await supabase.storage.createBucket('avatars', {
//         //     public: true, // default: false
//         //     fileSizeLimit: '500MB',
//         // })
//         // console.log("data, error", data, error)
//
//         const session = await supabase.auth.getSession()
//         console.log("supabase", session.data.session.user.id)
//         const { data, error } = await supabase
//             .storage
//             .from('attachments')
//             .upload(`private/${session.data.session.user.id}/stuff.dmg`, avatarFile, {
//                 cacheControl: '3600',
//                 upsert: false
//             })
//         console.log("data, error", data, error)
//     };
//
// 	return (
// 		<>
//             <div className={"w-full border flex flex-col"}>
//                 Atttachments will go here
//             </div>
// 			<div className={"border-t items-center flex py-2"}>
// 				<div className={"mx-2"}>
// 					<Button
// 						loading={!!state.isPending}
// 						size={"xs"}
// 						radius={"xl"}
// 						type={"submit"}
// 					>
// 						Send
// 					</Button>
// 				</div>
//
// 				<Popover position="top-start" withArrow shadow="md">
// 					<Popover.Target>
// 						<ActionIcon variant={"transparent"}>
// 							<Baseline />
// 						</ActionIcon>
// 					</Popover.Target>
// 					<Popover.Dropdown className={"!p-0"}>
// 						<RichTextEditor.Toolbar
// 							sticky
// 							stickyOffset={60}
// 							className={"!border-0"}
// 						>
// 							<RichTextEditor.ControlsGroup>
// 								<RichTextEditor.Bold />
// 								<RichTextEditor.Italic />
// 								<RichTextEditor.Underline />
// 								<RichTextEditor.Strikethrough />
// 								<RichTextEditor.ClearFormatting />
// 							</RichTextEditor.ControlsGroup>
//
// 							<RichTextEditor.ControlsGroup>
// 								<RichTextEditor.BulletList />
// 								<RichTextEditor.OrderedList />
// 							</RichTextEditor.ControlsGroup>
//
// 							<RichTextEditor.ControlsGroup>
// 								<RichTextEditor.Undo />
// 								<RichTextEditor.Redo />
// 							</RichTextEditor.ControlsGroup>
// 						</RichTextEditor.Toolbar>
// 					</Popover.Dropdown>
// 				</Popover>
//
//                 <ActionIcon onClick={triggerUpload} variant={"transparent"} className={"mx-2"}>
//                     <input onChange={onFileSelect} ref={inputRef} type={"file"} className={"hidden"}/>
//                     <Paperclip size={18} />
//                 </ActionIcon>
// 			</div>
//
//
// 		</>
// 	);
// }
//
// export default EditorFooter;
