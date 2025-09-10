// "use client";
import { SMTP_SPEC } from "@schema";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FilePlus2, Play, Plus } from "lucide-react";
import * as React from "react";
import StatusBadge from "@/components/dashboard/providers/provider-status-badge";
import EnvRow from "@/components/dashboard/providers/env-row";
import { isPresent } from "@/components/dashboard/providers/provider-card";
import SMTPAccountCard from "@/components/dashboard/providers/smtp-account-card";
import {
	createDrizzleSupabaseClient,
	db,
	smtpAccounts,
	smtpAccountSecrets,
} from "@db";
import { db_rls } from "@db/drizzle/init-db";
import { currentSession } from "@/lib/actions/auth";
import {
	getAccountsWithSecrets,
	getProviderSecrets,
	rlsClient,
} from "@/lib/actions/dashboard";
import NewSmtpAccountForm from "@/components/dashboard/providers/new-smtp-account-form";
import { eq } from "drizzle-orm";

export default async function SMTPCard() {
	// const required = SMTP_SPEC.requiredEnv.map((n) => ({
	// 	name: n,
	// 	present: isPresent(n),
	// 	optional: false,
	// }));
	// const optional = SMTP_SPEC.optionalEnv.map((n) => ({
	// 	name: n,
	// 	present: isPresent(n),
	// 	optional: true,
	// }));
	// const allGood = required.every((e) => e.present);

	// function onTest() {
	// 	alert(
	// 		allGood
	// 			? "SMTP: looks configured (mock)."
	// 			: "SMTP: missing required env vars (mock).",
	// 	);
	// }

	// async function copyTemplate() {
	// 	const requiredLines = SMTP_SPEC.requiredEnv.map((k) => `${k}=`).join("\n");
	// 	const optionalLines = SMTP_SPEC.optionalEnv
	// 		.map((k) => `# ${k}=`)
	// 		.join("\n");
	// 	const block = `# ${SMTP_SPEC.name}\n${requiredLines}\n${optionalLines}\n`;
	// 	await navigator.clipboard.writeText(block);
	// 	alert(".env template copied");
	// }

	// const secrets = userProvider
	//     ? await getProviderSecrets(userProvider.providers.id)
	//     : [];

	const accountsWithSecrets = await getAccountsWithSecrets();

	console.log("accountsWithSecrets", accountsWithSecrets);

	return (
		<>
			<div className={"grid grid-cols-12"}>
				<div className={"col-span-12 flex flex-col"}>
					<Card className="shadow-none">
						<CardHeader className="gap-3">
							{/* stack by default; only go side-by-side on lg */}
							<div className={"flex flex-col"}>
								<CardTitle className="text-lg sm:text-xl">
									{SMTP_SPEC.name}
								</CardTitle>
								<p className="text-sm text-muted-foreground my-1">
									Managed via environment variables. Enable by adding the keys
									to your deployment.
								</p>
								<p className="text-xs text-muted-foreground/80">
									{SMTP_SPEC.help}
								</p>

								<CardAction className="flex w-full flex-wrap gap-2 lg:w-auto lg:flex-nowrap lg:justify-end my-4">
									{/*<StatusBadge ok={allGood} />*/}

									{/*<Button*/}
									{/*    variant="outline"*/}
									{/*    asChild*/}
									{/*    className="h-8 px-3 text-xs lg:h-9 lg:px-4 lg:text-sm"*/}
									{/*>*/}
									{/*    <a*/}
									{/*        href={SMTP_SPEC.docsUrl}*/}
									{/*        target="_blank"*/}
									{/*        rel="noreferrer"*/}
									{/*        className="gap-2"*/}
									{/*    >*/}
									{/*        <ExternalLink className="size-4" />*/}
									{/*        Docs*/}
									{/*    </a>*/}
									{/*</Button>*/}

									{/*<Button*/}
									{/*    variant="outline"*/}
									{/*    onClick={copyTemplate}*/}
									{/*    className="h-8 px-3 text-xs lg:h-9 lg:px-4 lg:text-sm gap-2"*/}
									{/*>*/}
									{/*    <FilePlus2 className="size-4" />*/}
									{/*    Copy .env template*/}
									{/*</Button>*/}

									{/*<Button*/}
									{/*    onClick={onTest}*/}
									{/*    className="h-8 px-3 text-xs lg:h-9 lg:px-4 lg:text-sm gap-2"*/}
									{/*>*/}
									{/*    <Play className="size-4" />*/}
									{/*    Test Connection*/}
									{/*</Button>*/}

									<Button variant={"default"} size={"lg"}>
										<Plus />
										Add SMTP Account
									</Button>
								</CardAction>
							</div>

							{/*<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">*/}
							{/*    /!* left: title + description *!/*/}
							{/*    <div className="space-y-1 lg:max-w-[56ch]">*/}
							{/*        <CardTitle className="text-lg sm:text-xl">*/}
							{/*            {SMTP_SPEC.name}*/}
							{/*        </CardTitle>*/}
							{/*        <p className="text-sm text-muted-foreground">*/}
							{/*            Managed via environment variables. Enable by adding the keys to*/}
							{/*            your deployment.*/}
							{/*        </p>*/}
							{/*        <p className="text-xs text-muted-foreground/80">{SMTP_SPEC.help}</p>*/}
							{/*    </div>*/}

							{/*    /!* right: actions — full width & wrapping on small; tight row on lg *!/*/}
							{/*    <CardAction className="flex w-full flex-wrap gap-2 lg:w-auto lg:flex-nowrap lg:justify-end">*/}
							{/*        <StatusBadge ok={allGood} />*/}

							{/*        <Button*/}
							{/*            variant="outline"*/}
							{/*            asChild*/}
							{/*            className="h-8 px-3 text-xs lg:h-9 lg:px-4 lg:text-sm"*/}
							{/*        >*/}
							{/*            <a*/}
							{/*                href={SMTP_SPEC.docsUrl}*/}
							{/*                target="_blank"*/}
							{/*                rel="noreferrer"*/}
							{/*                className="gap-2"*/}
							{/*            >*/}
							{/*                <ExternalLink className="size-4" />*/}
							{/*                Docs*/}
							{/*            </a>*/}
							{/*        </Button>*/}

							{/*        <Button*/}
							{/*            variant="outline"*/}
							{/*            onClick={copyTemplate}*/}
							{/*            className="h-8 px-3 text-xs lg:h-9 lg:px-4 lg:text-sm gap-2"*/}
							{/*        >*/}
							{/*            <FilePlus2 className="size-4" />*/}
							{/*            Copy .env template*/}
							{/*        </Button>*/}

							{/*        <Button*/}
							{/*            onClick={onTest}*/}
							{/*            className="h-8 px-3 text-xs lg:h-9 lg:px-4 lg:text-sm gap-2"*/}
							{/*        >*/}
							{/*            <Play className="size-4" />*/}
							{/*            Test Connection*/}
							{/*        </Button>*/}
							{/*    </CardAction>*/}
							{/*</div>*/}
						</CardHeader>

						<CardContent className="space-y-5">
							{accountsWithSecrets?.length === 0 && (
								<div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground text-center flex flex-col justify-center items-center">
									<span>
										No SMTP accounts yet. Once you add an account, it will show
										up here.
									</span>
									<NewSmtpAccountForm />
								</div>
							)}

							{/*<div className="space-y-3">*/}
							{/*    <div className="text-xs uppercase tracking-wider text-muted-foreground">*/}
							{/*        Required*/}
							{/*    </div>*/}
							{/*    /!*{required.map((row) => (*!/*/}
							{/*    /!*	<EnvRow key={row.name} name={row.name} present={row.present} />*!/*/}
							{/*    /!*))}*!/*/}
							{/*</div>*/}

							{/*{!!optional.length && (*/}
							{/*    <div className="space-y-3">*/}
							{/*        <div className="text-xs uppercase tracking-wider text-muted-foreground">*/}
							{/*            Optional*/}
							{/*        </div>*/}
							{/*        /!*{optional.map((row) => (*!/*/}
							{/*        /!*	<EnvRow key={row.name} name={row.name} present={row.present} />*!/*/}
							{/*        /!*))}*!/*/}
							{/*    </div>*/}
							{/*)}*/}

							{/*{!allGood && (*/}
							{/*    <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">*/}
							{/*        Add the missing variables above to enable{" "}*/}
							{/*        <strong>{SMTP_SPEC.name}</strong>. Values live in your deployment’s*/}
							{/*        environment — this app doesn’t store provider secrets.*/}
							{/*    </div>*/}
							{/*)}*/}

							{/*<div className={"flex justify-center"}>*/}
							{/*    <Button variant={"secondary"} size={"lg"}>*/}
							{/*        <Plus />*/}
							{/*        Add New SMTP Account*/}
							{/*    </Button>*/}
							{/*</div>*/}

							<SMTPAccountCard />
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);

	// return (
	// 	<Card className="shadow-none">
	// 		<CardHeader className="gap-3">
	// 			{/* stack by default; only go side-by-side on lg */}
	//
	//
	//
	// 			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
	// 				{/* left: title + description */}
	// 				<div className="space-y-1 lg:max-w-[56ch]">
	// 					<CardTitle className="text-lg sm:text-xl">
	// 						{SMTP_SPEC.name}
	// 					</CardTitle>
	// 					<p className="text-sm text-muted-foreground">
	// 						Managed via environment variables. Enable by adding the keys to
	// 						your deployment.
	// 					</p>
	// 					<p className="text-xs text-muted-foreground/80">{SMTP_SPEC.help}</p>
	// 				</div>
	//
	// 				{/* right: actions — full width & wrapping on small; tight row on lg */}
	// 				<CardAction className="flex w-full flex-wrap gap-2 lg:w-auto lg:flex-nowrap lg:justify-end">
	// 					<StatusBadge ok={allGood} />
	//
	// 					<Button
	// 						variant="outline"
	// 						asChild
	// 						className="h-8 px-3 text-xs lg:h-9 lg:px-4 lg:text-sm"
	// 					>
	// 						<a
	// 							href={SMTP_SPEC.docsUrl}
	// 							target="_blank"
	// 							rel="noreferrer"
	// 							className="gap-2"
	// 						>
	// 							<ExternalLink className="size-4" />
	// 							Docs
	// 						</a>
	// 					</Button>
	//
	// 					<Button
	// 						variant="outline"
	// 						onClick={copyTemplate}
	// 						className="h-8 px-3 text-xs lg:h-9 lg:px-4 lg:text-sm gap-2"
	// 					>
	// 						<FilePlus2 className="size-4" />
	// 						Copy .env template
	// 					</Button>
	//
	// 					<Button
	// 						onClick={onTest}
	// 						className="h-8 px-3 text-xs lg:h-9 lg:px-4 lg:text-sm gap-2"
	// 					>
	// 						<Play className="size-4" />
	// 						Test Connection
	// 					</Button>
	// 				</CardAction>
	// 			</div>
	// 		</CardHeader>
	//
	// 		<CardContent className="space-y-5">
	// 			<div className="space-y-3">
	// 				<div className="text-xs uppercase tracking-wider text-muted-foreground">
	// 					Required
	// 				</div>
	// 				{/*{required.map((row) => (*/}
	// 				{/*	<EnvRow key={row.name} name={row.name} present={row.present} />*/}
	// 				{/*))}*/}
	// 			</div>
	//
	// 			{!!optional.length && (
	// 				<div className="space-y-3">
	// 					<div className="text-xs uppercase tracking-wider text-muted-foreground">
	// 						Optional
	// 					</div>
	// 					{/*{optional.map((row) => (*/}
	// 					{/*	<EnvRow key={row.name} name={row.name} present={row.present} />*/}
	// 					{/*))}*/}
	// 				</div>
	// 			)}
	//
	// 			{!allGood && (
	// 				<div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
	// 					Add the missing variables above to enable{" "}
	// 					<strong>{SMTP_SPEC.name}</strong>. Values live in your deployment’s
	// 					environment — this app doesn’t store provider secrets.
	// 				</div>
	// 			)}
	// 		</CardContent>
	// 	</Card>
	// );
}
