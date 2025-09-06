import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from "postgres";
import {getServerEnv} from "@schema";

const {DATABASE_URL} = getServerEnv()

const client = postgres(String(DATABASE_URL), { prepare: false })
const db = drizzle({ client });

export * from './drizzle/drizzle-client';
export * from './drizzle/vault';
export {db};
