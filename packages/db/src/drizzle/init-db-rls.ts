// import { drizzle } from "drizzle-orm/postgres-js";
// import postgres from "postgres";
// import { getServerEnv } from "@schema";
//
//
// declare global {
//     var _db_rls: ReturnType<typeof drizzle> | undefined;
// }
//
// const createDb = ((url) => {
//
//     const { DATABASE_RLS_URL } = getServerEnv();
//
//     return () => {
//         if (!global._db_rls) {
//             const client = postgres(String(DATABASE_RLS_URL), { prepare: false });
//             global._db_rls = drizzle(client);
//         }
//         return global._db_rls;
//     };
// })();
//
// export const db_rls = createDb()
