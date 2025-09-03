import {emailsTable} from "@db-package/src/drizzle/schema";

export type EmailEntity   = typeof emailsTable.$inferSelect;
export type EmailCreate   = typeof emailsTable.$inferInsert;
export type EmailUpdate   = Partial<EmailCreate>;
