"use client";
import { FormState, ProviderSpec } from "@schema";
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ExternalLink, Globe, Loader2Icon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as React from "react";
import StatusBadge from "@/components/dashboard/providers/provider-status-badge";
import EnvRow from "@/components/dashboard/providers/env-row";
import {
	ProviderSecretRow,
	ProviderSecretsResult,
	saveProviderEnv,
	SyncProvidersRow,
} from "@/lib/actions/dashboard";
import { useActionState } from "react";
import { signup } from "@/lib/actions/auth";
import Form from "next/form";

/** In OSS mode these are read from process.env; here we just simulate presence. */
export function isPresent(envVar: string) {
	// Feel free to swap this mock with a real server-provided map
	const mockPresent = new Set<string>([
		// "SES_ACCESS_KEY_ID",
		// "SES_SECRET_ACCESS_KEY",
		// "SES_REGION",
		// "SES_FROM_EMAIL",
		// "SENDGRID_API_KEY",
		// "SENDGRID_FROM_EMAIL",
		// "MAILGUN_API_KEY",
		// "MAILGUN_DOMAIN",
		// "MAILGUN_FROM_EMAIL",
		// "POSTMARK_SERVER_TOKEN",
		// "POSTMARK_FROM_EMAIL",
	]);
	return mockPresent.has(envVar);
}

export default function ProviderCard({
	spec,
	userProvider,
	secrets,
}: {
	spec: ProviderSpec;
	userProvider: SyncProvidersRow;
	secrets: ProviderSecretsResult;
}) {
	console.log("secrets", secrets);

	const presentKeys = new Set(
		secrets
			// .filter(s => !!s.vault?.decrypted_secret)      // <- drop this line if “exists at all” is enough
			.map((s) => s.providerSecret?.keyName)
			.filter(Boolean) as string[],
	);

	const envStatuses = spec.requiredEnv.map((name) => ({
		name,
		present: presentKeys.has(name),
		secret: secrets.find(
			(s) => s.providerSecret?.keyName === name,
		) as ProviderSecretRow,
	}));

	// const envStatuses = spec.requiredEnv.map((v) => ({
	// 	name: v,
	// 	present: isPresent(v),
	// }));
	const allGood = envStatuses.every((e) => e.present);

	function onTest() {
		// Placeholder: trigger a provider-wide health check (ping or sample send)
		// For now just toast/alert
		alert(
			allGood
				? `${spec.name}: looks configured (mock).`
				: `${spec.name}: missing env vars (mock).`,
		);
	}

	const [formState, formAction, isPending] = useActionState<
		FormState,
		FormData
	>(saveProviderEnv, {});

	return (
		<Form action={formAction}>
			<Card className="shadow-none relative">
				<CardHeader className="gap-3">
					<div className="flex flex-col gap-3">
						{/* Title + status + description */}
						<div className="flex min-w-0 items-start gap-3">
							<Globe className="mt-1 size-4 shrink-0 text-muted-foreground" />
							<div className="min-w-0">
								<CardTitle className="text-lg sm:text-xl">
									{spec.name}
								</CardTitle>
								<small>{userProvider?.providers.id}</small>
								<p className="text-sm text-muted-foreground">
									Managed via environment variables. Toggle by adding/removing
									keys.
								</p>
							</div>
						</div>

						{/* Actions BELOW (unchanged) */}
						<div className="flex flex-wrap gap-2">
							<CardAction className="flex w-full flex-wrap gap-2 lg:w-auto lg:flex-nowrap lg:justify-end">
								<StatusBadge ok={allGood} />

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
									onClick={onTest}
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
						<input
							type={"hidden"}
							name={"providerId"}
							value={userProvider.providers.id}
						/>
						{envStatuses.map((row) => (
							<EnvRow
								key={row.name}
								name={`keys.${row.name}`}
								rowName={row.name}
								present={row.present}
								secret={row.secret}
							/>
						))}
					</div>

					{!allGood && (
						<div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
							Add the missing variables above to enable{" "}
							<strong>{spec.name}</strong>. Values live in your deployment’s
							environment — this app doesn’t store provider secrets.
						</div>
					)}
				</CardContent>
				<CardFooter
					className={"flex justify-end absolute bottom-4 w-full flex-col gap-2"}
				>
					{formState.error && (
						<div className={"text-center bg-red-50 w-full"}>
							<span className="text-sm text-red-600">{formState.error}</span>
						</div>
					)}
					<Button
						size={"sm"}
						type={"submit"}
						className={"w-full rounded-xs"}
						variant={"secondary"}
						disabled={isPending}
					>
						{isPending && <Loader2Icon className="animate-spin" />}
						Save
					</Button>
				</CardFooter>
			</Card>
		</Form>
	);
}
