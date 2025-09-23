import { z } from "zod";
import isFQDN from "validator/lib/isFQDN";
import isEmail from "validator/lib/isEmail";
import {messageStatesList} from "./mail";

const cleanKV = <T extends Record<string, unknown>>(obj: T) =>
	Object.fromEntries(
		Object.entries(obj ?? {}).filter(([, v]) => v !== "" && v != null),
	) as Record<string, string>;

export const SmtpAccountFormSchema = z.object({
	ulid: z.string().min(1, "ULID is required"),

	secretId: z.string().optional().nullable(),
	accountId: z.string().optional().nullable(),

	label: z.string().trim().min(1, "Account label is required"),

	// Explicitly pass keyType + valueType to avoid overload confusion
	required: z
		.record(z.string(), z.union([z.string(), z.null()]))
		.optional()
		.default({})
		.transform(cleanKV),

	optional: z
		.record(z.string(), z.union([z.string(), z.null()]))
		.optional()
		.default({})
		.transform(cleanKV),
});

const isDomain = (s: string) =>
	isFQDN(s, {
		require_tld: true,
		allow_underscores: false,
		allow_trailing_dot: false,
		allow_numeric_tld: true,
		allow_wildcard: false,
	});

const isSubdomain = (s: string) =>
	isFQDN(s, {
		// subdomain can be like "mail.example.com" or just "mail"
		require_tld: false,
		allow_underscores: false,
		allow_trailing_dot: false,
		allow_numeric_tld: true,
		allow_wildcard: false,
	});

export const DomainIdentityFormSchema = z.object({
	providerOption: z.string().min(1, "Provider selection is required"),

	value: z
		.string()
		.min(1, "Domain name is required")
		.refine(isDomain, { message: "Must be a valid domain (e.g. example.com)" }),

	providerId: z.string().optional().nullable(),

	kind: z.literal("domain"),

	mailFromSubdomain: z
		.string()
		.trim()
		.optional()
		.refine((v) => !v || isSubdomain(v), {
			message: "Must be a valid subdomain (e.g. mail.example.com or mail)",
		}),

	incomingDomain: z.enum(["true", "false"]).optional(),
});

export const ProviderAccountFormSchema = z.object({
	ulid: z.string().min(1, "ULID is required"),
	providerId: z.string().min(1, "ProviderId is required"),

	// Required env vars: dynamic object of string values
	required: z.record(z.string(), z.string().min(1, "Value is required")),
});



// export const MessageFormSchema = z.object({
//     mailboxId: z.string("Mailbox ID must be a valid UUID"),
//     subject: z.string().optional(),
//     snippet: z.string().optional(),
//     fromName: z.string().optional(),
//     fromEmail: z.string().refine((val) => !val || isEmail(val), { message: "Must be a valid email" }).optional(),
//     to: z.array(
//             z.object({name: z.string().optional(), email: z.string().refine((val) => isEmail(val), { message: "Invalid email in 'to'" }),}),
//         )
//         .optional(),
//     cc: z
//         .array(
//             z.object({
//                 name: z.string().optional(),
//                 email: z
//                     .string()
//                     .refine((val) => isEmail(val), { message: "Invalid email in 'cc'" }),
//             }),
//         )
//         .optional(),
//
//     bcc: z
//         .array(
//             z.object({
//                 name: z.string().optional(),
//                 email: z
//                     .string()
//                     .refine((val) => isEmail(val), { message: "Invalid email in 'bcc'" }),
//             }),
//         )
//         .optional(),
//
//     date: z.coerce.date().optional(),
//
//     sizeBytes: z.number().int().nonnegative().optional(),
//
//     seen: z.boolean().default(false),
//     answered: z.boolean().default(false),
//     flagged: z.boolean().default(false),
//     draft: z.boolean().default(false),
//     hasAttachments: z.boolean().default(false),
//
//     state: z.enum(messageStatesList).default("normal"),
//
//     headersJson: z.record(z.string(), z.string()).optional(),
//
//     rawStorageKey: z.string().optional(),
// });

export type ProviderAccountFormData = z.infer<typeof ProviderAccountFormSchema>;
export type DomainIdentityFormData = z.infer<typeof DomainIdentityFormSchema>;
export type SmtpAccountFormData = z.infer<typeof SmtpAccountFormSchema>;
// export type MessageFormData = z.infer<typeof MessageFormSchema>;
