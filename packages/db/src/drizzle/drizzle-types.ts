import {
	providers,
	smtpAccounts,
	identities,
	mailboxes,
	messages,
	threads,
	messageAttachments,
} from "./schema";
import { decryptedSecrets } from "./supabase-schema";
import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export type ProviderEntity = typeof providers.$inferSelect;
export type ProviderCreate = typeof providers.$inferInsert;
export type ProviderUpdate = Partial<ProviderCreate>;

export type SMTPAccountEntity = typeof smtpAccounts.$inferSelect;
export type SMTPAccountCreate = typeof smtpAccounts.$inferInsert;
export type SMTPAccountUpdate = Partial<SMTPAccountCreate>;

export type IdentityEntity = typeof identities.$inferSelect;
export type IdentityUpdate = Partial<IdentityCreate>;
export type IdentityCreate = typeof identities.$inferInsert;
export const IdentityInsertSchema = createInsertSchema(identities);
export type IdentityInsert = z.infer<typeof IdentityInsertSchema>;

export type MailboxEntity = typeof mailboxes.$inferSelect;
export type MailboxCreate = typeof mailboxes.$inferInsert;
export type MailboxUpdate = Partial<MailboxCreate>;

export type MessageEntity = typeof messages.$inferSelect;
export type MessageCreate = typeof messages.$inferInsert;
export const MessageInsertSchema = createInsertSchema(messages);
export type MessageUpdate = Partial<MessageCreate>;

export type MessageAttachmentCreate = typeof messageAttachments.$inferInsert;
export type MessageAttachmentEntity = typeof messageAttachments.$inferSelect;

export const ThreadInsertSchema = createInsertSchema(threads);
export const MessageAttachmentInsertSchema =
	createInsertSchema(messageAttachments);

export type DecryptedEntity = typeof decryptedSecrets.$inferSelect;

export const ProviderSchema = createSelectSchema(providers);
export const SMTPAccountSchema = createSelectSchema(smtpAccounts);

export const CommonProviderEntitySchema = z.union([
	ProviderSchema,
	SMTPAccountSchema,
]);
export type CommonProviderEntity = z.infer<typeof CommonProviderEntitySchema>;
