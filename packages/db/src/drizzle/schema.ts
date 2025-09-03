import {
    pgTable,
    jsonb,
    uuid,
    date,
    varchar,
    text,
    boolean,
    integer,
    pgSchema,
    numeric,
    timestamp, time, pgEnum, vector, index,
} from "drizzle-orm/pg-core";
import {users} from "@db-package/src/drizzle/supabase-schema";

export const emailsTable = pgTable("emails", {
    id: uuid().defaultRandom().primaryKey(),
    user_id: uuid('user_id').references(() => users.id).notNull(),
    created: timestamp('created', { mode: "string", withTimezone: true }).defaultNow().notNull(),
}).enableRLS();
