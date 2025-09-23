import { z } from "zod";

export const mailboxKindsList = [
	"inbox",
	"sent",
	"drafts",
	"archive",
	"spam",
	"trash",
	"outbox",
	"custom",
] as const;

export const MailboxKindEnum = z.enum(mailboxKindsList);
export type MailboxKind = z.infer<typeof MailboxKindEnum>;

export const MailboxKindDisplay: Record<MailboxKind, string> = {
	inbox: "Inbox",
	sent: "Sent",
	drafts: "Drafts",
	archive: "Archive",
	spam: "Spam",
	trash: "Trash",
	outbox: "Outbox",
	custom: "Custom Folder",
};

//
// Message states
//
export const messageStatesList = [
	"normal",
	"bounced",
	"queued",
	"failed",
] as const;

export const MessageStateEnum = z.enum(messageStatesList);
export type MessageState = z.infer<typeof MessageStateEnum>;

export const MessageStateDisplay: Record<MessageState, string> = {
	normal: "Normal",
	bounced: "Bounced",
	queued: "Queued",
	failed: "Failed",
};

// export const DEFAULT_MAILBOXES: Array<{ kind: (typeof mailboxKindsList)[number]; isDefault: boolean }> = [
//     { kind: "inbox", isDefault: true },
//     { kind: "sent", isDefault: true },
//     { kind: "drafts", isDefault: true },
//     { kind: "archive", isDefault: false },
//     { kind: "spam", isDefault: false },
//     { kind: "trash", isDefault: false },
//     { kind: "outbox", isDefault: false },
// ];

export const SYSTEM_MAILBOXES: Array<{
	kind: MailboxKind;
	isDefault: boolean;
}> = [
	{ kind: "inbox", isDefault: true }, // entrypoint
	{ kind: "sent", isDefault: false },
	{ kind: "drafts", isDefault: false },
	{ kind: "trash", isDefault: false },
	{ kind: "spam", isDefault: false },
	{ kind: "archive", isDefault: false },
	{ kind: "outbox", isDefault: false },
];
