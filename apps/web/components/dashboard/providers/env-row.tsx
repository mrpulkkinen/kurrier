import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EnvRow({
	name,
	present,
}: {
	name: string;
	present: boolean;
}) {
	const [copied, setCopied] = React.useState(false);

	async function copy() {
		await navigator.clipboard.writeText(name);
		setCopied(true);
		setTimeout(() => setCopied(false), 900);
	}

	return (
		<div className="grid grid-cols-12 items-center rounded-lg border p-3 sm:p-4">
			<div className="col-span-12 sm:col-span-6">
				<code className="rounded bg-muted/50 px-2 py-1 text-sm">{name}</code>
			</div>
			<div className="col-span-6 mt-2 flex items-center sm:col-span-3 sm:mt-0">
				<span
					className={cn(
						"inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs",
						present
							? "bg-emerald-100 text-emerald-900 dark:bg-emerald-300/15 dark:text-emerald-200"
							: "bg-muted text-muted-foreground",
					)}
				>
					{present ? (
						<>
							<CheckCircle2 className="size-3.5" /> Present
						</>
					) : (
						<>
							<input />
							{/*<Edit className="size-3.5"/>*/}
							{/*<XCircle className="size-3.5" /> Missing*/}
						</>
					)}
				</span>
			</div>
			<div className="col-span-6 mt-2 flex justify-end gap-2 sm:col-span-3 sm:mt-0">
				<Button
					size="sm"
					variant="ghost"
					onClick={copy}
					className="gap-2"
					title="Copy variable name"
				>
					{copied ? (
						<CheckCircle2 className="size-4" />
					) : (
						<Copy className="size-4" />
					)}
				</Button>
			</div>
		</div>
	);
}
