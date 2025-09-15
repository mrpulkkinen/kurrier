import {z} from "zod";


export const identityTypesList = [
    "domain",
    "email"
] as const;
export const identityStatusList = [
    "unverified",
    "pending",
    "verified",
    "failed",
] as const;
export const IdentitesEnum = z.enum(identityTypesList);
export type Identities = z.infer<typeof IdentitesEnum>;
