"use client";

import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import type { MessageEntity } from "@db";

export default function EmailViewer({ message }: { message: MessageEntity }) {
    const hostRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hostRef.current) return;

        let shadow = hostRef.current.shadowRoot;
        if (!shadow) shadow = hostRef.current.attachShadow({ mode: "open" });

        if (message.html && message.html.trim()) {
            // Basic sanitize: strips <script>, inline event handlers, javascript: URLs, etc.
            const safeHtml = DOMPurify.sanitize(message.html, {
                USE_PROFILES: { html: true },
            });

            shadow.innerHTML = safeHtml;
        } else {
            shadow.innerHTML = `<pre>${message.text || "No content"}</pre>`;
        }
    }, [message.html, message.text]);

    return (
        <div
            ref={hostRef}
            style={{ display: "block", width: "100%", minHeight: 200 }}
            className={"mb-24"}
        />
    );
}
