"use client";
import React, { useRef, useState } from "react";
import { MessageAttachmentEntity, MessageEntity } from "@db";
import slugify from "@sindresorhus/slugify";
import { ChevronDown, EllipsisVertical, Reply, Star } from "lucide-react";
import { Temporal } from "@js-temporal/polyfill";
import dynamic from "next/dynamic";
import { ActionIcon } from "@mantine/core";
import { EmailEditorHandle } from "@/components/mailbox/default/editor/email-editor";
import EditorAttachmentItem from "@/components/mailbox/default/editor/editor-attachment-item";
import { PublicConfig } from "@schema";
const EmailEditor = dynamic(
	() => import("@/components/mailbox/default/editor/email-editor"),
	{
		ssr: false,
		loading: () => (
			<div className="py-10 text-sm text-muted-foreground">Loading editor…</div>
		),
	},
);

function getScrollParent(el: HTMLElement): HTMLElement {
	let p: HTMLElement | null = el.parentElement;
	while (p) {
		const s = getComputedStyle(p);
		const canScrollY =
			(s.overflowY === "auto" || s.overflowY === "scroll") &&
			p.scrollHeight > p.clientHeight;
		if (canScrollY) return p;
		p = p.parentElement;
	}
	// window/document scrolling element
	return (document.scrollingElement || document.documentElement) as HTMLElement;
}

function scrollToEditor(
	el: HTMLElement,
	{
		offsetTop = 72, // sticky header height
		extra = 200, // push it further down
		retryDelay = 120, // ms
	} = {},
) {
	const container = getScrollParent(el);
	const isWindow = container === (document.scrollingElement as HTMLElement);
	const cRect = isWindow ? { top: 0 } : container.getBoundingClientRect();
	const eRect = el.getBoundingClientRect();
	const currentTop = isWindow ? window.scrollY : container.scrollTop;

	// target so that the element top sits below the header, *plus* extra padding
	const targetTop = eRect.top - cRect.top + currentTop - offsetTop + extra;

	if (isWindow) {
		window.scrollTo({ top: targetTop, behavior: "smooth" });
	} else {
		container.scrollTo({ top: targetTop, behavior: "smooth" });
	}

	// Retry once after a short delay (accounts for late image/layout shifts)
	setTimeout(() => {
		const e2 = el.getBoundingClientRect();
		const viewBottom = isWindow
			? window.innerHeight
			: (container as HTMLElement).clientHeight;

		// If editor bottom is still hugging the bottom, push a bit more
		const desiredBottomGap = extra; // same as extra
		const bottomGap = viewBottom - e2.bottom;
		if (bottomGap < desiredBottomGap) {
			if (isWindow) {
				window.scrollBy({
					top: desiredBottomGap - bottomGap,
					behavior: "smooth",
				});
			} else {
				(container as HTMLElement).scrollBy({
					top: desiredBottomGap - bottomGap,
					behavior: "smooth",
				});
			}
		}
	}, retryDelay);
}

function EmailRenderer({
	message,
	attachments,
	publicConfig,
	children,
}: {
	message: MessageEntity;
	attachments: MessageAttachmentEntity[];
	publicConfig: PublicConfig;
	children?: React.ReactNode;
}) {
	const formatted = Temporal.Instant.from(message.createdAt.toISOString())
		.toZonedDateTimeISO(Temporal.Now.timeZoneId())
		.toLocaleString("en-GB", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});

	const [showEditor, setShowEditor] = useState<boolean>(false);
	const editorRef = useRef<EmailEditorHandle>(null);

	return (
		<>
			<div className="flex flex-col">
				<h1 className="text-xl font-base">{message.subject || "No Subject"}</h1>

				<div className={"flex justify-between"}>
					<div>
						<div className={"mt-4 flex gap-1 items-center"}>
							<div className={"text-sm font-semibold capitalize"}>
								{message?.from?.value[0]?.name
									? message?.from?.value[0]?.name
									: slugify(String(message?.from?.value[0]?.address), {
											separator: " ",
										})}
							</div>
							<div
								className={"text-xs"}
							>{`<${message?.from?.value[0]?.address ?? message?.from?.value[0]?.name}>`}</div>
						</div>
						<div className={"flex gap-1 items-center"}>
							<div className={"text-xs"}>to support</div>
							<ChevronDown size={12} />
						</div>
					</div>

					<div className={"flex gap-4 items-center"}>
						<div className={"text-xs"}>{formatted}</div>
						<Star size={12} />

						<ActionIcon
							variant={"transparent"}
							onClick={() => {
								setShowEditor(!showEditor);
								// scroll to editor
								window.scrollTo({
									top: document.body.scrollHeight,
									behavior: "smooth",
								});
							}}
						>
							<Reply size={18} />
						</ActionIcon>
						<EllipsisVertical size={18} />
					</div>
				</div>
			</div>

			{children}

			<div className={"border-t border-dotted"}>
				<div className={"font-semibold my-4"}>
					{attachments?.length} attachments
				</div>
				<div className={"flex flex-col"}>
					{attachments?.map((attachment) => {
						return (
							<EditorAttachmentItem
								key={attachment.id}
								attachment={attachment}
								publicConfig={publicConfig}
							/>
						);
					})}
				</div>
			</div>

			{showEditor && (
				<div>
					<EmailEditor
						ref={editorRef}
						message={message}
						onReady={(el) => {
							scrollToEditor(el, { offsetTop: 72, extra: 240 }); // bump extra if you want more space
							requestAnimationFrame(() => editorRef.current?.focus());
						}}
					/>
					<div className="h-40" /> {/* Spacer for comfortable scroll */}
				</div>
			)}
		</>
	);
}

export default EmailRenderer;
