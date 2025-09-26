// // /server/plugins/imap-worker.ts
// import { defineNitroPlugin } from "nitropack/runtime";
// import { ImapFlow, type FetchMessageObject } from "imapflow";
//
// // ---- tune these knobs -------------------------------------------------------
// const MAILBOX = "INBOX";
// const WINDOW = 500;             // backfill batch size (200–1000 is typical)
// const BOOTSTRAP_TARGET = 1000;  // how many newest to fetch quickly for instant UX
// const IDLE_PAUSE_MS = 25;       // small yields between chunks
// // -----------------------------------------------------------------------------
//
// type Phase = "BOOTSTRAP" | "BACKFILL" | "IDLE";
//
// interface Cursors {
//     uidValidity?: number;
//     highestModSeq?: bigint | null;
//     lastSeenUid: number;         // highest UID fully stored
//     backfillCursorUid: number;   // next "oldest" UID to fetch down towards 1
//     phase: Phase;
//     updatedAt: number;
// }
//
// // TODO: replace with your DB
// const mem: Record<string, Cursors> = {};
// async function loadCursors(identity: string): Promise<Cursors | null> {
//     return mem[identity] ?? null;
// }
// async function saveCursors(identity: string, cur: Partial<Cursors>) {
//     mem[identity] = { ...(mem[identity] || {
//             lastSeenUid: 0,
//             backfillCursorUid: 0,
//             phase: "BOOTSTRAP" as Phase,
//             highestModSeq: null,
//         }), ...cur, updatedAt: Date.now() } as Cursors;
// }
//
// // TODO: replace with your storage/indexer
// async function storeMessage(_identity: string, msg: FetchMessageObject) {
//     // Example: persist raw EML + index fields
//     // const source = await streamToString(msg.source!);
//     // await saveToSupabase(msg.uid!, source, msg.envelope, msg.flags, ...);
// }
//
// // Small helper: give event loop a breath
// const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
//
// export default defineNitroPlugin(async (nitroApp) => {
//     // Prefer env vars, the values below are only placeholders
//     const host = process.env.IMAP_HOST || "mail.betalab.in";
//     const port = Number(process.env.IMAP_PORT || 993);
//     const secure = process.env.IMAP_SECURE !== "false";
//     const user = process.env.IMAP_USER || "krishna@betalab.in";
//     const pass = process.env.IMAP_PASS || "REPLACE_ME"; // <-- set via env
//
//     const identity = `${user}:${MAILBOX}`; // key for cursors
//     const client = new ImapFlow({
//         host,
//         port,
//         secure,
//         auth: { user, pass },
//         logger: false,
//     });
//
//     let phase: Phase = "BOOTSTRAP";
//     let pauseForDelta = false;
//     let backfillInFlight = false;
//
//     nitroApp.hooks.hook("close", async () => {
//         try {
//             await client.logout().catch(() => {});
//         } catch {}
//     });
//
//     // Allow other server code to "poke" this worker to fetch deltas immediately:
//     //   await nitroApp.hooks.callHook("kurrier:mail:poke", { identity })
//     nitroApp.hooks.hook("kurrier:mail:poke", (p?: { identity?: string }) => {
//         if (!p || p.identity === identity) {
//             pauseForDelta = true;
//         }
//     });
//
//     // Connect + open mailbox
//     await client.connect();
//
//     // Ensure mailbox open & read baseline status
//     const box = await client.mailboxOpen(MAILBOX, { readOnly: false });
//     const { uidValidity, uidNext, highestModSeq } = box;
//
//     // Load/initialize cursors
//     const existing = await loadCursors(identity);
//     if (existing && existing.uidValidity && existing.uidValidity !== uidValidity) {
//         // Server reset for mailbox; local cache invalid
//         await saveCursors(identity, {
//             uidValidity,
//             highestModSeq: highestModSeq ?? null,
//             lastSeenUid: 0,
//             backfillCursorUid: (uidNext || 1) - 1,
//             phase: "BOOTSTRAP",
//         });
//     } else if (!existing) {
//         await saveCursors(identity, {
//             uidValidity,
//             highestModSeq: highestModSeq ?? null,
//             lastSeenUid: 0,
//             backfillCursorUid: (uidNext || 1) - 1,
//             phase: "BOOTSTRAP",
//         });
//     }
//
//     let cursors = (await loadCursors(identity))!;
//     phase = cursors.phase;
//
//     // If server supports CONDSTORE/QRESYNC, we can track flag changes efficiently
//     // (ImapFlow enables CONDSTORE automatically; QRESYNC requires extra open opts)
//
//     // Announce new mail (optional): wire to your Realtime channel/websocket
//     const broadcast = (evt: any) => {
//         // e.g., push to Supabase Realtime or an in-memory event bus
//         // console.log("broadcast", evt);
//     };
//
//     // When server indicates new mail, prioritize delta fetch
//     client.on("exists", () => { pauseForDelta = true; });
//     client.on("mail", () => { pauseForDelta = true; });
//     client.on("expunge", () => { pauseForDelta = true; });
//     client.on("flags", () => { pauseForDelta = true; });
//
//     async function fetchWindowByUid(start: number, end: number) {
//         // ImapFlow fetch UID range with string like "100:200"
//         const range = `${start}:${end}`;
//         for await (const msg of client.fetch({ uid: range }, {
//             uid: true,
//             envelope: true,
//             flags: true,
//             source: true, // remove if you only need metadata in backfill to save bandwidth
//         })) {
//             await storeMessage(identity, msg);
//             if (msg.uid && msg.uid > cursors.lastSeenUid) {
//                 cursors.lastSeenUid = msg.uid;
//             }
//         }
//         await saveCursors(identity, { lastSeenUid: cursors.lastSeenUid });
//     }
//
//     async function fetchDeltas() {
//         // Wait for any in-flight backfill chunk to complete
//         while (backfillInFlight) await sleep(10);
//
//         const start = cursors.lastSeenUid + 1;
//         const end = (client.mailbox?.uidNext || start) - 1;
//         if (end < start) return;
//
//         await fetchWindowByUid(start, end);
//         await saveCursors(identity, { lastSeenUid: cursors.lastSeenUid });
//         broadcast({ kind: "new_mail_batch", lastSeenUid: cursors.lastSeenUid });
//     }
//
//     async function bootstrapHead() {
//         phase = "BOOTSTRAP";
//         await saveCursors(identity, { phase });
//
//         let end = (client.mailbox?.uidNext || 1) - 1;
//         let processed = 0;
//
//         while (end > 0 && processed < BOOTSTRAP_TARGET) {
//             const start = Math.max(1, end - Math.min(WINDOW, BOOTSTRAP_TARGET - processed) + 1);
//             await fetchWindowByUid(start, end);
//             processed += end - start + 1;
//             end = start - 1;
//             await saveCursors(identity, { backfillCursorUid: end });
//             // Be responsive to deltas during bootstrap
//             if (pauseForDelta) {
//                 await fetchDeltas();
//                 pauseForDelta = false;
//             }
//             await sleep(IDLE_PAUSE_MS);
//         }
//
//         broadcast({ kind: "mailbox_seeded", lastSeenUid: cursors.lastSeenUid });
//     }
//
//     async function backfillLoop() {
//         phase = "BACKFILL";
//         await saveCursors(identity, { phase });
//
//         while (cursors.backfillCursorUid > 0) {
//             if (pauseForDelta) {
//                 await fetchDeltas();
//                 pauseForDelta = false;
//                 // fall through to continue backfill
//             }
//
//             const end = cursors.backfillCursorUid;
//             const start = Math.max(1, end - WINDOW + 1);
//
//             backfillInFlight = true;
//             await fetchWindowByUid(start, end);
//             backfillInFlight = false;
//
//             cursors.backfillCursorUid = start - 1;
//             await saveCursors(identity, { backfillCursorUid: cursors.backfillCursorUid });
//
//             await sleep(IDLE_PAUSE_MS);
//         }
//
//         phase = "IDLE";
//         await saveCursors(identity, { phase });
//     }
//
//     async function idleLoop() {
//         // Long-lived tailer: wait on server notifications and pick deltas up
//         while (phase === "IDLE") {
//             // If a poke or server signal set the flag, fetch deltas
//             if (pauseForDelta) {
//                 await fetchDeltas();
//                 pauseForDelta = false;
//             }
//             // IDLE returns when the server pokes or timeout happens; loop continues
//             await client.idle();
//         }
//     }
//
//     // ---- Run the worker --------------------------------------------------------
//     await bootstrapHead();
//     await backfillLoop();
//     // Now live tail forever (until server restarts/shutdown hook fires)
//     idleLoop().catch((err) => {
//         console.error("idle loop crashed:", err);
//     });
// });


















