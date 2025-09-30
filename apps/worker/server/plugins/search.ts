import { defineNitroPlugin } from 'nitropack/runtime';
import {db, messages} from '@db';
import {fromAddress, fromName, ToSearchDocInput} from '@schema';
import Typesense from 'typesense';
import { getServerEnv, messagesSearchSchema } from '@schema';

const {
    TYPESENSE_API_KEY,
    TYPESENSE_PORT,
    TYPESENSE_PROTOCOL,
    TYPESENSE_HOST,
} = getServerEnv();

const REBUILD_COLLECTION = false;

const BATCH_SIZE = 2000;

const client = new Typesense.Client({
    nodes: [{ host: TYPESENSE_HOST, port: Number(TYPESENSE_PORT), protocol: TYPESENSE_PROTOCOL }],
    apiKey: TYPESENSE_API_KEY,
});

import type { AddressObjectJSON, EmailAddressJSON } from "@schema";

const uniq = <T,>(arr: T[]) => [...new Set(arr)];

function normalizeEmail(e?: string | null): string | null {
    if (!e) return null;
    // lower-case + trim angle-brackets/quotes if any leaked in
    const s = String(e).trim().toLowerCase().replace(/[<>\s]+/g, "");
    return s || null;
}

function flattenEmails(list?: EmailAddressJSON[]): string[] {
    if (!list?.length) return [];
    const out: string[] = [];
    for (const item of list) {
        if (item.address) out.push(item.address);
        if (item.group?.length) out.push(...flattenEmails(item.group));
    }
    return out;
}

function emailsFromAddressObj(obj?: AddressObjectJSON | null): string[] {
    if (!obj) return [];
    return flattenEmails(obj.value);
}

/** Collects *all* participant email addresses from from/to/cc/bcc */
export function collectParticipants(
    from: AddressObjectJSON | null,
    to: AddressObjectJSON | null,
    cc: AddressObjectJSON | null,
    bcc: AddressObjectJSON | null
): string[] {
    const candidates = [
        ...emailsFromAddressObj(from),
        ...emailsFromAddressObj(to),
        ...emailsFromAddressObj(cc),
        ...emailsFromAddressObj(bcc),
    ]
        .map(normalizeEmail)
        .filter((x): x is string => Boolean(x));

    return uniq(candidates);
}

export function emailDomain(email?: string | null) {
    if (!email) return "";
    const m = String(email).toLowerCase().match(/@([^> ]+)/);
    return m?.[1] ?? "";
}


function toSearchDoc(msg: ToSearchDocInput) {
    const participants = collectParticipants(msg.from ?? null, msg.to ?? null, msg.cc ?? null, msg.bcc ?? null);

    const fromEmail = (msg.fromEmail ?? "").toLowerCase();
    const createdAtMs = msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now();
    const lastInThreadAtMs = msg.lastInThreadAt ? new Date(msg.lastInThreadAt).getTime() : createdAtMs;

    return {
        id: msg.id,
        ownerId: msg.ownerId,
        mailboxId: msg.mailboxId,
        threadId: msg.threadId,

        subject: msg.subject ?? "",
        snippet: (msg.text ?? "").slice(0, 200),
        text: msg.text ?? "",
        html: msg.html ?? "",

        fromName: msg.fromName ?? "",
        fromEmail,
        fromDomain: emailDomain(fromEmail),

        participants,                         // string[]
        labels: (msg.labels ?? []).map((l) => l.toLowerCase()),

        hasAttachment: msg.hasAttachments ? 1 : 0,
        unread: msg.seen ? 0 : 1,

        sizeBytes: Number(msg.sizeBytes ?? 0),

        createdAt: createdAtMs,
        lastInThreadAt: lastInThreadAtMs,
    };
}

export default defineNitroPlugin(async () => {
    console.log("[typesense] boot");

    // try { await client.collections("messages").delete(); } catch {}
    // await client.collections().create(messagesSearchSchema);

    if (REBUILD_COLLECTION) {
        try { await client.collections("messages").delete(); } catch {}
        await client.collections().create(messagesSearchSchema);
        console.log("[typesense] created collection messages");
    } else {
        try { await client.collections("messages").retrieve(); }
        catch {
            await client.collections().create(messagesSearchSchema);
            console.log("[typesense] created collection messages");
        }
    }

    let offset = 0;
    let imported = 0;

    while (true) {
        const batch = await db.select().from(messages).limit(BATCH_SIZE).offset(offset);
        if (batch.length === 0) break;

        const docs = batch.map((m) =>
            toSearchDoc({
                id: m.id,
                ownerId: m.ownerId,
                mailboxId: m.mailboxId,
                threadId: m.threadId,

                subject: m.subject,
                text: m.text,
                html: m.html,

                // `fromAddress` / `fromName` are your existing helpers
                fromName: fromName(m),
                fromEmail: fromAddress(m),

                from: m.from,
                to: m.to,
                cc: m.cc,
                bcc: m.bcc,

                hasAttachments: m.hasAttachments,
                seen: m.seen,
                sizeBytes: m.sizeBytes,

                createdAt: m.date,
                lastInThreadAt: m.date,

                labels: [], // fill if you track them
            })
        );

        const result = await client.collections("messages").documents().import(docs, { action: "upsert" });
        const failed = result.filter((r: any) => r.success !== true);
        if (failed.length) console.warn("[typesense] some docs failed", failed.slice(0, 5));

        imported += docs.length;
        offset += BATCH_SIZE;
        console.log(`[typesense] upserted ${imported}`);
    }

    console.log("[typesense] indexing done");
});

