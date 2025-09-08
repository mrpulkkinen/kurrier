import { emailsTable, providers } from "./schema";
import {decryptedSecrets} from "./supabase-schema";

export type EmailEntity = typeof emailsTable.$inferSelect;
export type EmailCreate = typeof emailsTable.$inferInsert;
export type EmailUpdate = Partial<EmailCreate>;


export type ProviderEntity = typeof providers.$inferSelect;
export type ProviderCreate = typeof providers.$inferInsert;
export type ProviderUpdate = Partial<ProviderCreate>;

export type DecryptedEntity = typeof decryptedSecrets.$inferSelect;