import {defineNitroPlugin} from "nitropack/runtime";
import {ImapFlow} from "imapflow";
import {createClient} from "@supabase/supabase-js";
import {getPublicEnv, getServerEnv} from "@schema";
import {db, decryptAdminSecrets, identities, mailboxes, smtpAccountSecrets} from "@db";
import {eq} from "drizzle-orm";

const publicConfig = getPublicEnv()
const serverConfig = getServerEnv()
const supabase = createClient(publicConfig.SUPABASE_DOMAIN, serverConfig.SUPABASE_SERVICE_ROLE_KEY,)



export default defineNitroPlugin(async (nitroApp) => {
    console.log("************************************************************")
    console.log("************************************************************")
    console.log("************************************************************")
    console.log("************************************************************")
    const imapInstances = new Map<string, ImapFlow>();
    const backfillChannel = supabase.channel(`smtp-worker`);
    backfillChannel
        .on(
            "broadcast",
            { event: "backfill" },
            async ({payload}) => {
                console.log("Backfill event received!", payload)
                const client = await initBackfillClient(payload.identityId)
                console.log("client", client)
                if (client?.authenticated && client?.usable) {
                    await startBackfill(client, payload.identityId)
                }

            },
        )
        .on(
            "broadcast",
            { event: "delta" },
            async ({payload}) => {
                console.log("Delta update event received!", payload)
                const client = await initBackfillClient(payload.identityId)
                console.log("client", client)
                if (client?.authenticated && client?.usable) {
                    // await startBackfill(client, payload.identityId)
                }

            },
        )
        .subscribe();


    const startBackfill = async (client: ImapFlow, identityId: string) => {
        const capabilities = client.capabilities;
        if (capabilities.get("CONDSTORE") && capabilities.get("QRESYNC")) {

            const localMailboxes = await db.select().from(mailboxes).where(eq(mailboxes.identityId, identityId))
            console.log("localMailboxes", localMailboxes)

            for await (const mailbox of await client.list()) {
                console.log("mailbox", mailbox)
            }

        }
    };




    const initBackfillClient = async (identityId: string) => {
        console.log("Backfill called for identityId:", identityId)
        if (imapInstances.has(identityId) && imapInstances.get(identityId)?.authenticated && imapInstances.get(identityId)?.usable) {
            console.log("IMAP instance already exists for identityId:", identityId)
            const client = imapInstances.get(identityId);
            return client
        } else {
            const [identity] = await db.select().from(identities).where(eq(
                identities.id, identityId
            ))
            console.log("identity", identity)
            const [secrets] = await decryptAdminSecrets({
                linkTable: smtpAccountSecrets,
                foreignCol: smtpAccountSecrets.accountId,
                secretIdCol: smtpAccountSecrets.secretId,
                ownerId: identity.ownerId,
                parentId: String(identity.smtpAccountId),
            });
            console.log("secrets", secrets)
            const credentials = secrets?.vault?.decrypted_secret
                ? JSON.parse(secrets.vault.decrypted_secret)
                : {}
            console.log("credentials", credentials)
            const client = new ImapFlow({
                host: credentials.IMAP_HOST,
                port: credentials.IMAP_PORT,
                secure: credentials.IMAP_SECURE === 'true' || credentials.IMAP_SECURE === true,
                auth: {
                    user: credentials.IMAP_USERNAME,
                    pass: credentials.IMAP_PASSWORD
                }
            });
            await client.connect()
            imapInstances.set(identity.id, client)
            return client
        }
    };






    nitroApp.hooks.hookOnce("close", async () => {
        // Will run when nitro is closed
        console.log("Closing nitro server...")
        try {
            // await client.logout();
            for (const [identityId, client] of imapInstances) {
                try {
                    await client.logout();
                    console.log(`Logged out from IMAP server for identityId: ${identityId}`);
                } catch (err) {
                    console.error(`Failed to logout cleanly for identityId: ${identityId}`, err);
                }
            }
            console.log("Logged out from IMAP server" );
        } catch (err) {
            console.error("Failed to logout cleanly", err);
        }
        console.log("Task is done!");
    });


})
