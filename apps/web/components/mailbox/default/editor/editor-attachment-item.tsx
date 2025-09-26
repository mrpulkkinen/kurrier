import React, { useEffect, useState } from "react";
import { MessageAttachmentEntity } from "@db";
import { PublicConfig } from "@schema";
import { createClient } from "@/lib/supabase/client";

function EditorAttachmentItem({
	attachment,
	publicConfig,
}: {
	attachment: MessageAttachmentEntity;
	publicConfig: PublicConfig;
}) {
	const supabase = createClient(publicConfig);

	const [url, setUrl] = useState<string | null>(null);

	const generateUrl = async () => {
		const { data } = await supabase.storage
			.from("attachments")
			.createSignedUrl(attachment.path, 60, {
				download: true,
			});

		setUrl(data?.signedUrl || null);
	};

	useEffect(() => {
		generateUrl();
	}, [attachment]);

	return (
		<>
			<a
				key={attachment.id}
				href={url || "#"}
				target={"_blank"}
				rel={"noreferrer noopener"}
				download
				className={"flex items-center gap-4 mb-2 hover:bg-base-200 p-2 rounded"}
			>
				<div
					className={
						"w-8 h-8 flex items-center justify-center bg-base-300 rounded"
					}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
						/>
					</svg>
				</div>
				<div className={"flex flex-col"}>
					<div className={"text-sm font-medium underline"}>
						{attachment.filenameOriginal}
					</div>
					{attachment?.sizeBytes && (
						<div className={"text-xs text-muted-foreground"}>
							{(attachment?.sizeBytes / 1024).toFixed(2)} KB
						</div>
					)}
				</div>
			</a>
		</>
	);
}

export default EditorAttachmentItem;
