"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import type { MessageEntity } from "@db";
import { ActionIcon } from "@mantine/core";
import { Ellipsis } from "lucide-react";

const QUOTE_HIDE_CSS = `
  /* Gmail / generic */
  blockquote,
  blockquote[type="cite"],
  .gmail_quote,
  .gmail_quote_container blockquote,
  /* Thunderbird */
  .moz-cite-prefix + blockquote,
  /* Outlook-style nested replies sometimes use borders on <div> */
  div[style*="border-left"][style*="solid"] blockquote {
    display: none !important;
  }
`;

export default function EmailViewer({ message }: { message: MessageEntity }) {
	const hostRef = useRef<HTMLDivElement>(null);
	const [hideQuotes, setHideQuotes] = useState(true);

	// Detect if the HTML likely contains quoted/replied content
	const hasQuotes = useMemo(() => {
		const html = message.html || "";
		if (!html.trim()) return false;
		return /<blockquote\b|class=["']gmail_quote|blockquote\s+type=["']cite|class=["']moz-cite-prefix/i.test(
			html,
		);
	}, [message.html]);

	useEffect(() => {
		if (!hostRef.current) return;

		let shadow = hostRef.current.shadowRoot;
		if (!shadow) shadow = hostRef.current.attachShadow({ mode: "open" });

		// Choose HTML vs text
		const rawHtml =
			message.html && message.html.trim()
				? message.html
				: `<pre>${(message.text || "No content")
						.toString()
						.replace(
							/[<>&]/g,
							(c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] as string,
						)}</pre>`;

		// Sanitize (strips scripts, event handlers, javascript: URLs, etc.)
		const safeHtml = DOMPurify.sanitize(rawHtml, {
			USE_PROFILES: { html: true },
		});

		// Inject style (toggled) + content into shadow root
		// We keep the style in its own tag so we can update it cheaply if you want later.
		shadow.innerHTML = `
      <style id="quote-style">${hideQuotes ? QUOTE_HIDE_CSS : ""}</style>
      <div class="email-root">${safeHtml}</div>
    `;

		// Post-process links inside the shadow root
		const root = shadow.querySelector(".email-root") as HTMLElement | null;
		if (root) {
			const links = root.querySelectorAll<HTMLAnchorElement>("a[href]");
			links.forEach((a) => {
				a.target = "_blank";
				a.rel = "nofollow noopener noreferrer";
			});
		}
	}, [message.html, message.text, hideQuotes]);

	return (
		<div className="mb-24">
			<div ref={hostRef} style={{ display: "block", width: "100%" }} />
			{hasQuotes && (
				<ActionIcon
					type="button"
					variant={"light"}
					size={"xs"}
					onClick={() => setHideQuotes((v) => !v)}
					className="my-2 text-sm px-2 py-1 rounded border hover:bg-gray-50"
				>
					{hideQuotes ? <Ellipsis size={16} /> : <Ellipsis size={16} />}
				</ActionIcon>
			)}
		</div>
	);
}

// "use client";
//
// import { useEffect, useRef } from "react";
// import DOMPurify from "dompurify";
// import type { MessageEntity } from "@db";
//
// export default function EmailViewer({ message }: { message: MessageEntity }) {
// 	const hostRef = useRef<HTMLDivElement>(null);
//
// 	useEffect(() => {
// 		if (!hostRef.current) return;
//
// 		let shadow = hostRef.current.shadowRoot;
// 		if (!shadow) shadow = hostRef.current.attachShadow({ mode: "open" });
//
// 		if (message.html && message.html.trim()) {
// 			// Basic sanitize: strips <script>, inline event handlers, javascript: URLs, etc.
// 			const safeHtml = DOMPurify.sanitize(message.html, {
// 				USE_PROFILES: { html: true },
// 			});
//
// 			shadow.innerHTML = safeHtml;
// 		} else {
// 			shadow.innerHTML = `<pre>${message.text || "No content"}</pre>`;
// 		}
// 	}, [message.html, message.text]);
//
// 	return (
// 		<div
// 			ref={hostRef}
// 			style={{ display: "block", width: "100%", minHeight: 200 }}
// 			className={"mb-24"}
// 		/>
// 	);
// }
