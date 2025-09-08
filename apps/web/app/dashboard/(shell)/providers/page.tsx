import * as React from "react";
import { Container } from "@/components/common/containers";
import { PROVIDERS } from "@schema";
import SMTPCard from "@/components/dashboard/providers/smtp-card";
import {syncProviders} from "@/lib/actions/dashboard";
import ProviderCardShell from "@/components/dashboard/providers/provider-card-shell";

export default async function ProvidersPage() {
    const userProviders = await syncProviders()


	return (
		<Container variant="wide">
			<div className="my-8 space-y-6">
				<div className="flex items-center justify-between">
					<h1 className="text-xl font-bold text-brand-600">Providers</h1>
				</div>

				<p className="max-w-prose text-sm text-muted-foreground">
					Configure email providers by setting environment variables. We never
					store your credentials; the app only checks whether required keys
					exist and then performs a provider-level test when you ask it to.
				</p>

				<div className="grid gap-6 lg:grid-cols-2">
					{PROVIDERS.map((p) => (
                        <ProviderCardShell key={p.key} spec={p} userProviders={userProviders} />
					))}
				</div>
				<div className="grid gap-6">
					<SMTPCard />
				</div>
			</div>
		</Container>
	);
}
