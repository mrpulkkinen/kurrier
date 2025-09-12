"use client";
import { ProviderSpec } from "@schema";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ExternalLink, Globe, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as React from "react";
import {
	FetchDecryptedSecretsResult,
	SyncProvidersRow,
} from "@/lib/actions/dashboard";
import ProviderEditForm from "@/components/dashboard/providers/provider-edit-form";

export default function ProviderCard({
	spec,
	userProvider,
	decryptedSecrets,
}: {
	spec: ProviderSpec;
	userProvider: SyncProvidersRow;
	decryptedSecrets: FetchDecryptedSecretsResult;
}) {
	return (
		<Card className="shadow-none relative">
			<CardHeader className="gap-3">
				<div className="flex flex-col gap-3">
					<div className="flex min-w-0 items-start gap-3">
						<Globe className="mt-1 size-4 shrink-0 text-muted-foreground" />
						<div className="min-w-0">
							<CardTitle className="text-lg sm:text-xl">{spec.name}</CardTitle>
							{/*<small>{userProvider?.providers.id}</small>*/}
							<p className="text-sm text-muted-foreground">
								Managed via environment variables. Toggle by adding/removing
								keys.
							</p>
						</div>
					</div>

					{/* Actions BELOW (unchanged) */}
					<div className="flex flex-wrap gap-2">
						<CardAction className="flex w-full flex-wrap gap-2 lg:w-auto lg:flex-nowrap lg:justify-end">
							{/*<StatusBadge ok={allGood} />*/}

							<Button
								variant="outline"
								asChild
								className="h-8 px-3 text-xs lg:h-9 lg:px-4 lg:text-sm"
							>
								<a
									href={spec.docsUrl}
									target="_blank"
									rel="noreferrer"
									className="gap-2"
								>
									<ExternalLink className="size-4" />
									Docs
								</a>
							</Button>

							<Button
								// onClick={onTest}
								className="h-8 px-3 text-xs lg:h-9 lg:px-4 lg:text-sm gap-2"
							>
								<Play className="size-4" />
								Test Connection
							</Button>
						</CardAction>
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-4 mb-16">
				<div className="text-xs uppercase tracking-wider text-muted-foreground">
					Required ENV
				</div>

				<div className="space-y-3">
					<input type={"hidden"} name={"providerId"} value={userProvider.id} />
					<ProviderEditForm
						spec={spec}
						providerId={userProvider.id}
						decryptedSecrets={decryptedSecrets}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
