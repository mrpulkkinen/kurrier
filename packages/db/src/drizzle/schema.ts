import {
    pgTable,
    uuid,
    text,
    timestamp, pgPolicy,
} from "drizzle-orm/pg-core";
import {users} from "./supabase-schema";
import {authenticatedRole, authUid} from "drizzle-orm/supabase";
import {sql} from "drizzle-orm";


export const secretsMeta = pgTable("secrets_meta", {
    id: uuid("id").defaultRandom().primaryKey(),
    owner_id: uuid("owner_id").references(() => users.id).notNull().default(sql`auth.uid()`),
    name: text("name").notNull(),
    description: text("description"),
    vaultSecret: uuid("vault_secret").notNull(),
}, (t) => [
    pgPolicy("select_own", { for: "select", to: authenticatedRole, using: sql`${t.owner_id} = ${authUid}` }),
    pgPolicy("insert_own", { for: "insert", to: authenticatedRole, withCheck: sql`${t.owner_id} = ${authUid}` }),
    pgPolicy("update_own", { for: "update", to: authenticatedRole, using: sql`${t.owner_id} = ${authUid}`, withCheck: sql`${t.owner_id} = ${authUid}` }),
    pgPolicy("delete_own", { for: "delete", to: authenticatedRole, using: sql`${t.owner_id} = ${authUid}` }),
]);


export const emailsTable = pgTable("emails", {
    id: uuid().defaultRandom().primaryKey(),
    user_id: uuid('user_id').references(() => users.id).notNull(),
    created: timestamp('created', { mode: "string", withTimezone: true }).defaultNow().notNull(),
})
