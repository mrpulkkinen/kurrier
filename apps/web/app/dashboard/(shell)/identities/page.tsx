"use client";

import * as React from "react";
import { Container } from "@/components/common/containers";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Plus,
	Mail,
	Globe,
	CheckCircle2,
	Clock,
	XCircle,
	RefreshCw,
	Star,
	Trash2,
	MoreHorizontal,
	ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types & Mock Data                                                  */
/* ------------------------------------------------------------------ */

type Status = "verified" | "pending" | "failed";
type ProviderHint = "ses" | "sendgrid" | "mailgun" | "postmark" | "smtp";

type DomainIdentity = {
	id: string;
	value: string; // domain
	status: Status;
	providerHint?: ProviderHint;
	note?: string;
};

type EmailIdentity = {
	id: string;
	value: string; // email
	status: Status;
	providerHint?: ProviderHint;
	default?: boolean;
};

const MOCK_DOMAINS: DomainIdentity[] = [
	{
		id: "d1",
		value: "news.acmeco.com",
		status: "pending",
		providerHint: "sendgrid",
		note: "DNS records need to be configured.",
	},
	{
		id: "d2",
		value: "acmeco.com",
		status: "verified",
		providerHint: "ses",
		note: "All emails under this domain can be used.",
	},
];

const MOCK_EMAILS: EmailIdentity[] = [
	{
		id: "e1",
		value: "support@acmeco.com",
		status: "verified",
		providerHint: "ses",
		default: true,
	},
	{
		id: "e2",
		value: "billing@acmeco.com",
		status: "failed",
		providerHint: "smtp",
	},
];

/* ------------------------------------------------------------------ */
/* Small UI Bits                                                      */
/* ------------------------------------------------------------------ */

function StatusPill({ status }: { status: Status }) {
	if (status === "verified") {
		return (
			<Badge className="gap-1 bg-emerald-100 text-emerald-900 dark:bg-emerald-300/15 dark:text-emerald-200">
				<CheckCircle2 className="size-3.5" />
				Verified
			</Badge>
		);
	}
	if (status === "pending") {
		return (
			<Badge className="gap-1 bg-amber-100 text-amber-900 dark:bg-amber-300/20 dark:text-amber-200">
				<Clock className="size-3.5" />
				Pending
			</Badge>
		);
	}
	return (
		<Badge className="gap-1 bg-rose-100 text-rose-900 dark:bg-rose-300/15 dark:text-rose-200">
			<XCircle className="size-3.5" />
			Failed
		</Badge>
	);
}

