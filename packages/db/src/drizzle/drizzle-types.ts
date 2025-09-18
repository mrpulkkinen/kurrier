import { providers, smtpAccounts, identities } from "./schema";
import { decryptedSecrets } from "./supabase-schema";
import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// export type EmailEntity = typeof emailsTable.$inferSelect;
// export type EmailCreate = typeof emailsTable.$inferInsert;
// export type EmailUpdate = Partial<EmailCreate>;

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

// export type IdentityCreate = z.infer<typeof IdentityInsertSchema>;

export type DecryptedEntity = typeof decryptedSecrets.$inferSelect;

export const ProviderSchema = createSelectSchema(providers);
export const SMTPAccountSchema = createSelectSchema(smtpAccounts);

export const CommonProviderEntitySchema = z.union([
	ProviderSchema,
	SMTPAccountSchema,
]);
export type CommonProviderEntity = z.infer<typeof CommonProviderEntitySchema>;
