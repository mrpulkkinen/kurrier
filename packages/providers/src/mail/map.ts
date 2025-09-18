// packages/providers/mail/map.ts
import { SMTP_SPEC } from "@schema";
import {SmtpVerifyInput} from "../core";
// import type { SmtpVerifyInput } from "./smtp-schema";

/**
 * Coerces a truthy string to boolean.
 */
const truthy = new Set(["true", "1", "yes", "y", "on", "t"]);
const toBool = (v: unknown) =>
    typeof v === "boolean" ? v : truthy.has(String(v ?? "").toLowerCase());

/**
 * Given any env-like object (vault JSON, form data map, process.env),
 * build the normalized SMTP verify config using the spec from @schema.
 *
 * We only use the fields needed to verify; extra optional fields are ignored.
 */
// export function smtpEnvToVerifyInput(envLike: Record<string, unknown>): SmtpVerifyInput {
//     // Pull out the canonical keys from your @schema spec:
//     const [
//         HOST,
//         PORT,
//         USER,
//         PASS,
//     ] = SMTP_SPEC.requiredEnv;
//
//     const SECURE = "SMTP_SECURE"; // inside optionalEnv, but we know the name
//
//     const host = String(envLike[HOST] ?? "");
//     const port = Number(envLike[PORT] ?? 587);
//     const user = String(envLike[USER] ?? "");
//     const pass = String(envLike[PASS] ?? "");
//     const secure = envLike[SECURE] == null ? undefined : toBool(envLike[SECURE]);
//
//     return {
//         host,
//         port,
//         secure,
//         auth: { user, pass },
//     };
// }
