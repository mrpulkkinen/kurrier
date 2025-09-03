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

const authSchema = pgSchema('auth');
const storageSchema = pgSchema('storage');

export const users = authSchema.table('users', {
    id: uuid('id').primaryKey(),
    email: varchar(),
    raw_user_meta_data: jsonb(),
});

export const objects = storageSchema.table('objects', {
    id: uuid('id').primaryKey(),
    name: text(),
});


