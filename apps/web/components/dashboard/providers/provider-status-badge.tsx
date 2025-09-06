import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import * as React from "react";

export default function StatusBadge({ ok }: { ok: boolean }) {
	return ok ? (
		<Badge className="gap-1" variant="default">
			<CheckCircle2 className="size-3.5" />
			Configured
		</Badge>
	) : (
		<Badge className="gap-1 bg-amber-100 text-amber-900 dark:bg-amber-300/20 dark:text-amber-200">
			<XCircle className="size-3.5" />
			Missing env
		</Badge>
	);
}
