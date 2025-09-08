import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, Eye, EyeOff } from "lucide-react";
import React from "react";
import { Input } from "@/components/ui/input";
import { ProviderSecretRow } from "@/lib/actions/dashboard";

export default function EnvRow({
	name,
	rowName,
	present,
	secret,
}: {
	name: string;
	rowName: string;
	present: boolean;
	secret: ProviderSecretRow;
}) {
	const [copied, setCopied] = React.useState(false);

	async function copy() {
		await navigator.clipboard.writeText(name);
		setCopied(true);
		setTimeout(() => setCopied(false), 900);
	}

	const [hide, setHide] = React.useState(true);

	return (
		<div className="flex flex-col gap-2 rounded-lg border p-3 sm:p-4">
			<div className="flex justify-between items-center">
				<code className="rounded bg-muted/50 px-2 py-1 text-xs">{rowName}</code>
				<div className={"flex justify-end"}>
					<Button
						size="sm"
						type={"button"}
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
					<Button
						size="sm"
						type={"button"}
						variant="ghost"
						onClick={() => setHide((s) => !s)}
						title={hide ? "Hide value" : "Show value"}
					>
						{hide ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
					</Button>
				</div>
			</div>

			<div>
				<Input
					defaultValue={secret?.vault?.decrypted_secret || ""}
					onFocus={() => setHide(false)}
					onBlur={() => setHide(true)}
					required={true}
					name={name}
					type={!hide ? "text" : "password"}
					className="h-10 w-full text-base"
				/>
			</div>
		</div>
	);
}
