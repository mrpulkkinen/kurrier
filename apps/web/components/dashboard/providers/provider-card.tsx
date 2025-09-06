import { ProviderSpec } from "@schema";
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ExternalLink, Globe, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as React from "react";
import StatusBadge from "@/components/dashboard/providers/provider-status-badge";
import EnvRow from "@/components/dashboard/providers/env-row";

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

export default function ProviderCard({ spec }: { spec: ProviderSpec }) {
	const envStatuses = spec.requiredEnv.map((v) => ({
		name: v,
		present: isPresent(v),
	}));
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

	return (
		<Card className="shadow-none relative">
			<CardHeader className="gap-3">
				<div className="flex flex-col gap-3">
					{/* Title + status + description */}
					<div className="flex min-w-0 items-start gap-3">
						<Globe className="mt-1 size-4 shrink-0 text-muted-foreground" />
						<div className="min-w-0">
							<CardTitle className="text-lg sm:text-xl">{spec.name}</CardTitle>
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

			<CardContent className="space-y-4 mb-12">
				<div className="text-xs uppercase tracking-wider text-muted-foreground">
					Required ENV
				</div>

				<div className="space-y-3">
					{envStatuses.map((row) => (
						<EnvRow key={row.name} name={row.name} present={row.present} />
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
			<CardFooter className={"flex justify-end absolute bottom-4 w-full"}>
				<Button
					size={"sm"}
					className={"w-full rounded-xs"}
					variant={"secondary"}
				>
					Save
				</Button>
			</CardFooter>
		</Card>
	);
}
