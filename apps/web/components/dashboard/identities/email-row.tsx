// import React from 'react';
// import {Loader2, Mail, RefreshCw, Star, Trash2} from "lucide-react";
// import {Badge} from "@/components/ui/badge";
// import {Button} from "@mantine/core";
// import {EmailIdentity} from "@/app/dashboard/(shell)/identities/page";
// import ProviderBadge from "@/components/dashboard/identities/provider-badge";
// import StatusPill from "@/components/dashboard/identities/status-pill";
//
// function EmailRow({
//                       e,
//                       onRetry,
//                       onMakeDefault,
//                       onRemove,
//                       retrying,
//                   }: {
//     e: EmailIdentity;
//     onRetry: (id: string) => void;
//     onMakeDefault: (id: string) => void;
//     onRemove: (id: string) => void;
//     retrying?: boolean;
// }) {
//     return (
//         <div className="grid grid-cols-12 items-center rounded-lg border p-3 sm:p-4">
//             {/* Identity */}
//             <div className="col-span-12 min-w-0 flex items-start gap-3 sm:col-span-7">
//                 <Mail className="size-4 shrink-0 text-muted-foreground" />
//                 <div className="min-w-0">
//                     <div className="flex flex-wrap items-center gap-2">
//                         <span className="truncate font-medium">{e.value}</span>
//                         {e.default && (
//                             <Badge
//                                 variant="outline"
//                                 className="gap-1 bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-900/40 dark:text-blue-400"
//                             >
//                                 <Star className="size-3.5" />
//                                 Default
//                             </Badge>
//                         )}
//                     </div>
//                     <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
//                         <span>Email address</span>
//                         {e.providerHint && <span>·</span>}
//                         <ProviderBadge provider={e.providerHint} />
//                     </div>
//                 </div>
//             </div>
//
//             {/* Status */}
//             <div className="col-span-6 mt-2 sm:col-span-2 sm:mt-0">
//                 <StatusPill status={e.status} loading={retrying && e.status !== "verified"} />
//             </div>
//
//             {/* Actions */}
//             <div className="col-span-6 mt-2 flex flex-wrap justify-end gap-2 sm:col-span-3 sm:mt-0">
//                 {e.status !== "verified" && (
//                     <Button
//                         size="sm"
//                         variant="outline"
//                         className="shrink-0 gap-2"
//                         aria-label={e.status === "failed" ? "Retry verification" : "Resend verification"}
//                         onClick={() => onRetry(e.id)}
//                         disabled={retrying}
//                     >
//                         {retrying ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
//                         {e.status === "failed" ? "Retry" : "Resend"}
//                     </Button>
//                 )}
//                 {!e.default && (
//                     <Button
//                         size="sm"
//                         variant="ghost"
//                         className="shrink-0 gap-2"
//                         aria-label="Make default sender"
//                         onClick={() => onMakeDefault(e.id)}
//                     >
//                         <Star className="size-4" />
//                         Make default
//                     </Button>
//                 )}
//                 <Button
//                     size="sm"
//                     variant="destructive"
//                     className="shrink-0 gap-2"
//                     aria-label="Remove email"
//                     onClick={() => onRemove(e.id)}
//                 >
//                     <Trash2 className="size-4" />
//                     Remove
//                 </Button>
//             </div>
//         </div>
//     );
// }
//
// export default EmailRow;