/** Section header where the action button stays BESIDE the title on larger screens. */
function SectionHeader({
	title,
	count,
	action,
	subtitle,
}: {
	title: string;
	count?: number;
	subtitle?: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="mb-2">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
							{title}
						</h2>
						{typeof count === "number" && (
							<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
								{count}
							</span>
						)}
					</div>
					{subtitle ? (
						<p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
					) : null}
				</div>

				{action ? (
					<div className="sm:ml-4">
						{/* prevent wrapping under title when there’s room */}
						<div className="inline-flex flex-wrap gap-2 sm:flex-nowrap">
							{action}
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Domain Card (responsive; actions remain BELOW card text)           */
/* ------------------------------------------------------------------ */

function DomainCard({ d }: { d: DomainIdentity }) {
	return (
		<Card className="shadow-none">
			<CardHeader className="gap-3">
				<div className="flex flex-col gap-3">
					{/* Title + status + description */}
					<div className="flex min-w-0 items-start gap-3">
						<Globe className="mt-1 size-4 shrink-0 text-muted-foreground" />
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<span className="truncate font-medium">{d.value}</span>
								<StatusPill status={d.status} />
							</div>

							{d.note && (
								<p className="mt-1 text-sm text-muted-foreground">{d.note}</p>
							)}
							<p className="mt-1 text-xs text-muted-foreground">
								{d.providerHint ? `via ${d.providerHint.toUpperCase()}` : ""}
							</p>
						</div>
					</div>

					{/* Actions BELOW (unchanged) */}
					<div className="flex flex-wrap gap-2">
						<Button size="sm" variant="outline" className="gap-2">
							<ExternalLink className="size-4" />
							Docs
						</Button>

						{d.status !== "verified" && (
							<Button size="sm" variant="default" className="gap-2">
								<RefreshCw className="size-4" />
								Verify
							</Button>
						)}

						<Button size="sm" variant="ghost">
							<MoreHorizontal className="size-4" />
						</Button>

						<Button size="sm" variant="destructive" className="gap-2">
							<Trash2 className="size-4" />
							Remove
						</Button>
					</div>
				</div>
			</CardHeader>
		</Card>
	);
}

/* ------------------------------------------------------------------ */
/* Email Row (actions remain to the right)                            */
/* ------------------------------------------------------------------ */

function EmailRow({ e }: { e: EmailIdentity }) {
	return (
		<div className="grid grid-cols-12 items-center rounded-lg border p-3 sm:p-4">
			{/* left */}
			<div className="col-span-12 min-w-0 flex items-start gap-3 sm:col-span-6">
				<Mail className="size-4 shrink-0 text-muted-foreground" />
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<span className="truncate font-medium">{e.value}</span>
						{e.default && (
							<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
								<Star className="size-3.5" />
								Default
							</span>
						)}
					</div>
					<div className="mt-0.5 text-xs text-muted-foreground">
						Email address{e.providerHint ? ` · via ${e.providerHint}` : ""}
					</div>
				</div>
			</div>

			{/* status */}
			<div className="col-span-6 mt-2 sm:col-span-3 sm:mt-0">
				<StatusPill status={e.status} />
			</div>

			{/* actions */}
			<div className="col-span-6 mt-2 flex flex-wrap justify-end gap-2 sm:col-span-3 sm:mt-0">
				{e.status !== "verified" && (
					<Button size="sm" variant="outline" className="shrink-0 gap-2">
						<RefreshCw className="size-4" />
						{e.status === "failed" ? "Retry" : "Resend"}
					</Button>
				)}
				{!e.default && (
					<Button size="sm" variant="ghost" className="shrink-0 gap-2">
						<Star className="size-4" />
						Make default
					</Button>
				)}
				<Button size="sm" variant="destructive" className="shrink-0 gap-2">
					<Trash2 className="size-4" />
					Remove
				</Button>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function IdentitiesPage() {
	const [query, setQuery] = React.useState("");
	const [filter, setFilter] = React.useState<"all" | "email" | "domain">("all");

	const filteredDomains = React.useMemo(() => {
		let out = MOCK_DOMAINS;
		if (query.trim()) {
			const q = query.toLowerCase();
			out = out.filter((d) => d.value.toLowerCase().includes(q));
		}
		if (filter === "domain" || filter === "all") return out;
		return [];
	}, [query, filter]);

	const filteredEmails = React.useMemo(() => {
		let out = MOCK_EMAILS;
		if (query.trim()) {
			const q = query.toLowerCase();
			out = out.filter((e) => e.value.toLowerCase().includes(q));
		}
		if (filter === "email" || filter === "all") return out;
		return [];
	}, [query, filter]);

	return (
		<Container variant="wide">
			{/*<div className={"min-w-7xl my-8"}>*/}

			<div className="my-8 space-y-6">
				<div className="flex items-center justify-between">
					<h1 className="text-xl font-bold text-brand-600">Identities</h1>
				</div>

				<p className="max-w-prose text-sm text-muted-foreground">
					Manage verified domains and email addresses. Use one as your default
					From identity for outbound mail.
				</p>
			</div>

			<Card className="shadow-none">
				<CardHeader className="gap-4">
					<div className="flex w-full flex-col gap-3 justify-center items-baseline">
						{/* filter chips row */}
						<div className="flex flex-wrap items-center gap-2 lg:justify-end">
							{(["all", "email", "domain"] as const).map((k) => (
								<Button
									key={k}
									size="sm"
									variant={filter === k ? "default" : "outline"}
									className="capitalize"
									onClick={() => setFilter(k)}
								>
									{k}
								</Button>
							))}
						</div>

						{/* search + add row */}
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[520px]">
							<input
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search identities…"
								className={cn(
									"h-9 w-full rounded-md border bg-background px-3 text-sm outline-none",
									"focus-visible:ring-2 focus-visible:ring-ring sm:col-span-2",
								)}
							/>
							<Button className="w-full gap-2 sm:w-auto">
								<Plus className="size-4" />
								Add Identity
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-8">
					{/* Domains */}
					<SectionHeader
						title="Domains"
						count={filteredDomains.length}
						action={
							<Button variant="outline" size="sm" className="gap-2">
								<Plus className="size-4" />
								Add Domain
							</Button>
						}
					/>
					{filteredDomains.length === 0 ? (
						<div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
							No domains found.
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
							{filteredDomains.map((d) => (
								<DomainCard key={d.id} d={d} />
							))}
						</div>
					)}

					{/* Emails */}
					<SectionHeader
						title="Emails"
						count={filteredEmails.length}
						action={
							<Button variant="outline" size="sm" className="gap-2">
								<Plus className="size-4" />
								Add Email
							</Button>
						}
					/>
					{filteredEmails.length === 0 ? (
						<div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
							No email identities found.
						</div>
					) : (
						<Card className="shadow-none">
							<CardContent className="space-y-3 pt-4">
								{filteredEmails.map((e) => (
									<EmailRow key={e.id} e={e} />
								))}
							</CardContent>
						</Card>
					)}
				</CardContent>
			</Card>

			{/*</div>*/}
		</Container>
	);
}
