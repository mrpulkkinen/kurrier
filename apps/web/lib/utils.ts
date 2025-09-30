import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FetchDecryptedSecretsResult } from "@/lib/actions/dashboard";
import { MessageEntity } from "@db";
import { AddressObjectJSON } from "@schema";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formDataToJson(formData: FormData) {
	const data = {} as any;
	formData.forEach((value, key) => {
		if (data[key]) {
			data[key] = Array.isArray(data[key])
				? [...data[key], value]
				: [data[key], value];
		} else {
			data[key] = value;
		}
	});
	return data;
}

export function parseSecret(
	obj?: FetchDecryptedSecretsResult[number] | null,
): Record<string, any> {
	return obj?.vault?.decrypted_secret
		? JSON.parse(obj.vault.decrypted_secret)
		: {};
}

export const toArray = (v: string | string[] | undefined | null) =>
	(Array.isArray(v) ? v : String(v ?? "").split(","))
		.map((s) => s.trim())
		.filter(Boolean);

// export const fromName = (message: MessageEntity) => {
// 	const from: AddressObjectJSON | string = message.from as any;
//
// 	if (!from) return null;
//
// 	if (typeof from === "string") {
// 		// string form has no display name, return just the email part before @ if you want
// 		return from.split("@")[0] ?? null;
// 	}
//
// 	// object form with parsed name
// 	return from.value?.[0]?.name ?? null;
// };
//
// export const fromAddress = (message: MessageEntity) => {
// 	const from: AddressObjectJSON = message.from as any;
//
// 	if (!from) return null;
//
// 	if (typeof from === "string") {
// 		return from;
// 	}
//
// 	// object form with parsed email
// 	return from.value?.[0]?.address ?? null;
// };
