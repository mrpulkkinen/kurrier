import '@mantine/tiptap/styles.css';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image'

import React, {forwardRef, useImperativeHandle, useMemo, useRef, useState} from 'react';
import {ActionIcon, Button, Popover} from "@mantine/core";

export type TextEditorHandle = {
    focus: (where?: 'start' | 'end') => void;
    getElement: () => HTMLElement | null;
    getHTML: () => string;
};

type TextEditorProps = {
    name?: string;
    defaultValue?: string;
    onChange?: (html: string) => void;
    message: MessageEntity;
};


import {Baseline} from "lucide-react";
import {MessageEntity} from "@db";
import {Temporal} from "@js-temporal/polyfill";
import DOMPurify from "dompurify";
import EmailViewer from "@/components/mailbox/default/email-viewer";

function formatWhen(d: Date) {
    return Temporal.Instant.from(d.toISOString())
        .toZonedDateTimeISO(Temporal.Now.timeZoneId())
        .toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: false,
        });
}

function buildQuotedHtml(msg: MessageEntity, extraTopHtml = "") {
    const from = msg.fromName || msg.fromEmail || "Unknown sender";
    const when = msg.date ? formatWhen(new Date(msg.date)) : "";
    // const raw = msg.html || msg.textAsHtml || (msg.text ? `<pre>${msg.text}</pre>` : "");
    // const raw = msg.html
    // const raw = msg.textAsHtml
    const raw = ""
    const safeBody = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });

    return `
${extraTopHtml || "<p><br></p>"}
<p class="reply-preamble">On ${when}, ${from} wrote:</p>
<blockquote class="quoted-email">${safeBody}</blockquote>
`;
}

export const TextEditor = forwardRef<TextEditorHandle, TextEditorProps>(
    ({ name, defaultValue = '', onChange, message }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const [value, setValue] = useState(defaultValue);

        const initialHtml = useMemo(
            () => buildQuotedHtml(message, defaultValue),
            [message, defaultValue]
        );

        const editor = useEditor({
            immediatelyRender: false,
            parseOptions: { preserveWhitespace: 'full' },
            extensions: [StarterKit, Link, Image],
            // content: value,
            // content: initialHtml,
            // content: '<div class="text-3xl text-red-600">yay</div>',                        // set initial content
            onUpdate: ({ editor }) => {
                const html = editor.getText().trim().length ? editor.getHTML().trim() : '';
                setValue(html);
                onChange?.(html);
            },
        });

        useImperativeHandle(ref, () => ({
            focus: (where = 'end') => {
                if (!editor) return;
                editor.commands.focus(where);
            },
            getElement: () => containerRef.current,
            getHTML: () => value,
        }), [editor, value]);

        return (
            <div ref={containerRef} className="scroll-mt-[72px] mb-40">
                <RichTextEditor editor={editor}>

                    <div className={"border-b"}>
                        ajhsdk

                    </div>


                    <RichTextEditor.Content className="prose min-h-52 text-sm p-2 leading-5" />

                    <div className={"border-t items-center flex py-2"}>
                        <div className={"mx-2"}>
                            <Button size={"xs"} radius={"xl"}>Send</Button>
                        </div>

                        <Popover position="top-start" withArrow shadow="md">
                            <Popover.Target>
                                <ActionIcon variant={"transparent"}>
                                    <Baseline />
                                </ActionIcon>
                            </Popover.Target>
                            <Popover.Dropdown className={"!p-0"}>
                                <RichTextEditor.Toolbar sticky stickyOffset={60} className={"!border-0"}>
                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.Bold />
                                        <RichTextEditor.Italic />
                                        <RichTextEditor.Underline />
                                        <RichTextEditor.Strikethrough />
                                        <RichTextEditor.ClearFormatting />
                                    </RichTextEditor.ControlsGroup>

                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.BulletList />
                                        <RichTextEditor.OrderedList />
                                    </RichTextEditor.ControlsGroup>

                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.Undo />
                                        <RichTextEditor.Redo />
                                    </RichTextEditor.ControlsGroup>
                                </RichTextEditor.Toolbar>
                            </Popover.Dropdown>
                        </Popover>


                    </div>
                </RichTextEditor>

                <span className="text-xs text-neutral-500">Press Shift + Enter for a line break</span>
                {/* keep a hidden input if you need form submit compatibility */}
                {name ? <input type="hidden" name={name} value={value} readOnly /> : null}
            </div>
        );
    }
);

TextEditor.displayName = 'TextEditor';
