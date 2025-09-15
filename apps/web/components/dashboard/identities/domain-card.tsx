import React from 'react';
import {DomainIdentity} from "@/app/dashboard/(shell)/identities/page";
import {Card, CardHeader} from "@/components/ui/card";
import {ExternalLink, Globe, Info, Loader2, MoreHorizontal, RefreshCw, Trash2} from "lucide-react";
import {Button} from "@mantine/core";
import StatusPill from "@/components/dashboard/identities/status-pill";
import ProviderBadge from "@/components/dashboard/identities/provider-badge";

function DomainCard({
                        d,
                        onVerify,
                        verifying,
                    }: {
    d: DomainIdentity;
    onVerify: (id: string) => void;
    verifying?: boolean;
}) {
    return (
        <Card className="shadow-none">
            <CardHeader className="gap-3">
                <div className="flex flex-col gap-3">
                    {/* Title line */}
                    <div className="flex min-w-0 items-start gap-3">
                        <Globe className="mt-1 size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="truncate font-medium">{d.value}</span>
                                <StatusPill status={d.status} loading={verifying} compact />
                            </div>

                            {/* Meta row */}
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {d.note && (
                                    <span className="inline-flex items-center gap-1">
                    <Info className="size-3.5" />
                                        {d.note}
                  </span>
                                )}
                                {d.providerHint && (
                                    <>
                                        <span className="opacity-40">·</span>
                                        <ProviderBadge provider={d.providerHint} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            aria-label="Open provider docs"
                        >
                            <ExternalLink className="size-4" />
                            Docs
                        </Button>

                        {d.status !== "verified" && (
                            <Button
                                size="sm"
                                className="gap-2"
                                aria-label="Verify domain"
                                onClick={() => onVerify(d.id)}
                                disabled={verifying}
                            >
                                {verifying ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Verifying…
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="size-4" />
                                        Verify
                                    </>
                                )}
                            </Button>
                        )}

                        <Button size="sm" variant="ghost" aria-label="More actions">
                            <MoreHorizontal className="size-4" />
                        </Button>

                        <Button
                            size="sm"
                            variant="destructive"
                            className="gap-2"
                            aria-label="Remove domain"
                        >
                            <Trash2 className="size-4" />
                            Remove
                        </Button>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}

export default DomainCard;
