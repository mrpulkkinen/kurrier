import React from "react";
import { Archive, MoreHorizontal, Trash2 } from "lucide-react";

function MailListHeader() {
	return (
		<div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-3 py-2 backdrop-blur">
			<input
				type="checkbox"
				// checked={allSelected}
				// onChange={toggleAll}
				aria-label="Select all"
				className="h-4 w-4 rounded border-muted-foreground/40"
			/>
			<div className="ml-auto flex items-center gap-1 text-muted-foreground">
				<button
					type="button"
					className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-muted"
					title="Archive"
				>
					<Archive className="h-4 w-4" />
				</button>
				<button
					type="button"
					className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-muted"
					title="Delete"
				>
					<Trash2 className="h-4 w-4" />
				</button>
				<button
					type="button"
					className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-muted"
					title="More"
				>
					<MoreHorizontal className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}

export default MailListHeader;
