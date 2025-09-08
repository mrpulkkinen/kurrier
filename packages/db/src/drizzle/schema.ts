import {
	pgTable,
	uuid,
	text,
	timestamp,
	pgPolicy,
	varchar,
	boolean,
	pgEnum,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./supabase-schema";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { sql } from "drizzle-orm";
import { providersList } from "@schema";

export const ProviderKindEnum = pgEnum("provider_kind", providersList);

export const secretsMeta = pgTable(
	"secrets_meta",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		ownerId: uuid("owner_id")
			.references(() => users.id)
			.notNull()
			.default(sql`auth.uid()`),
		name: text("name").notNull(),
		description: text("description"),
		vaultSecret: uuid("vault_secret").notNull(),
	},
	(t) => [
		pgPolicy("select_own", {
			for: "select",
			to: authenticatedRole,
			using: sql`${t.ownerId} = ${authUid}`,
		}),
		pgPolicy("insert_own", {
			for: "insert",
			to: authenticatedRole,
			withCheck: sql`${t.ownerId} = ${authUid}`,
		}),
		pgPolicy("update_own", {
			for: "update",
			to: authenticatedRole,
			using: sql`${t.ownerId} = ${authUid}`,
			withCheck: sql`${t.ownerId} = ${authUid}`,
		}),
		pgPolicy("delete_own", {
			for: "delete",
			to: authenticatedRole,
			using: sql`${t.ownerId} = ${authUid}`,
		}),
	],
).enableRLS();

export const providers = pgTable(
	"providers",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		ownerId: uuid("owner_id")
			.references(() => users.id)
			.notNull()
			.default(sql`auth.uid()`),
		type: ProviderKindEnum("type").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("uniq_provider_per_user").on(t.ownerId, t.type),
		pgPolicy("providers_select_own", {
			for: "select",
			to: authenticatedRole,
			using: sql`${t.ownerId} = ${authUid}`,
		}),
		pgPolicy("providers_insert_own", {
			for: "insert",
			to: authenticatedRole,
			withCheck: sql`${t.ownerId} = ${authUid}`,
		}),
		pgPolicy("providers_update_own", {
			for: "update",
			to: authenticatedRole,
			using: sql`${t.ownerId} = ${authUid}`,
			withCheck: sql`${t.ownerId} = ${authUid}`,
		}),
		pgPolicy("providers_delete_own", {
			for: "delete",
			to: authenticatedRole,
			using: sql`${t.ownerId} = ${authUid}`,
		}),
	],
).enableRLS();

export const providerSecrets = pgTable(
	"provider_secrets",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		providerId: uuid("provider_id")
			.references(() => providers.id, { onDelete: "cascade" })
			.notNull(),
		secretId: uuid("secret_id")
			.references(() => secretsMeta.id, { onDelete: "cascade" })
			.notNull(),
		keyName: varchar("key_name", { length: 120 }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		// 🔐 one key per provider
		uniqueIndex("uniq_provider_key").on(t.providerId, t.keyName),

		pgPolicy("provsec_select_own", {
			for: "select",
			to: authenticatedRole,
			using: sql`
        exists (
          select 1 from ${providers} p
          where p.id = ${t.providerId}
            and p.owner_id = ${authUid}
        )
      `,
		}),
		pgPolicy("provsec_insert_own", {
			for: "insert",
			to: authenticatedRole,
			withCheck: sql`
        exists (
          select 1 from ${providers} p
          where p.id = ${t.providerId}
            and p.owner_id = ${authUid}
        )
        and exists (
          select 1 from ${secretsMeta} s
          where s.id = ${t.secretId}
            and s.owner_id = ${authUid}
        )
      `,
		}),
		pgPolicy("provsec_update_own", {
			for: "update",
			to: authenticatedRole,
			using: sql`
        exists (
          select 1 from ${providers} p
          where p.id = ${t.providerId}
            and p.owner_id = ${authUid}
        )
      `,
			withCheck: sql`
        exists (
          select 1 from ${providers} p
          where p.id = ${t.providerId}
            and p.owner_id = ${authUid}
        )
        and exists (
          select 1 from ${secretsMeta} s
          where s.id = ${t.secretId}
            and s.owner_id = ${authUid}
        )
      `,
		}),
		pgPolicy("provsec_delete_own", {
			for: "delete",
			to: authenticatedRole,
			using: sql`
        exists (
          select 1 from ${providers} p
          where p.id = ${t.providerId}
            and p.owner_id = ${authUid}
        )
      `,
		}),
	],
).enableRLS();

// export const providerSecrets = pgTable(
// 	"provider_secrets",
// 	{
// 		id: uuid("id").defaultRandom().primaryKey(),
// 		providerId: uuid("provider_id")
// 			.references(() => providers.id, { onDelete: "cascade" })
// 			.notNull(),
// 		secretId: uuid("secret_id")
// 			.references(() => secretsMeta.id, { onDelete: "cascade" })
// 			.notNull(),
// 		keyName: varchar("key_name", { length: 120 }).notNull(),
// 		createdAt: timestamp("created_at", { withTimezone: true })
// 			.defaultNow()
// 			.notNull(),
// 		updatedAt: timestamp("updated_at", { withTimezone: true })
// 			.defaultNow()
// 			.notNull(),
// 	},
// 	(t) => [
// 		pgPolicy("provsec_select_own", {
// 			for: "select",
// 			to: authenticatedRole,
// 			using: sql`
//         exists (
//           select 1
//           from ${providers} p
//           where p.id = ${t.providerId}
//             and p.owner_id = ${authUid}
//         )
//       `,
// 		}),
//
// 		// INSERT: must own the provider AND own the secret being linked
// 		pgPolicy("provsec_insert_own", {
// 			for: "insert",
// 			to: authenticatedRole,
// 			withCheck: sql`
//         exists (
//           select 1
//           from ${providers} p
//           where p.id = ${t.providerId}
//             and p.owner_id = ${authUid}
//         )
//         and exists (
//           select 1
//           from ${secretsMeta} s
//           where s.id = ${t.secretId}
//             and s.owner_id = ${authUid}
//         )
//       `,
// 		}),
//
// 		// UPDATE: same ownership checks
// 		pgPolicy("provsec_update_own", {
// 			for: "update",
// 			to: authenticatedRole,
// 			using: sql`
//         exists (
//           select 1
//           from ${providers} p
//           where p.id = ${t.providerId}
//             and p.owner_id = ${authUid}
//         )
//       `,
// 			withCheck: sql`
//         exists (
//           select 1
//           from ${providers} p
//           where p.id = ${t.providerId}
//             and p.owner_id = ${authUid}
//         )
//         and exists (
//           select 1
//           from ${secretsMeta} s
//           where s.id = ${t.secretId}
//             and s.owner_id = ${authUid}
//         )
//       `,
// 		}),
//
// 		// DELETE: must own the provider
// 		pgPolicy("provsec_delete_own", {
// 			for: "delete",
// 			to: authenticatedRole,
// 			using: sql`
//         exists (
//           select 1
//           from ${providers} p
//           where p.id = ${t.providerId}
//             and p.owner_id = ${authUid}
//         )
//       `,
// 		}),
// 	],
// ).enableRLS();

export const emailsTable = pgTable("emails", {
	id: uuid().defaultRandom().primaryKey(),
	user_id: uuid("user_id")
		.references(() => users.id)
		.notNull(),
	created: timestamp("created", { mode: "string", withTimezone: true })
		.defaultNow()
		.notNull(),
});
