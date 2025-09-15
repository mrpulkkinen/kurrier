import React from 'react';
import {Badge} from "@/components/ui/badge";
import {cn} from "@/lib/utils";
import {CheckCircle2, Clock, Loader2, XCircle} from "lucide-react";
import {Status} from "@/app/dashboard/(shell)/identities/page";

function StatusPill({
                        status,
                        loading = false,
                        compact,
                    }: {
    status: Status;
    loading?: boolean;
    compact?: boolean;
}) {
    const base = "gap-1";
    if (loading) {
        return (
            <Badge className={cn(base, "bg-muted text-muted-foreground")}>
                <Loader2 className="size-3.5 animate-spin" />
                Verifying…
            </Badge>
        );
    }
    if (status === "verified") {
        return (
            <Badge className={cn(base, "bg-emerald-100 text-emerald-900 dark:bg-emerald-300/15 dark:text-emerald-200")}>
                <CheckCircle2 className="size-3.5" />
                {compact ? "OK" : "Verified"}
            </Badge>
        );
    }
    if (status === "pending") {
        return (
            <Badge className={cn(base, "bg-amber-100 text-amber-900 dark:bg-amber-300/20 dark:text-amber-200")}>
                <Clock className="size-3.5" />
                Pending DNS
            </Badge>
        );
    }
    return (
        <Badge className={cn(base, "bg-rose-100 text-rose-900 dark:bg-rose-300/15 dark:text-rose-200")}>
            <XCircle className="size-3.5" />
            Failed
        </Badge>
    );
}

export default StatusPill;
